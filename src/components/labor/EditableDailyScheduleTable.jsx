import React from 'react';
import { addDays, format, isValid, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const safeStart = weekStartDate instanceof Date ? weekStartDate : new Date(weekStartDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(safeStart, i));

  const groupedRoles = () => {
    const am = [], pm = [], swing = [];
    ROLES.forEach(role => {
      if (role.shifts.includes('AM')) am.push({ ...role, shift: 'AM' });
      if (role.shifts.includes('PM')) pm.push({ ...role, shift: 'PM' });
      if (role.shifts.includes('SWING')) swing.push({ ...role, shift: 'SWING' });
    });
    return [...am, { spacer: true }, ...pm, { spacer: true }, ...swing];
  };

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    const roleConfig = ROLES.find(r => r.name === role);

    return employees.map((emp, i) => (
      <div
        key={emp.id || `${role}-${shift}-${i}`}
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
            {weekDates.map((date, idx) => {
              const valid = isValid(date);
              return (
                <th key={idx} className="p-2 text-center w-[140px]">
                  {valid ? format(date, 'EEE MM/dd') : <span className="text-red-500">Invalid</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groupedRoles().map((entry, idx) => {
            if (entry.spacer) {
              return (
                <tr key={`spacer-${idx}`}><td colSpan={8} className="h-3 bg-slate-50 dark:bg-slate-900"></td></tr>
              );
            }
            const { name: role, shift } = entry;
            return (
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
