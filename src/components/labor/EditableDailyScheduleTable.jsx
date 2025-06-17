import React from 'react';
import { addDays, format, isValid, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onScheduleChange }) => {
  const validStart = isValid(new Date(weekStartDate)) ? startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 }) : null;
  const weekDates = validStart
    ? Array.from({ length: 7 }, (_, i) => addDays(validStart, i))
    : [];

  const amRoles = ROLES.filter(r => r.shifts.includes('AM') && !r.name.includes('Swing'));
  const pmRoles = ROLES.filter(r => r.shifts.includes('PM') && !r.name.includes('Swing'));
  const swingRoles = ROLES.filter(r => r.shifts.includes('SWING'));

  const renderShiftBlock = (dayKey, shift, roleName, roleAbbr, colorClass) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[roleName] || [];
    return employees.map((emp, idx) => (
      <div
        key={`${dayKey}-${shift}-${roleName}-${idx}`}
        className={cn(
          'rounded-md p-2 mb-1 text-xs shadow-sm border border-slate-400/30',
          colorClass || 'bg-slate-700 text-white'
        )}
      >
        <div className="font-semibold truncate">{emp.name || 'Unassigned'}</div>
        <div className="text-slate-600 dark:text-slate-300 text-xs">
          {emp.start || SHIFT_TIMES[shift]?.start || '—'} – {emp.end || SHIFT_TIMES[shift]?.end || '—'}
        </div>
        <div className="text-[10px] italic text-slate-500">{roleAbbr || roleName}</div>
      </div>
    ));
  };

  const renderRows = (rolesArray, label) => (
    <>
      <tr><td colSpan={8} className="py-2 text-sm font-semibold text-slate-500">{label}</td></tr>
      {rolesArray.map(({ name, abbreviation, colorClass }) => (
        <tr key={name} className="border-t border-slate-200">
          <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {name}
          </td>
          {weekDates.map((date, idx) => {
            const dayKey = format(date, 'yyyy-MM-dd');
            const shift = SHIFT_TIMES['AM'] && name.includes('PM') ? 'PM' : 'AM';
            return (
              <td key={idx} className="p-2 align-top bg-slate-50 dark:bg-slate-900 min-h-[80px]">
                {renderShiftBlock(dayKey, shift, name, abbreviation, colorClass)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );

  if (!validStart) {
    return (
      <div className="text-red-500 p-4 text-sm">Invalid week start date</div>
    );
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {format(date, 'EEE MM/dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRows(amRoles, 'AM Shifts')}
          <tr><td colSpan={8} className="py-2" /></tr>
          {renderRows(pmRoles, 'PM Shifts')}
          <tr><td colSpan={8} className="py-2" /></tr>
          {renderRows(swingRoles, 'SWING Shifts')}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
