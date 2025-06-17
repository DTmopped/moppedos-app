import React from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onScheduleChange }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const shiftOrder = ['AM', 'PM', 'SWING'];

  const getGroupedRoles = () => {
    const grouped = { AM: [], PM: [], SWING: [] };
    ROLES.forEach((role) => {
      role.shifts.forEach((shift) => {
        grouped[shift].push({ role, shift });
      });
    });
    return grouped;
  };

  const groupedRoles = getGroupedRoles();

  const renderShiftBlock = (dayKey, shift, roleName) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[roleName] || [];
    const roleConfig = ROLES.find((r) => r.name === roleName);

    return employees.map((emp, index) => (
      <div
        key={`${emp.id || index}-${roleName}-${shift}`}
        className={cn(
          "rounded-md p-2 mb-1 text-xs shadow-sm border border-slate-300 dark:border-slate-600",
          roleConfig?.colorClass || "bg-slate-600 text-white"
        )}
      >
        <div className="font-semibold truncate">{emp.name || "Unassigned"}</div>
        <div className="text-slate-600 dark:text-slate-300 text-xs">
          {emp.start || SHIFT_TIMES[shift]?.start} – {emp.end || SHIFT_TIMES[shift]?.end}
        </div>
        <div className="text-[10px] italic text-slate-500">{roleConfig?.abbreviation || roleName}</div>
      </div>
    ));
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm shadow-lg">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[200px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {format(date, 'EEE MM/dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['AM', 'PM'].map((shift) => (
            <React.Fragment key={shift}>
              {groupedRoles[shift].map(({ role }) => (
                <tr key={`${role.name}-${shift}`} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {role.name} ({shift})
                  </td>
                  {weekDates.map((date) => {
                    const dayKey = format(date, 'yyyy-MM-dd');
                    return (
                      <td key={dayKey} className="p-2 align-top bg-slate-50 dark:bg-slate-800 min-h-[100px]">
                        {renderShiftBlock(dayKey, shift, role.name)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Spacer row for visual break between AM and PM */}
              {shift === 'AM' && (
                <tr>
                  <td colSpan={weekDates.length + 1} className="h-4 bg-slate-100 dark:bg-slate-900" />
                </tr>
              )}
            </React.Fragment>
          ))}
          {/* SWING roles go at bottom */}
          {groupedRoles.SWING.map(({ role }) => (
            <tr key={`${role.name}-SWING`} className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {role.name} (SWING)
              </td>
              {weekDates.map((date) => {
                const dayKey = format(date, 'yyyy-MM-dd');
                return (
                  <td key={dayKey} className="p-2 align-top bg-slate-50 dark:bg-slate-800 min-h-[100px]">
                    {renderShiftBlock(dayKey, 'SWING', role.name)}
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

export default EditableWeeklyScheduleTable;
