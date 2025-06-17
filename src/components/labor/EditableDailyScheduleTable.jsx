import React from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  if (!weekStartDate || isNaN(new Date(weekStartDate))) {
    console.error("Invalid weekStartDate provided:", weekStartDate);
    return <div className="text-red-500 p-4">Invalid week start date</div>;
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const shiftGroups = {
    AM: [],
    PM: [],
    SWING: [],
  };

  ROLES.forEach((role) => {
    role.shifts.forEach((shift) => {
      shiftGroups[shift]?.push({ name: role.name, shift });
    });
  });

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    const roleConfig = ROLES.find(r => r.name === role);

    return employees.map((emp) => (
      <div
        key={emp.id || `${role}-${shift}`}
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

  const renderGroupedRows = (group) => (
    <>
      {shiftGroups[group].map(({ name: role, shift }) => (
        <tr key={`${role}-${shift}`} className="border-t border-slate-300">
          <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {role} ({shift})
          </td>
          {weekDates.map((date, idx) => {
            let dayKey = 'invalid-date';
            try {
              const parsed = new Date(date);
              if (!isNaN(parsed)) dayKey = format(parsed, 'yyyy-MM-dd');
            } catch {
              console.error("Invalid date key format:", date);
            }
            return (
              <td key={idx} className="p-2 align-top bg-slate-100 dark:bg-slate-800 min-h-[100px]">
                {renderShiftBlock(dayKey, shift, role)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => {
              try {
                const parsed = new Date(date);
                if (isNaN(parsed)) throw new Error();
                return (
                  <th key={idx} className="p-2 text-center w-[140px]">
                    {format(parsed, 'EEE MM/dd')}
                  </th>
                );
              } catch {
                console.error("Invalid date in weekDates:", date);
                return (
                  <th key={idx} className="p-2 text-center text-red-500">
                    Invalid Date
                  </th>
                );
              }
            })}
          </tr>
        </thead>
        <tbody>
          {/* AM Section */}
          {renderGroupedRows('AM')}
          <tr><td colSpan={8} className="h-4" /></tr>

          {/* PM Section */}
          {renderGroupedRows('PM')}
          <tr><td colSpan={8} className="h-4" /></tr>

          {/* Swing Section */}
          {renderGroupedRows('SWING')}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
