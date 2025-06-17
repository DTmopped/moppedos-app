import React, { useContext } from 'react';
import { addDays, format, isValid, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { DataContext } from '@/contexts/DataContext';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate }) => {
  const { isAdminMode } = useContext(DataContext);

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

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const defaultTimes = SHIFT_TIMES[shift];
    const slots = scheduleData?.[dateKey]?.[shift]?.[role] || [];

    return (
      <div className="min-h-[64px] border rounded p-2 bg-white dark:bg-slate-900">
        {slots.length === 0 && (
          <div className="text-xs text-slate-400 italic">—</div>
        )}
        {slots.map((entry, idx) => (
          <div key={idx} className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={entry.name || ''}
              onChange={(e) =>
                onUpdate(dateKey, role, shift, idx, 'name', e.target.value)
              }
              className="w-full border-b text-xs outline-none bg-transparent placeholder:text-slate-400"
            />
            <div className="flex space-x-1 text-xs">
              <input
                type="text"
                value={entry.start || defaultTimes.start}
                onChange={(e) =>
                  onUpdate(dateKey, role, shift, idx, 'start', e.target.value)
                }
                readOnly={!isAdminMode}
                className={cn(
                  "w-[60px] border-b outline-none",
                  isAdminMode ? "bg-yellow-100" : "bg-transparent"
                )}
              />
              <span>–</span>
              <input
                type="text"
                value={entry.end || defaultTimes.end}
                onChange={(e) =>
                  onUpdate(dateKey, role, shift, idx, 'end', e.target.value)
                }
                readOnly={!isAdminMode}
                className={cn(
                  "w-[60px] border-b outline-none",
                  isAdminMode ? "bg-yellow-100" : "bg-transparent"
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300 dark:border-slate-700">
      <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
        {role} ({shift})
      </td>
      {weekDates.map((date, idx) => (
        <td key={idx} className="p-2 align-top">
          {date ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid</div>}
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
