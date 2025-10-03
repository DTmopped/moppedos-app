import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useLaborData } from '@/contexts/LaborDataContext.jsx';

const shifts = ['AM', 'PM', 'SWING'];

const WeeklyCalendarGrid = ({ weekStartDate, scheduleData, onScheduleChange, departmentFilter = 'ALL' }) => {
  const { employees } = useLaborData();
  const [showDropdown, setShowDropdown] = useState(null);
  
  // Filter employees based on department filter
  const getFilteredEmployees = () => {
    if (departmentFilter === 'ALL') {
      return employees.filter(emp => emp.is_active);
    }
    return employees.filter(emp => emp.is_active && emp.department === departmentFilter);
  };
  
  const filteredEmployees = getFilteredEmployees();
  
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const getAllRoles = () => {
    let rolesToShow = ROLES;
    
    // Filter roles by department if not showing all
    if (departmentFilter !== 'ALL') {
      rolesToShow = ROLES.filter(role => {
        // Map role names to departments based on your config
        const roleDepartmentMap = {
          'Meat Portioner': 'BOH',
          'Side Portioner': 'BOH', 
          'Food Gopher': 'BOH',
          'Dishwasher': 'BOH',
          'Kitchen Swing': 'BOH',
          'Cashier': 'FOH',
          'Server': 'FOH',
          'Server Assistant': 'FOH',
          'Busser': 'FOH',
          'Cashier Swing': 'FOH',
          'Bartender': 'Bar',
          'Shift Lead': 'Management',
          'Manager': 'Management'
        };
        return roleDepartmentMap[role.name] === departmentFilter;
      });
    }
    
    const roleShiftCombinations = [];
    rolesToShow.forEach(role => {
      shifts.forEach(shift => {
        roleShiftCombinations.push({ name: role.name, shift });
      });
    });
    return roleShiftCombinations;
  };

  const handleAddEmployee = (dayKey, shift, role, employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const newEmployee = {
      id: employee.id,
      name: employee.name, // Use 'name' instead of 'full_name' based on DataContext
      start: SHIFTS[shift]?.start || "9:00",
      end: SHIFTS[shift]?.end || "17:00",
      role: employee.role,
      department: employee.department,
      hourly_rate: employee.hourly_rate
    };

    // Update schedule data
    const updatedSchedule = { ...scheduleData };
    if (!updatedSchedule[dayKey]) updatedSchedule[dayKey] = {};
    if (!updatedSchedule[dayKey][shift]) updatedSchedule[dayKey][shift] = {};
    if (!updatedSchedule[dayKey][shift][role]) updatedSchedule[dayKey][shift][role] = [];
    
    updatedSchedule[dayKey][shift][role].push(newEmployee);
    
    console.log('Schedule updated:', updatedSchedule);
    
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
              {emp.start || SHIFTS[shift]?.start || "—"} – {emp.end || SHIFTS[shift]?.end || "—"}
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
              {filteredEmployees && filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleAddEmployee(dayKey, shift, role, employee.id)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-slate-500">{employee.role} - {employee.department}</div>
                    <div className="text-xs text-slate-400">${employee.hourly_rate}/hr</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No employees available{departmentFilter !== 'ALL' ? ` in ${departmentFilter}` : ''}
                </div>
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
