// EditableWeeklyScheduleTable.jsx

import React from 'react';
import { addDays, format, isValid, parse as parseTime } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig';
import { useData } from '@/contexts/DataContext';
import { format as formatTime } from 'date-fns';

const DEFAULT_SHIFT_TIMES = {
  AM: { start: '08:30', end: '16:30' },
  PM: { start: '15:00', end: '23:00' },
  SWING: { start: '10:00', end: '18:00' },
  FULL: { start: '08:00', end: '20:00' }
};

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate, forecastGeneratedSchedule = {} }) => {
  const { isAdminMode } = useData();

  const [editableRoles, setEditableRoles] = React.useState({});
  const [customRoles, setCustomRoles] = React.useState([]);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [newRoleShifts, setNewRoleShifts] = React.useState(['AM']);
  const [showAddRoleForm, setShowAddRoleForm] = React.useState(false);
  const [showDeleteRoleForm, setShowDeleteRoleForm] = React.useState(false);
  const [deleteRoleName, setDeleteRoleName] = React.useState('');
  const [deleteRoleShifts, setDeleteRoleShifts] = React.useState([]);

  const getRoleName = (defaultName) => editableRoles[defaultName] || defaultName;
  const handleRoleNameChange = (role, newName) => {
  setEditableRoles(prev => ({ ...prev, [role]: newName }));
};

  const removeCustomRoleShift = (roleName, shift) => {
    setCustomRoles(prev =>
      prev.map(r =>
        r.name === roleName ? { ...r, shifts: r.shifts.filter(s => s !== shift) } : r
      ).filter(r => r.shifts.length > 0)
    );
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  });

  const builtInRoles = [
    'Meat Portioner', 'Side Portioner', 'Food Gopher', 'Cashier', 'Bartender',
    'Kitchen Swing', 'Cashier Swing', 'Shift Lead', 'Manager'
  ];

  const orderedRoles = [
    ...[...builtInRoles, ...customRoles.map(r => r.name)].filter(r => r !== 'Manager'),
    'Manager'
  ];

  const getShiftsForRole = (roleName) => {
    const builtIn = ROLES.find(r => r.name === roleName);
    if (builtIn) return builtIn.shifts;
    const custom = customRoles.find(r => r.name === roleName);
    return custom?.shifts || (roleName === 'Manager' ? ['FULL'] : []);
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
      <div className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        Need: {forecastedSlots} / Act: {actualSlots}
      </div>
    );
  };

  const isManagerScheduled = (dateKey) => {
    const daySlots = scheduleData?.[dateKey] || [];
    return daySlots.some(slot => slot.role === 'Manager' && slot.employeeName?.trim());
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    let slots = (scheduleData?.[dateKey] || []).filter(
  slot => slot.role === role && slot.shift?.toUpperCase() === shift.toUpperCase()
);
    

if (slots.length === 0) {
  console.log('Injecting fallback slot:', { role, shift });
  slots = [{
    role,
    shift: shift.toUpperCase(), // ✅ Fix here
    slotIndex: 0,
    startTime: DEFAULT_SHIFT_TIMES[shift]?.start || DEFAULT_SHIFT_TIMES['FULL'].start || '08:00',
    endTime: DEFAULT_SHIFT_TIMES[shift]?.end || DEFAULT_SHIFT_TIMES['FULL'].end || '20:00',
    employeeName: ''
  }];
}

    return (
      <div className="min-h-[64px] border rounded p-2 bg-slate-50 shadow-sm hover:shadow-md transition-all">
        {slots.map((entry) => (
          <div key={`${role}-${shift}-${entry.slotIndex}`} className="space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={entry.employeeName || ''}
              onChange={(e) => onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'employeeName', e.target.value)}
              readOnly={!isAdminMode}
              className="w-full border-b text-xs outline-none bg-transparent placeholder:text-slate-400"
            />
        <div className="flex items-center gap-[1px] w-[132px] text-nowrap">
              <input
                type="text"
                value={formatTo12Hour(entry.startTime)}
                onChange={(e) => onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'startTime', e.target.value)}
                readOnly={!isAdminMode}
                className="w-[56px] text-center text-xs border-b outline-none bg-transparent"
              />
              <span>–</span>
              <input
                type="text"
                value={formatTo12Hour(entry.endTime)}
                onChange={(e) => onUpdate(dateKey, entry.role, entry.shift, entry.slotIndex, 'endTime', e.target.value)}
                readOnly={!isAdminMode}
                className="w-[64px] text-center text-xs border-b outline-none bg-transparent"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300">
      <td className="p-2 align-top text-slate-700 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {isAdminMode ? (
  <input
    type="text"
    value={getRoleName(role)}
    onChange={(e) => handleRoleNameChange(role, e.target.value)}
    className="rounded-full bg-indigo-200 text-indigo-900 px-2 py-1 text-sm font-semibold w-[120px] border-none outline-none"
  />
) : (
  <span className="rounded-full bg-indigo-200 text-indigo-900 px-3 py-1 text-sm font-semibold">
    {getRoleName(role)}
  </span>
)}
          {role !== 'Manager' && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              shift === 'AM' ? 'bg-blue-200 text-blue-900' :
              shift === 'PM' ? 'bg-fuchsia-200 text-fuchsia-900' :
              'bg-yellow-200 text-yellow-900'
            }`}>
              {shift}
             </span>
          )}
        </div>
      </td>
      {weekDates.map((date, idx) => (
        <td key={idx} className="p-2 align-top">
          {date ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid</div>}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="printable-area overflow-x-auto mt-6">
      {isAdminMode && (
        <div className="flex gap-4 mb-4">
          <button onClick={() => setShowAddRoleForm(true)} className="bg-green-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-green-700">+ Add Role</button>
          <button onClick={() => setShowDeleteRoleForm(true)} className="bg-red-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-red-700">🗑 Delete Role</button>
        </div>
      )}

      {isAdminMode && showAddRoleForm && (
        <div className="mb-4 p-4 bg-white border rounded shadow space-y-2">
          <input
            type="text"
            placeholder="Role name (e.g. Busser)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
          <div className="flex gap-4">
            {['AM', 'PM', 'SWING', 'FULL'].map(shift => (
              <label key={shift} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={newRoleShifts.includes(shift)}
                  onChange={(e) => {
                    setNewRoleShifts(prev =>
                      e.target.checked ? [...prev, shift] : prev.filter(s => s !== shift)
                    );
                  }}
                />
                {shift}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              if (newRoleName.trim()) {
                setCustomRoles(prev => [...prev, { name: newRoleName.trim(), shifts: newRoleShifts }]);
                setNewRoleName('');
                setNewRoleShifts(['AM']);
                setShowAddRoleForm(false);
              }
            }} className="bg-blue-600 text-white px-4 py-1 rounded">Add Role</button>
            <button onClick={() => setShowAddRoleForm(false)} className="text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isAdminMode && showDeleteRoleForm && (
        <div className="mb-4 p-4 bg-white border rounded shadow space-y-2">
          <select
            value={deleteRoleName}
            onChange={(e) => setDeleteRoleName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Select role</option>
            {customRoles.map(role => (
              <option key={role.name} value={role.name}>{role.name}</option>
            ))}
          </select>
          <div className="flex gap-4">
            {['AM', 'PM', 'SWING'].map(shift => (
              <label key={shift} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={deleteRoleShifts.includes(shift)}
                  onChange={(e) => {
                    setDeleteRoleShifts(prev =>
                      e.target.checked ? [...prev, shift] : prev.filter(s => s !== shift)
                    );
                  }}
                />
                {shift}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteRoleShifts.forEach(shift => removeCustomRoleShift(deleteRoleName, shift));
                setDeleteRoleName('');
                setDeleteRoleShifts([]);
                setShowDeleteRoleForm(false);
              }}
              className="bg-red-600 text-white px-4 py-1 rounded"
            >
              Delete Role
            </button>
            <button onClick={() => setShowDeleteRoleForm(false)} className="text-sm">Cancel</button>
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
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${isManagerScheduled(dateKey) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {isManagerScheduled(dateKey) ? 'Manager Scheduled' : '⚠ No Manager'}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {orderedRoles.flatMap(role => getShiftsForRole(role).map(shift => renderRoleRow(role, shift)))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
