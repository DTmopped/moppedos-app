import React from 'react';
import { addDays, format, isValid, startOfWeek } from 'date-fns';
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

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const safeWeekStart = isValid(new Date(weekStartDate)) ? new Date(weekStartDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(safeWeekStart, i));

  const kitchenRoles = ['Meat Portioner', 'Side Portioner', 'Food Gopher'];
  const fohRoles = ['Cashier', 'Bartender'];

  const getAllRoles = () => {
    const amRoles = [];
    const pmRoles = [];
    const swingRoles = [];

    ROLES.forEach(role => {
      role.shifts.forEach(shift => {
        const roleEntry = { name: role.name, shift, abbreviation: role.abbreviation, colorClass: role.colorClass };
        if (shift === 'SWING') {
          swingRoles.push(roleEntry);
        } else if (shift === 'AM') {
          if (kitchenRoles.includes(role.name)) amRoles.push(roleEntry);
          else if (fohRoles.includes(role.name)) amRoles.push(roleEntry);
        } else if (shift === 'PM') {
          if (kitchenRoles.includes(role.name)) pmRoles.push(roleEntry);
          else if (fohRoles.includes(role.name)) pmRoles.push(roleEntry);
        }
      });
    });

    return [...amRoles, ...pmRoles, ...swingRoles];
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
            {weekDates.map((date, idx) => {
              try {
                const parsed = new Date(date);
                return (
                  <th key={idx} className="p-2 text-center w-[140px]">
                    {format(parsed, 'EEE MM/dd')}
                  </th>
                );
              } catch (err) {
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
          {getAllRoles().map(({ name: role, shift, abbreviation, colorClass }) => {
            const isAMGroupEnd = shift === 'AM' && role === 'Cashier';
            const isPMGroupEnd = shift === 'PM' && role === 'Bartender';

            return (
              <React.Fragment key={`${role}-${shift}`}>
                <tr className="border-t border-slate-300">
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {role} ({shift})
                  </td>
                  {weekDates.map((date, idx) => {
                    const dayKey = format(date, 'yyyy-MM-dd');
                    return (
                      <td key={idx} className="p-2 align-top bg-slate-100 dark:bg-slate-800 min-h-[100px]">
                        {renderShiftBlock(dayKey, shift, role)}
                      </td>
                    );
                  })}
                </tr>
                {(isAMGroupEnd || isPMGroupEnd) && (
                  <tr><td colSpan={8} className="h-4" /></tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
