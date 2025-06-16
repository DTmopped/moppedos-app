import React from "react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const LaborScheduleGrid = ({ weekStartDate, scheduleData, showManagerFields = false }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const getAllRolesByShift = (shiftType) => {
    const roleSet = new Set();
    weekDates.forEach((date) => {
      const day = format(date, "yyyy-MM-dd");
      const shifts = scheduleData?.[day]?.[shiftType];
      if (shifts) {
        Object.keys(shifts).forEach((role) => roleSet.add(role));
      }
    });
    return Array.from(roleSet);
  };

  const shifts = ["AM", "PM"];

  return (
    <div className="overflow-auto border rounded bg-slate-800/70">
      <table className="table-auto min-w-full border-collapse text-sm">
        <thead className="bg-slate-700 text-slate-300">
          <tr>
            <th className="p-2 text-left">Role</th>
            {weekDates.map((date) => (
              <th key={date.toISOString()} className="p-2 text-center">
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
              <tr className="bg-slate-900/80">
                <td colSpan={weekDates.length + (showManagerFields ? 4 : 1)} className="font-semibold text-slate-200 p-2">
                  {shift} Shifts
                </td>
              </tr>
              {getAllRolesByShift(shift).map((role) => (
                <tr key={role} className="border-b border-slate-700">
                  <td className="p-2 text-slate-200 whitespace-nowrap">{role}</td>
                  {weekDates.map((date) => {
                    const dayKey = format(date, "yyyy-MM-dd");
                    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
                    const names = employees.filter(e => !e.id.startsWith("empty-")).map((e) => e.name).join(", ");
                    return (
                      <td key={dayKey} className="p-2 text-slate-100 text-center bg-slate-700/40">
                        {names || <span className="text-slate-500 italic">—</span>}
                      </td>
                    );
                  })}
                  {showManagerFields && (
                    <>
                      <td className="p-2 text-right text-slate-200">--</td>
                      <td className="p-2 text-right text-slate-200">--</td>
                      <td className="p-2 text-right text-slate-200">--</td>
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
