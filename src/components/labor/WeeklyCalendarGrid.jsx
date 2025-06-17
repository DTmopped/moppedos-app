import React from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const shifts = ['AM', 'PM'];
const roles = [
  'Meat Portioner',
  'Side Portioner',
  'Food Gopher',
  'Cashier',
  'Shift Lead',
  'Bartender',
];

const WeeklyCalendarGrid = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    return employees.map((emp) => (
      <div
        key={emp.id}
        className="bg-slate-700 text-white rounded-md p-2 mb-1 text-xs shadow-sm"
      >
        <div className="font-semibold">{emp.name || 'Unassigned'}</div>
        <div className="text-slate-300">{emp.start || '—'} - {emp.end || '—'}</div>
      </div>
    ));
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left">Role / Shift</th>
            {weekDates.map((date) => (
              <th key={date.toISOString()} className="p-2 text-center">
                {format(date, 'EEE MM/dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <React.Fragment key={shift}>
              {roles.map((role) => (
                <tr key={`${shift}-${role}`} className="border-t border-slate-200">
                  <td className="p-2 font-medium text-slate-700 whitespace-nowrap">
                    {role} ({shift})
                  </td>
                  {weekDates.map((date) => {
                    const dayKey = format(date, 'yyyy-MM-dd');
                    return (
                      <td
                        key={dayKey}
                        className="p-2 align-top bg-slate-100 min-w-[120px]"
                      >
                        {renderShiftBlock(dayKey, shift, role)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyCalendarGrid;
