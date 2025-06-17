import React from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const shifts = ['AM', 'PM', 'SWING'];

const EditableDailyScheduleTable = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const getAllRoles = () => {
    const roleSet = new Set();
    ROLES.forEach(role => role.shifts.forEach(shift => roleSet.add(`${role.name}__${shift}`)));
    return Array.from(roleSet).map(str => {
      const [name, shift] = str.split('__');
      return { name, shift };
    });
  };

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    const roleConfig = ROLES.find(r => r.name === role);

    return employees.map((emp) => (
      <div
        key={emp.id}
        className={cn(
          "rounded-md p-2 mb-1 text-xs shadow-sm border border-slate-400/30",
          roleConfig?.colorClass || "bg-slate-700 text-white"
        )}
      >
        <div className="font-semibold truncate">{emp.name || "Unassigned"}</div>
        <div className="text-slate-600 dark:text-slate-300 text-xs">
          {emp.start || SHIFT_TIMES[shift]?.start || "—"} – {emp.end || SHIFT_TIMES[shift]?.end || "—"}
        </div>
        <div className="text-[10px] italic text-slate-500">
          {roleConfig?.abbreviation || role}
        </div>
      </div>
    ));
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date) => (
              <th key={date.toISOString()} className="p-2 text-center w-[140px]">
                {format(date, 'EEE MM/dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getAllRoles().map(({ name: role, shift }) => (
            <tr key={`${role}-${shift}`} className="border-t border-slate-300">
              <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {role} ({shift})
              </td>
              {weekDates.map((date) => {
                const dayKey = format(date, 'yyyy-MM-dd');
                return (
                  <td key={dayKey} className="p-2 align-top bg-slate-100 dark:bg-slate-800 min-h-[100px]">
                    {renderShiftBlock(dayKey, shift, role)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableDailyScheduleTable;
