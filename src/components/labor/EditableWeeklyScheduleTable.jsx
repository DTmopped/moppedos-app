import React from 'react';
import { addDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate }) => {
  const { isAdminMode } = useData();

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  });

  const orderedRoles = [
    'Meat Portioner',
    'Side Portioner',
    'Food Gopher',
    'Cashier',
    'Bartender',
    'Kitchen Swing',
    'Cashier Swing',
    'Shift Lead'
  ];

  const getShiftsForRole = (roleName) => {
    const role = ROLES.find(r => r.name === roleName);
    return role?.shifts || [];
  };

  const formatTime12hr = (timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(+hour);
    date.setMinutes(+minute);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderShiftCell = (day, shift, role) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const data = scheduleData?.[dateKey]?.[shift]?.[role] || [];
    const defaultTime = SHIFT_TIMES[shift];

    return (
      <div className={cn(
        'min-h-[64px] border rounded p-2 transition-all duration-200',
        isAdminMode && 'hover:bg-yellow-50 cursor-pointer'
      )}>
        {data.length === 0 && (
          <div className="text-xs text-slate-400 italic">—</div>
        )}
        {data.map((entry, idx) => (
          <div key={idx} className="text-xs text-slate-600 dark:text-slate-300">
            {entry.name || 'Unassigned'}{' '}
            ({
              isAdminMode
                ? `${entry.start || defaultTime.start}–${entry.end || defaultTime.end}`
                : `${formatTime12hr(entry.start || defaultTime.start)}–${formatTime12hr(entry.end || defaultTime.end)}`
            })
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300 dark:border-slate-700">
      <td className="p-2 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
        {role} ({shift})
      </td>
      {weekDates.map((date, idx) => (
        <td key={idx} className="p-2 align-top">
          {date ? renderShiftCell(date, shift, role) : <div className="text-red-500">Invalid Date</div>}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto mt-6">
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
          {orderedRoles.flatMap(role =>
            getShiftsForRole(role).map(shift => renderRoleRow(role, shift))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
