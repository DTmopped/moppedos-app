// components/labor/LaborScheduleGrid.jsx
import React from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const LaborScheduleGrid = ({
  scheduleData,
  weekDates,
  isManager = false,
}) => {
  const shifts = ['AM', 'PM'];

  // Collect all unique roles used across the week, by shift
  const getRolesByShift = (shiftType) => {
    const roles = new Set();
    weekDates.forEach((date) => {
      const dayData = scheduleData[date] || {};
      const shiftData = dayData[shiftType] || {};
      Object.keys(shiftData).forEach(role => roles.add(role));
    });
    return Array.from(roles);
  };

  return (
    <div className="overflow-x-auto border border-slate-700 rounded-md">
      <table className="min-w-full text-xs text-left text-slate-300">
        <thead className="bg-slate-800/80 text-slate-400">
          <tr>
            <th className="px-2 py-1 bg-slate-900 text-slate-300 border-r border-slate-700">Shift</th>
            <th className="px-2 py-1 bg-slate-900 text-slate-300 border-r border-slate-700">Position</th>
            {weekDates.map(date => (
              <th key={date} className="px-2 py-1 border-r border-slate-700">
                {format(parseISO(date), 'EEE M/d')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shifts.map(shiftType => (
            getRolesByShift(shiftType).map(role => (
              <tr key={`${shiftType}-${role}`} className="border-t border-slate-700">
                <td className="px-2 py-1 border-r border-slate-700 text-slate-400 font-semibold">{shiftType}</td>
                <td className="px-2 py-1 border-r border-slate-700">{role}</td>
                {weekDates.map(date => {
                  const employees = scheduleData?.[date]?.[shiftType]?.[role] || [];
                  const cellContent = employees
                    .filter(e => e.id && !e.id.startsWith('empty-'))
                    .map(e => (
                      <div key={e.id} className="mb-1">
                        <span>{e.name}</span>
                        <span className="ml-1 text-slate-400">
                          ({e.startTime || '—'}–{e.endTime || '—'})
                        </span>
                        {isManager && (
                          <span className="ml-1 text-purple-400">
                            ${e.payRate?.toFixed(2) || 'N/A'}
                          </span>
                        )}
                      </div>
                    ));

                  return (
                    <td key={`${date}-${role}-${shiftType}`} className="px-2 py-1 border-r border-slate-700 align-top">
                      {cellContent.length > 0 ? cellContent : <span className="text-slate-500 italic">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LaborScheduleGrid;
