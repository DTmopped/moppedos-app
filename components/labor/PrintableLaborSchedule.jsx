
import React from 'react';
import { format, parseISO, addDays } from 'date-fns';

const PrintableLaborSchedule = ({ scheduleData, weekStartDate, employees }) => {
  if (!scheduleData) return <p className="text-center p-4">Loading printable schedule...</p>;
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStartDate, i), 'yyyy-MM-dd'));

  return (
    <div className="printable-labor-schedule-container p-4">
      <div className="print-header text-center mb-6">
        <h1 className="app-title text-2xl font-bold">Weekly Labor Schedule</h1>
        <p className="print-date text-sm">
          Week of: {format(weekStartDate, 'MMMM dd, yyyy')} - {format(addDays(weekStartDate, 6), 'MMMM dd, yyyy')}
        </p>
      </div>
      {weekDates.map(date => (
        <div key={date} className="daily-schedule mb-4 page-break-avoid">
          <h2 className="daily-schedule-title text-lg font-semibold border-b pb-1 mb-2">
            {format(parseISO(date), 'EEEE, MMMM dd, yyyy')}
          </h2>
          {scheduleData[date] && Object.keys(scheduleData[date]).length > 0 ? (
            Object.entries(scheduleData[date]).map(([shiftType, roles]) => (
              <div key={shiftType} className="mb-3">
                <h3 className="text-md font-medium capitalize mb-1">{shiftType} Shift</h3>
                <table className="w-full border-collapse border border-gray-400 table-print-styles print-table-compact">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-1 text-left text-xs">Role</th>
                      <th className="border border-gray-300 p-1 text-left text-xs">Employee</th>
                      <th className="border border-gray-300 p-1 text-left text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(roles).map(([roleName, assignedEmps]) => {
                      const actualEmployeesInSlot = assignedEmps.filter(e => e.id && !e.id.startsWith('empty-'));
                      if (actualEmployeesInSlot.length === 0) {
                        return (
                          <tr key={`${roleName}-empty`}>
                            <td className="border border-gray-300 p-1 text-xs tabular-nums">{roleName}</td>
                            <td className="border border-gray-300 p-1 text-xs italic text-gray-500 tabular-nums">Unassigned</td>
                            <td className="border border-gray-300 p-1 text-xs tabular-nums"></td>
                          </tr>
                        );
                      }
                      return actualEmployeesInSlot.map((employee, index) => (
                        <tr key={`${roleName}-${employee.id}-${index}`}>
                          <td className="border border-gray-300 p-1 text-xs tabular-nums">{index === 0 ? roleName : ''}</td>
                          <td className="border border-gray-300 p-1 text-xs tabular-nums">{employee.name}</td>
                          <td className="border border-gray-300 p-1 text-xs tabular-nums">
                            {employee.startTime || 'N/A'} - {employee.endTime || 'N/A'}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="text-xs italic">No shifts scheduled for this day.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrintableLaborSchedule;
