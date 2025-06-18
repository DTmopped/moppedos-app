import React, { useContext, useMemo, useState } from 'react';
import { addDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useData } from '@/contexts/DataContext';

const EditableWeeklyScheduleTable = ({
  weekStartDate,
  scheduleData = {},
  onUpdate,
  forecastGeneratedSchedule = {}
}) => {
  const { isAdminMode } = useData();

  const [editableRoles, setEditableRoles] = React.useState({});
  const [customRoles, setCustomRoles] = React.useState([]);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [newRoleShifts, setNewRoleShifts] = React.useState(['AM']);
  const [showAddRoleForm, setShowAddRoleForm] = React.useState(false);
  const [deleteRoleMode, setDeleteRoleMode] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState('');
  const [deleteShifts, setDeleteShifts] = React.useState([]);

  const getRoleName = (defaultName) => editableRoles[defaultName] || defaultName;
  const handleRoleNameChange = (role, newName) => {
    setEditableRoles(prev => ({ ...prev, [role]: newName }));
  };

  const removeCustomRole = (roleName) => {
    setCustomRoles(prev => prev.filter(r => r.name !== roleName));
  };

  const handleDeleteRole = () => {
    if (roleToDelete) {
      setCustomRoles(prev => {
        const updated = prev.map(role => {
          if (role.name === roleToDelete) {
            return {
              ...role,
              shifts: role.shifts.filter(s => !deleteShifts.includes(s))
            };
          }
          return role;
        }).filter(r => r.shifts.length > 0);
        return updated;
      });
      setDeleteRoleMode(false);
      setRoleToDelete('');
      setDeleteShifts([]);
    }
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  });

  const builtInRoles = [
    'Meat Portioner',
    'Side Portioner',
    'Food Gopher',
    'Cashier',
    'Bartender',
    'Kitchen Swing',
    'Cashier Swing',
    'Shift Lead',
    'Manager'
  ];

  const orderedRoles = [...builtInRoles, ...customRoles.map(r => r.name)];

  const getShiftsForRole = (roleName) => {
    const builtIn = ROLES.find(r => r.name === roleName);
    if (builtIn) return builtIn.shifts;

    const custom = customRoles.find(r => r.name === roleName);
    return custom?.shifts || [];
  };

  const formatTo12Hour = (timeStr) => {
    try {
      const parsed = parseTime(timeStr, 'HH:mm', new Date());
      return isValid(parsed) ? formatTime(parsed, 'h:mm a') : timeStr;
    } catch {
      return timeStr;
    }
  };

  const getDayStaffing = (dateKey) => {
    const forecastedSlots = forecastGeneratedSchedule?.[dateKey]?.length || 0;
    const actualSlots = (scheduleData?.[dateKey] || []).filter(
      slot => slot.employeeName?.trim()
    ).length;

    const isGood = actualSlots >= forecastedSlots;

    return (
      <div
        className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full
        ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
      >
        Need: {forecastedSlots} / Act: {actualSlots}
      </div>
    );
  };

  const isManagerScheduled = (dateKey) => {
    const daySlots = scheduleData?.[dateKey] || [];
    return daySlots.some(
      slot => slot.role === 'Manager' && slot.employeeName?.trim()
    );
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const slots = (scheduleData?.[dateKey] || []).filter(
      slot => slot.role === role && slot.shift === shift
    );

    return (
      <div className="min-h-[64px] border rounded p-2 bg-slate-50 dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
        {slots.length === 0 ? (
          <div className="text-xs text-slate-400 italic">Off / No Shift</div>
        ) : (
          slots.map((entry) => (
            <div
              key={`${role}-${shift}-${entry.slotIndex}`}
              className="text-xs text-slate-600 dark:text-slate-300 space-y-1"
            >
              <input
                type="text"
                placeholder="Name"
                value={entry.employeeName || ''}
                onChange={(e) =>
                  onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'employeeName', e.target.value)
                }
                className="w-full border-b text-xs outline-none bg-transparent placeholder:text-slate-400"
              />
              <div className="flex space-x-1 text-xs">
                <input
                  type="text"
                  value={formatTo12Hour(entry.startTime || SHIFT_TIMES[entry.shift]?.start || '')}
                  onChange={(e) =>
                    onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'startTime', e.target.value)
                  }
                  readOnly={!isAdminMode}
                  className={cn(
                    "w-[70px] border-b outline-none",
                    isAdminMode ? "bg-yellow-100" : "bg-transparent"
                  )}
                />
                <span>–</span>
                <input
                  type="text"
                  value={formatTo12Hour(entry.endTime || SHIFT_TIMES[entry.shift]?.end || '')}
                  onChange={(e) =>
                    onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'endTime', e.target.value)
                  }
                  readOnly={!isAdminMode}
                  className={cn(
                    "w-[70px] border-b outline-none",
                    isAdminMode ? "bg-yellow-100" : "bg-transparent"
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => {
    const isCustom = customRoles.some(r => r.name === role);
    return (
      <tr key={`${role}-${shift}`} className="border-t border-slate-300 dark:border-slate-700">
        <td className="p-2 align-top text-slate-700 dark:text-slate-200 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full bg-indigo-200 text-indigo-900 px-3 py-1 text-sm font-semibold cursor-pointer"
              contentEditable={isAdminMode}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleRoleNameChange(role, e.currentTarget.innerText.trim())}
            >
              {getRoleName(role)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold
                ${shift === 'AM'
                  ? 'bg-blue-200 text-blue-900'
                  : shift === 'PM'
                  ? 'bg-fuchsia-200 text-fuchsia-900'
                  : 'bg-yellow-200 text-yellow-900'}`}
            >
              {shift}
            </span>
          </div>
        </td>
        {weekDates.map((date, idx) => (
          <td key={idx} className="p-2 align-top">
            {date ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid</div>}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="printable-area overflow-x-auto mt-6">
      {isAdminMode && (
        <div className="mb-4 space-y-2">
          {showAddRoleForm && (
            <div className="bg-white border p-4 rounded shadow-sm space-y-2 max-w-md">
              <input
                type="text"
                placeholder="Role name (e.g. Busser)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <div className="flex gap-4 items-center">
                {['AM', 'PM', 'SWING'].map(label => (
                  <label key={label} className="flex gap-1 text-sm items-center">
                    <input
                      type="checkbox"
                      checked={newRoleShifts.includes(label)}
                      onChange={(e) => {
                        setNewRoleShifts(prev =>
                          e.target.checked ? [...prev, label] : prev.filter(s => s !== label)
                        );
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-blue-600 text-white px-3 py-1 text-sm rounded"
                  onClick={() => {
                    if (newRoleName.trim()) {
                      setCustomRoles(prev => [
                        ...prev,
                        { name: newRoleName.trim(), shifts: newRoleShifts }
                      ]);
                      setNewRoleName('');
                      setNewRoleShifts(['AM']);
                      setShowAddRoleForm(false);
                    }
                  }}
                >
                  Add Role
                </button>
                <button
                  className="text-sm text-gray-500"
                  onClick={() => setShowAddRoleForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteRoleMode && (
            <div className="bg-white border p-4 rounded shadow-sm space-y-2 max-w-md">
              <select
                value={roleToDelete}
                onChange={(e) => setRoleToDelete(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="">Select role</option>
                {customRoles.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
              <div className="flex gap-4 items-center">
                {['AM', 'PM', 'SWING'].map(label => (
                  <label key={label} className="flex gap-1 text-sm items-center">
                    <input
                      type="checkbox"
                      checked={deleteShifts.includes(label)}
                      onChange={(e) => {
                        setDeleteShifts(prev =>
                          e.target.checked ? [...prev, label] : prev.filter(s => s !== label)
                        );
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-red-600 text-white px-3 py-1 text-sm rounded"
                  onClick={handleDeleteRole}
                >
                  Delete Role
                </button>
                <button
                  className="text-sm text-gray-500"
                  onClick={() => setDeleteRoleMode(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-green-700"
              onClick={() => setShowAddRoleForm(true)}
            >
              + Add Role
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-red-700"
              onClick={() => setDeleteRoleMode(true)}
            >
              🗑️ Delete Role
            </button>
          </div>
        </div>
      )}

      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white text-base font-semibold">
            <th className="p-4 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              return (
                <th key={idx} className="p-4 text-center w-[140px]">
                  <div>{format(date, 'EEE MM/dd')}</div>
                  <div className="space-y-1">
                    {getDayStaffing(dateKey)}
                    <div
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isManagerScheduled(dateKey)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isManagerScheduled(dateKey) ? 'Manager Scheduled' : '⚠ No Manager'}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {orderedRoles.flatMap(role =>
            getShiftsForRole(role).map(shift => renderRoleRow(role, shift))
          )}
        </tbody>
      </table>
    </div>
  );
};


export default EditableWeeklyScheduleTable;
