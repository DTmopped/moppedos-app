import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useLaborData } from '@/contexts/LaborDataContext.jsx';

const shifts = ['AM', 'PM', 'SWING'];

const WeeklyCalendarGrid = ({ weekStartDate, scheduleData, onScheduleChange }) => {
  const { employees } = useLaborData();
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [customTimes, setCustomTimes] = useState({ start: '', end: '' });
  
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const getAllRoles = () => {
    const roleSet = new Set();
    ROLES.forEach(role => role.shifts.forEach(shift => roleSet.add(`${role.name}__${shift}`)));
    return Array.from(roleSet).map(str => {
      const [name, shift] = str.split('__');
      return { name, shift };
    });
  };

  // Smart employee filtering with enhanced cross-training
  const getEligibleEmployees = (roleName) => {
    if (!employees || employees.length === 0) return [];
    
    return employees.filter(emp => {
      // Exact role match - always allowed
      if (emp.role === roleName) return true;
      
      // Enhanced cross-training compatibility matrix
      const crossTrainingMatrix = {
        // BOH Cross-Training (very flexible)
        'Cook': ['Meat Portioner', 'Side Portioner', 'Prep Cook', 'Dishwasher'],
        'Meat Portioner': ['Cook', 'Side Portioner', 'Prep Cook', 'Dishwasher'],
        'Side Portioner': ['Cook', 'Meat Portioner', 'Prep Cook', 'Dishwasher'],
        'Prep Cook': ['Cook', 'Meat Portioner', 'Side Portioner', 'Dishwasher'],
        'Dishwasher': ['Cook', 'Meat Portioner', 'Side Portioner', 'Prep Cook'],
        
        // FOH Cross-Training (service focused)
        'Server': ['Server Assistant', 'Host', 'Cashier', 'Bartender'],
        'Server Assistant': ['Server', 'Host', 'Cashier', 'Dishwasher'],
        'Host': ['Server', 'Server Assistant', 'Cashier'],
        'Cashier': ['Server', 'Server Assistant', 'Host'],
        
        // Bar Cross-Training
        'Bartender': ['Server', 'Server Assistant', 'Cashier'],
        
        // Management Flexibility (can fill any role when needed)
        'Manager': ['Server', 'Host', 'Cook', 'Bartender', 'Cashier', 'Server Assistant', 'Meat Portioner', 'Side Portioner'],
        'Assistant Manager': ['Server', 'Host', 'Cook', 'Bartender', 'Cashier', 'Server Assistant', 'Meat Portioner', 'Side Portioner'],
        
        // Cross-Department Training (experienced staff)
        'Shift Leader': ['Server', 'Cook', 'Host', 'Cashier']
      };
      
      // Check if employee's role can cross-train to this position
      const canCrossTrain = crossTrainingMatrix[emp.role]?.includes(roleName);
      if (canCrossTrain) return true;
      
      // Department-based fallback (same department employees can usually help)
      const roleConfig = ROLES.find(r => r.name === roleName);
      if (emp.department === roleConfig?.department) {
        return true; // Allow any same-department employee
      }
      
      // Special cases for emergency coverage
      if (roleName === 'Dishwasher') {
        // Anyone can help with dishes in a pinch
        return ['BOH', 'FOH'].includes(emp.department);
      }
      
      if (roleName === 'Server Assistant') {
        // BOH staff can help bus tables/run food
        return emp.department === 'BOH';
      }
      
      return false;
    });
  };

  const handleAddEmployee = (dayKey, shift, role) => {
    setEditingSlot({ dayKey, shift, role, mode: 'add' });
    setSelectedEmployee('');
    const defaultTimes = SHIFT_TIMES[shift] || { start: '09:00', end: '17:00' };
    setCustomTimes(defaultTimes);
  };

  const handleEditEmployee = (dayKey, shift, role, employeeId) => {
    const employee = scheduleData?.[dayKey]?.[shift]?.[role]?.find(emp => emp.id === employeeId);
    if (employee) {
      setEditingSlot({ dayKey, shift, role, employeeId, mode: 'edit' });
      setSelectedEmployee(employee.name);
      setCustomTimes({ 
        start: employee.start || SHIFT_TIMES[shift]?.start || '09:00', 
        end: employee.end || SHIFT_TIMES[shift]?.end || '17:00' 
      });
    }
  };

  const handleSaveEmployee = () => {
    if (!selectedEmployee || !editingSlot) return;

    const { dayKey, shift, role, employeeId, mode } = editingSlot;
    const selectedEmp = employees.find(emp => emp.name === selectedEmployee);
    
    if (!selectedEmp) return;

    const newEmployee = {
      id: employeeId || `${selectedEmp.id}-${Date.now()}`,
      name: selectedEmployee,
      role: selectedEmp.role,
      department: selectedEmp.department,
      start: customTimes.start,
      end: customTimes.end,
      assignedRole: role // Track what role they're assigned to (for cross-training)
    };

    const updatedScheduleData = { ...scheduleData };
    
    // Initialize nested structure if needed
    if (!updatedScheduleData[dayKey]) updatedScheduleData[dayKey] = {};
    if (!updatedScheduleData[dayKey][shift]) updatedScheduleData[dayKey][shift] = {};
    if (!updatedScheduleData[dayKey][shift][role]) updatedScheduleData[dayKey][shift][role] = [];

    if (mode === 'add') {
      updatedScheduleData[dayKey][shift][role].push(newEmployee);
    } else if (mode === 'edit') {
      const employeeIndex = updatedScheduleData[dayKey][shift][role].findIndex(emp => emp.id === employeeId);
      if (employeeIndex !== -1) {
        updatedScheduleData[dayKey][shift][role][employeeIndex] = newEmployee;
      }
    }

    onScheduleChange(updatedScheduleData);
    handleCancelEdit();
  };

  const handleRemoveEmployee = (dayKey, shift, role, employeeId) => {
    const updatedScheduleData = { ...scheduleData };
    if (updatedScheduleData[dayKey]?.[shift]?.[role]) {
      updatedScheduleData[dayKey][shift][role] = updatedScheduleData[dayKey][shift][role].filter(
        emp => emp.id !== employeeId
      );
    }
    onScheduleChange(updatedScheduleData);
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
    setSelectedEmployee('');
    setCustomTimes({ start: '', end: '' });
  };

  const renderEmployeeCard = (emp, dayKey, shift, role) => {
    const roleConfig = ROLES.find(r => r.name === role);
    const isEditing = editingSlot?.employeeId === emp.id;
    const isCrossTrained = emp.role !== role;

    if (isEditing) {
      return (
        <div key={emp.id} className="bg-white border-2 border-blue-500 rounded-md p-2 mb-1 text-xs shadow-lg">
          <div className="space-y-2">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-1 border border-slate-300 rounded text-xs"
            >
              <option value="">Select employee for {role}</option>
              {getEligibleEmployees(role).map(employee => {
                const isExactMatch = employee.role === role;
                return (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.role} ({employee.department})
                    {isExactMatch ? ' ✓' : ' 🔄'}
                  </option>
                );
              })}
            </select>
            
            <div className="flex space-x-1">
              <input
                type="time"
                value={customTimes.start}
                onChange={(e) => setCustomTimes(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 p-1 border border-slate-300 rounded text-xs"
              />
              <input
                type="time"
                value={customTimes.end}
                onChange={(e) => setCustomTimes(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 p-1 border border-slate-300 rounded text-xs"
              />
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={handleSaveEmployee}
                className="flex-1 bg-green-600 text-white p-1 rounded text-xs hover:bg-green-700"
              >
                💾 Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-slate-500 text-white p-1 rounded text-xs hover:bg-slate-600"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={emp.id}
        className={cn(
          "rounded-md p-2 mb-1 text-xs shadow-sm border border-slate-400/30 group hover:shadow-md transition-shadow",
          roleConfig?.colorClass || "bg-slate-700 text-white"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold truncate flex items-center">
            👤 {emp.name || "Unassigned"}
            {isCrossTrained && (
              <span className="ml-1 text-xs opacity-75" title="Cross-training">🔄</span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
            <button
              onClick={() => handleEditEmployee(dayKey, shift, role, emp.id)}
              className="text-blue-200 hover:text-blue-100 p-1"
              title="Edit assignment"
            >
              ✏️
            </button>
            <button
              onClick={() => handleRemoveEmployee(dayKey, shift, role, emp.id)}
              className="text-red-200 hover:text-red-100 p-1"
              title="Remove assignment"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-slate-600 dark:text-slate-300 text-xs mt-1">
          🕐 {emp.start || SHIFT_TIMES[shift]?.start || "—"} – {emp.end || SHIFT_TIMES[shift]?.end || "—"}
        </div>
        
        <div className="text-[10px] italic text-slate-500 mt-1">
          {roleConfig?.abbreviation || role}
          {isCrossTrained && (
            <span className="ml-1 text-amber-600">
              (Cross-trained from {emp.role})
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderAddEmployeeSlot = (dayKey, shift, role) => {
    const isEditing = editingSlot?.dayKey === dayKey && editingSlot?.shift === shift && editingSlot?.role === role && editingSlot?.mode === 'add';
    const eligibleEmployees = getEligibleEmployees(role);

    if (isEditing) {
      return (
        <div className="bg-white border-2 border-green-500 rounded-md p-2 mb-1 text-xs shadow-lg">
          <div className="space-y-2">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-1 border border-slate-300 rounded text-xs"
            >
              <option value="">Select employee for {role}</option>
              {eligibleEmployees.map(employee => {
                const isExactMatch = employee.role === role;
                return (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.role} ({employee.department})
                    {isExactMatch ? ' ✓ Primary' : ' 🔄 Cross-trained'}
                  </option>
                );
              })}
            </select>
            
            {eligibleEmployees.length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                No eligible employees for {role}. Add employees with this role or compatible roles.
              </div>
            )}
            
            <div className="flex space-x-1">
              <input
                type="time"
                value={customTimes.start}
                onChange={(e) => setCustomTimes(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 p-1 border border-slate-300 rounded text-xs"
                placeholder="Start"
              />
              <input
                type="time"
                value={customTimes.end}
                onChange={(e) => setCustomTimes(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 p-1 border border-slate-300 rounded text-xs"
                placeholder="End"
              />
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={handleSaveEmployee}
                disabled={!selectedEmployee}
                className="flex-1 bg-green-600 text-white p-1 rounded text-xs hover:bg-green-700 disabled:bg-slate-400"
              >
                ➕ Add
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-slate-500 text-white p-1 rounded text-xs hover:bg-slate-600"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleAddEmployee(dayKey, shift, role)}
        className="w-full border-2 border-dashed border-slate-300 rounded-md p-2 mb-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
      >
        ➕ Add Employee
      </button>
    );
  };

  const renderShiftBlock = (dayKey, shift, role) => {
    const employees = scheduleData?.[dayKey]?.[shift]?.[role] || [];
    
    return (
      <div className="min-h-[60px]">
        {employees.map((emp) => renderEmployeeCard(emp, dayKey, shift, role))}
        {renderAddEmployeeSlot(dayKey, shift, role)}
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
                <div className="flex items-center">
                  <div>
                    {role} ({shift})
                    <div className="text-xs text-slate-500 mt-1">
                      {SHIFT_TIMES[shift]?.start} - {SHIFT_TIMES[shift]?.end}
                    </div>
                  </div>
                </div>
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
