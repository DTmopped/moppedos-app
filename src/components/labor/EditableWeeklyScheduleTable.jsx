import React, { useContext, useMemo, useState } from 'react';
import { addDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { useData } from '@/contexts/DataContext';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate, dynamicRoles = [], onAddRole, onDeleteRole }) => {
  const { isAdminMode } = useData();

  const [isAddMode, setIsAddMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newShifts, setNewShifts] = useState({ AM: true, PM: false });
  const [deleteRoleName, setDeleteRoleName] = useState('');
  const [deleteShifts, setDeleteShifts] = useState({ AM: false, PM: false, SWING: false });

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  }), [weekStartDate]);

  const allRoles = useMemo(() => {
    const coreRoles = [
      'Meat Portioner', 'Side Portioner', 'Food Gopher',
      'Cashier', 'Bartender', 'Kitchen Swing', 'Cashier Swing', 'Shift Lead'
    ];
    const combined = [...coreRoles, ...dynamicRoles.map(r => r.name)];
    if (!combined.includes('Manager')) combined.push('Manager');
    return combined;
  }, [dynamicRoles]);

  const getShiftsForRole = (roleName) => {
    if (roleName === 'Manager') return ['AM'];
    const dynamic = dynamicRoles.find(r => r.name === roleName);
    return dynamic?.shifts || ROLES.find(r => r.name === roleName)?.shifts || [];
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const defaultTimes = SHIFT_TIMES[shift] || { start: '08:30 AM', end: '04:30 PM' };
    const slots = scheduleData?.[dateKey]?.[shift]?.[role] || [];

    return (
      <div className="min-h-[64px] border rounded p-2 bg-white dark:bg-slate-900">
        {slots.length === 0 && (
          <div className="text-xs text-slate-400 italic">Off / No Shift</div>
        )}
        {slots.map((entry, idx) => (
          <div key={idx} className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={entry.name || ''}
              onChange={(e) =>
                onUpdate(dateKey, role, shift, idx, 'name', e.target.value)
              }
              className="w-full border-b text-xs outline-none bg-transparent placeholder:text-slate-400"
            />
            <div className="flex space-x-1 text-xs">
              <input
                type="text"
                value={entry.start || defaultTimes.start}
                onChange={(e) =>
                  onUpdate(dateKey, role, shift, idx, 'start', e.target.value)
                }
                readOnly={!isAdminMode}
                className={cn(
                  'w-[60px] border-b outline-none',
                  isAdminMode ? 'bg-yellow-100' : 'bg-transparent'
                )}
              />
              <span>–</span>
              <input
                type="text"
                value={entry.end || defaultTimes.end}
                onChange={(e) =>
                  onUpdate(dateKey, role, shift, idx, 'end', e.target.value)
                }
                readOnly={!isAdminMode}
                className={cn(
                  'w-[60px] border-b outline-none',
                  isAdminMode ? 'bg-yellow-100' : 'bg-transparent'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300 dark:border-slate-700">
      <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">{role}</span>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-semibold',
            shift === 'AM' ? 'bg-blue-100 text-blue-700' :
            shift === 'PM' ? 'bg-purple-100 text-purple-700' :
            'bg-yellow-100 text-yellow-800')}>{shift}</span>
          {isAdminMode && dynamicRoles.some(r => r.name === role) && (
            <button onClick={() => onDeleteRole(role, shift)} className="text-red-500 ml-1">×</button>
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
    <div className="overflow-x-auto mt-6">
      {isAdminMode && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <button onClick={() => { setIsAddMode(true); setIsDeleteMode(false); }} className="px-3 py-1 rounded bg-green-600 text-white">+ Add Role</button>
          <button onClick={() => { setIsDeleteMode(true); setIsAddMode(false); }} className="px-3 py-1 rounded bg-red-600 text-white">🗑️ Delete Role</button>

          {isAddMode && (
            <div className="flex flex-col gap-2">
              <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Role name (e.g. Busser)" className="border p-1 rounded" />
              <div className="flex gap-2">
                {['AM', 'PM'].map(shift => (
                  <label key={shift}><input type="checkbox" checked={newShifts[shift]} onChange={() => setNewShifts(prev => ({ ...prev, [shift]: !prev[shift] }))} /> {shift}</label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const selected = Object.entries(newShifts).filter(([k, v]) => v).map(([k]) => k);
                  if (newRoleName && selected.length > 0) onAddRole(newRoleName, selected);
                  setNewRoleName(''); setNewShifts({ AM: true, PM: false }); setIsAddMode(false);
                }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Role</button>
                <button onClick={() => setIsAddMode(false)} className="text-gray-500">Cancel</button>
              </div>
            </div>
          )}

          {isDeleteMode && (
            <div className="flex flex-col gap-2">
              <select value={deleteRoleName} onChange={e => setDeleteRoleName(e.target.value)} className="border p-1 rounded">
                <option value="">Select role</option>
                {dynamicRoles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              <div className="flex gap-2">
                {['AM', 'PM', 'SWING'].map(shift => (
                  <label key={shift}><input type="checkbox" checked={deleteShifts[shift]} onChange={() => setDeleteShifts(prev => ({ ...prev, [shift]: !prev[shift] }))} /> {shift}</label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const selected = Object.entries(deleteShifts).filter(([k, v]) => v).map(([k]) => k);
                  if (deleteRoleName && selected.length > 0) onDeleteRole(deleteRoleName, selected);
                  setDeleteRoleName(''); setDeleteShifts({ AM: false, PM: false, SWING: false }); setIsDeleteMode(false);
                }} className="bg-red-600 text-white px-3 py-1 rounded">Delete Role</button>
                <button onClick={() => setIsDeleteMode(false)} className="text-gray-500">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <table className="table-fixed border-collapse w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="p-2 text-left w-[180px]">Role / Shift</th>
            {weekDates.map((date, idx) => (
              <th key={idx} className="p-2 text-center w-[140px]">
                {date ? format(date, 'EEE MM/dd') : <span className="text-red-500">Invalid</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...allRoles].filter(Boolean).flatMap(role =>
            getShiftsForRole(role).map(shift => renderRoleRow(role, shift))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
