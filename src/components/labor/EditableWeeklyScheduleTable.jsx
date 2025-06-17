// EditableWeeklyScheduleTable.jsx
import React, { useState } from 'react';
import { addDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const formatTime12Hour = (timeStr) => {
  const [hour, minute] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hour), parseInt(minute));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate, adminMode = false }) => {
  const [editingCell, setEditingCell] = useState(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const orderedRoles = [
    'Meat Portioner', 'Side Portioner', 'Food Gopher',
    'Cashier', 'Bartender',
    'Kitchen Swing', 'Cashier Swing',
    'Shift Lead'
  ];

  const getShiftsForRole = (roleName) => ROLES.find(r => r.name === roleName)?.shifts || [];

  const handleTimeChange = (dateKey, shift, role, idx, field, value) => {
    const updated = { ...scheduleData };
    updated[dateKey] = updated[dateKey] || {};
    updated[dateKey][shift] = updated[dateKey][shift] || {};
    updated[dateKey][shift][role] = updated[dateKey][shift][role] || [];
    updated[dateKey][shift][role][idx] = {
      ...updated[dateKey][shift][role][idx],
      [field]: value,
    };
    onUpdate(updated);
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const entries = scheduleData?.[dateKey]?.[shift]?.[role] || [];

    return (
      <div className={cn("min-h-[64px] border rounded p-2", editingCell?.key === `${dateKey}-${shift}-${role}` && adminMode ? 'bg-yellow-100' : 'bg-white')}
        onClick={() => adminMode && setEditingCell({ key: `${dateKey}-${shift}-${role}` })}>
        {entries.length === 0 && (
          <div className="text-xs text-slate-400 italic">—</div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className="text-xs text-slate-700">
            <input
              type="text"
              value={entry.name || ''}
              onChange={(e) => handleTimeChange(dateKey, shift, role, idx, 'name', e.target.value)}
              placeholder="Unassigned"
              className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-black mr-1"
            />
            {adminMode && editingCell?.key === `${dateKey}-${shift}-${role}` ? (
              <>
                <input
                  type="text"
                  value={entry.start}
                  onChange={(e) => handleTimeChange(dateKey, shift, role, idx, 'start', e.target.value)}
                  placeholder="Start"
                  className="w-[60px] ml-1 text-xs border rounded p-0.5"
                />
                <input
                  type="text"
                  value={entry.end}
                  onChange={(e) => handleTimeChange(dateKey, shift, role, idx, 'end', e.target.value)}
                  placeholder="End"
                  className="w-[60px] ml-1 text-xs border rounded p-0.5"
                />
              </>
            ) : (
              <span className="ml-1 text-xs text-gray-500">({formatTime12Hour(entry.start)} – {formatTime12Hour(entry.end)})</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300">
      <td className="p-2 font-medium text-slate-700 whitespace-nowrap">{role} ({shift})</td>
      {weekDates.map((date, idx) => (
        <td key={idx} className="p-2 align-top">
          {isValid(date) ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid</div>}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {isValid(date) ? format(date, 'EEE MM/dd') : 'Invalid'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orderedRoles.flatMap(role =>
            getShiftsForRole(role).map(shift => renderRoleRow(role, shift))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
