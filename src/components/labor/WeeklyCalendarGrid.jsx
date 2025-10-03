import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useLaborData } from '@/contexts/LaborDataContext.jsx';

const shifts = ['AM', 'PM', 'SWING'];

const WeeklyCalendarGrid = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const { employees } = useLaborData();
  const [showDropdown, setShowDropdown] = useState(null);
  
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const getAllRoles = () => {
    const roleSet = new Set();
    ROLES.forEach(role => role.shifts.forEach(shift => roleSet.add(`${role.name}__${shift}`)));
    return Array.from(roleSet).map(str => {
      const [name, shift] = str.split('__');
      return { name, shift };
    });
  };

  const handleAddEmployee = (dayKey, shift, role, employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const newEmployee = {
      id: employee.id,
      name: employee.full_name,
      start: SHIFT_TIMES[shift]?.start || "9:00 AM",
      end: SHIFT_TIMES[shift]?.end || "5:00 PM"
    };

    // Update schedule data
    const updatedSchedule = { ...scheduleData };
    if (!updatedSchedule[dayKey]) updatedSchedule[dayKey] = {};
    if (!updatedSchedule[dayKey][shift]) updatedSchedule[dayKey][shift] = {};
    if (!updatedSchedule[dayKey][shift][role]) updatedSchedule[dayKey][shift][role] = [];
    
    updatedSchedule[dayKey][shift][role].push(newEmployee);
    
    if (onScheduleChange) {
      onScheduleChange(updatedSchedule);
    }
    
    setShowDropdown(null);
  };

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    const roleConfig = ROLES.find(r => r.name === role);
    const dropdownKey = `${dayKey}-${shift}-${role}`;

    return (
      <div className="min-h-[60px]">
        {employees.map((emp) => (
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
        ))}
        
        {/* Add Employee Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
            className="w-full p-2 text-xs border-2 border-dashed border-slate-300 rounded-md hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            + Add Employee
          </button>
          
          {/* Simple Dropdown */}
          {showDropdown === dropdownKey && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {employees && employees.length > 0 ? (
                employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleAddEmployee(dayKey, shift, role, employee.id)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium">{employee.full_name}</div>
                    <div className="text-slate-500">{employee.role} - {employee.department}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500">No employees available</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date) => (
              <th key={date.toISOString()} className="p-2 text-center w-[140px]">
                {format(date, 'EEE MM/dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getAllRoles().map(({ name: role, shift }) => (
            <tr key={`${role}-${shift}`} className="border-t border-slate-300">
              <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {role} ({shift})
              </td>
              {weekDates.map((date) => {
                const dayKey = format(date, 'yyyy-MM-dd');
                return (
                  <td key={dayKey} className="p-2 align-top bg-slate-100 dark:bg-slate-800 min-h-[100px]">
                    {renderShiftBlock(dayKey, shift, role)}
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

export default WeeklyCalendarGrid;
