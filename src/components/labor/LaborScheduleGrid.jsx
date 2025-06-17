import React from "react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const LaborScheduleGrid = ({ weekStartDate, scheduleData, onScheduleChange, showManagerFields = false }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const shifts = ["AM", "PM"];

  const getAllRolesByShift = (shiftType) => {
    const roleSet = new Set();
    weekDates.forEach((date) => {
      const day = format(date, "yyyy-MM-dd");
      const shiftsByDay = scheduleData?.[day]?.[shiftType];
      if (shiftsByDay) {
        Object.keys(shiftsByDay).forEach((role) => roleSet.add(role));
      }
    });
    return Array.from(roleSet);
  };

  const handleChange = (dayKey, shift, role, value) => {
    const updatedSchedule = { ...scheduleData };
    if (!updatedSchedule[dayKey]) updatedSchedule[dayKey] = {};
    if (!updatedSchedule[dayKey][shift]) updatedSchedule[dayKey][shift] = {};
    updatedSchedule[dayKey][shift][role] = [{ name: value, id: `manual-${Date.now()}` }];
    onScheduleChange?.(updatedSchedule);
  };

  return (
    <div className="overflow-auto border rounded bg-slate-800/70 print:bg-white print:text-black">
      <table className="table-auto min-w-full border-collapse text-sm">
        <thead className="bg-slate-700 text-slate-300 print:bg-gray-100 print:text-black">
          <tr>
            <th className="p-2 text-left">Role</th>
            {weekDates.map((date) => (
              <th key={date.toISOString()} className="p-2 text-center whitespace-nowrap">
                {format(date, "EEE, MMM d")}
              </th>
            ))}
            {showManagerFields && (
              <>
                <th className="p-2 text-right">Total Hours</th>
                <th className="p-2 text-right">OT Hours</th>
                <th className="p-2 text-right">Pay Rate</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <React.Fragment key={shift}>
              <tr className="bg-slate-900/80 print:bg-gray-200">
                <td colSpan={weekDates.length + (showManagerFields ? 4 : 1)} className="font-semibold text-slate-200 print:text-black p-2">
                  {shift} Shifts
                </td>
              </tr>
              {getAllRolesByShift(shift).map((role) => (
                <tr key={role} className="border-b border-slate-700 print:border-gray-300">
                  <td className="p-2 text-slate-200 print:text-black whitespace-nowrap">{role}</td>
                  {weekDates.map((date) => {
                    const dayKey = format(date, "yyyy-MM-dd");
                    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
                    const names = employees.filter(e => !e.id.startsWith("empty-")).map((e) => e.name).join(", ");
                    return (
                      <td key={dayKey} className="p-2 text-center bg-slate-700/40 print:bg-white">
                        {showManagerFields ? (
                          <input
                            className="bg-slate-800 text-slate-100 border border-slate-600 rounded px-1 w-full text-xs print:border-gray-400 print:text-black print:bg-white"
                            value={names}
                            placeholder="Assign name"
                            onChange={(e) => handleChange(dayKey, shift, role, e.target.value)}
                          />
                        ) : (
                          names || <span className="text-slate-500 italic print:text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                  {showManagerFields && (
                    <>
                      <td className="p-2 text-right text-slate-200 print:text-black">--</td>
                      <td className="p-2 text-right text-slate-200 print:text-black">--</td>
                      <td className="p-2 text-right text-slate-200 print:text-black">--</td>
                    </>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LaborScheduleGrid;
