import React from 'react';
import { addDays, format, isValid, parseISO, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const parseTimeStringToDate = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const [hours, minutes, seconds] = parts.map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds || 0, 0);
  return isValid(date) ? date : null;
};

const shifts = ['AM', 'PM', 'SWING'];

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const safeWeekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(safeWeekStart, i));

  const getSortedRoles = () => {
    const grouped = {
      AM: [],
      PM: [],
      SWING: []
    };

    ROLES.forEach(role => {
      role.shifts.forEach(shift => grouped[shift].push({ ...role, shift }));
    });

    return [
      ...grouped.AM,
      ...grouped.PM,
      ...grouped.SWING
    ];
  };

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    const roleConfig = ROLES.find(r => r.name === role);

    return employees.map((emp, i) => {
      const parsedStart = parseTimeStringToDate(emp.start || SHIFT_TIMES[shift]?.start);
      const parsedEnd = parseTimeStringToDate(emp.end || SHIFT_TIMES[shift]?.end);

      return (
        <div
          key={`${emp.id || i}-${role}-${shift}`}
          className={cn(
            "rounded-md p-2 mb-1 text-xs shadow-sm border border-slate-400/30",
            roleConfig?.colorClass || "bg-slate-700 text-white"
          )}
        >
          <div className="font-semibold truncate">{emp.name || "Unassigned"}</div>
          <div className="text-slate-600 dark:text-slate-300 text-xs">
            {parsedStart ? format(parsedStart, 'hh:mm a') : '–'} – {parsedEnd ? format(parsedEnd, 'hh:mm a') : '–'}
          </div>
          <div className="text-[10px] italic text-slate-500">
            {roleConfig?.abbreviation || role}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {isValid(date) ? format(date, 'EEE MM/dd') : 'Invalid Date'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getSortedRoles().map(({ name: role, shift }, idx, arr) => (
            <React.Fragment key={`${role}-${shift}`}>
              <tr className="border-t border-slate-300">
                <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {role} ({shift})
                </td>
                {weekDates.map((date, i) => {
                  const dayKey = isValid(date) ? format(date, 'yyyy-MM-dd') : `invalid-${i}`;
                  return (
                    <td key={dayKey} className="p-2 align-top bg-slate-100 dark:bg-slate-800 min-h-[100px]">
                      {renderShiftBlock(dayKey, shift, role)}
                    </td>
                  );
                })}
              </tr>
              {(shift === 'AM' && arr[idx + 1]?.shift === 'PM') && (
                <tr><td colSpan={8} className="h-4"></td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
