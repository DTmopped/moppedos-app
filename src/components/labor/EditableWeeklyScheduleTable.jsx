import React from 'react';
import { addDays, format, isValid, parse as parseTime, format as formatTime } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useData } from '@/contexts/DataContext';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate }) => {
  const { isAdminMode } = useData();

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  });

  const orderedRoles = [
    'Meat Portioner',
    'Side Portioner',
    'Food Gopher',
    'Cashier',
    'Bartender',
    'Kitchen Swing',
    'Cashier Swing',
    'Shift Lead'
  ];

  const getShiftsForRole = (roleName) => {
    const role = ROLES.find(r => r.name === roleName);
    return role?.shifts || [];
  };

  const formatTo12Hour = (timeStr) => {
    try {
      const parsed = parseTime(timeStr, 'HH:mm', new Date());
      return isValid(parsed) ? formatTime(parsed, 'h:mm a') : timeStr;
    } catch {
      return timeStr;
    }
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const slots = (scheduleData?.[dateKey] || []).filter(
      slot => slot.role === role && slot.shift === shift
    );

    return (
      <div className="min-h-[64px] border rounded p-2 bg-slate-50 dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
        {slots.length === 0 ? (
          <div className="text-xs text-slate-400 italic">Off / No Shift</div>
        ) : (
          slots.map((entry) => (
            <div
              key={`${role}-${shift}-${entry.slotIndex}`}
              className="text-xs text-slate-600 dark:text-slate-300 space-y-1"
            >
              <input
                type="text"
                placeholder="Name"
                value={entry.employeeName || ''}
                onChange={(e) =>
                  onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'employeeName', e.target.value)
                }
                className="w-full border-b text-xs outline-none bg-transparent placeholder:text-slate-400"
              />
              <div className="flex space-x-1 text-xs">
                <input
                  type="text"
                  value={formatTo12Hour(entry.startTime || SHIFT_TIMES[entry.shift]?.start || '')}
                  onChange={(e) =>
                    onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'startTime', e.target.value)
                  }
                  readOnly={!isAdminMode}
                  className={cn(
                    "w-[70px] border-b outline-none",
                    isAdminMode ? "bg-yellow-100" : "bg-transparent"
                  )}
                />
                <span>–</span>
                <input
                  type="text"
                  value={formatTo12Hour(entry.endTime || SHIFT_TIMES[entry.shift]?.end || '')}
                  onChange={(e) =>
                    onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'endTime', e.target.value)
                  }
                  readOnly={!isAdminMode}
                  className={cn(
                    "w-[70px] border-b outline-none",
                    isAdminMode ? "bg-yellow-100" : "bg-transparent"
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300 dark:border-slate-700">
      <td className="p-2 align-top text-slate-700 dark:text-slate-200 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">{role}</span>
          <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-xs uppercase">{shift}</span>
        </div>
      </td>
      {weekDates.map((date, idx) => (
        <td key={idx} className="p-2 align-top">
          {date ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid</div>}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="printable-area overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {date ? format(date, 'EEE MM/dd') : <span className="text-red-500">Invalid</span>}
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
