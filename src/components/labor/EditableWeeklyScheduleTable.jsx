import React from 'react';
import { addDays, format, isValid, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';

const parseTimeStringToDate = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const [hours, minutes, seconds] = parts.map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds || 0, 0);
  return isValid(date) ? date : null;
};

const EditableWeeklyScheduleTable = ({ weekStartDate, scheduleData = {}, onUpdate }) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? date : null;
  });

  const kitchenRoles = ['Meat Portioner', 'Side Portioner', 'Food Gopher'];
  const fohRoles = ['Cashier', 'Bartender'];
  const swingRoles = ['Kitchen Swing', 'Cashier Swing', 'Shift Lead'];

  const renderShiftCell = (day, shift, role) => {
    const data = scheduleData?.[format(day, 'yyyy-MM-dd')]?.[shift]?.[role] || [];
    return (
      <div className="min-h-[64px] border rounded p-2 bg-white dark:bg-slate-900">
        {data.map((entry, idx) => (
          <div key={idx} className="text-xs text-slate-600">
            {entry.name || 'Unassigned'} ({entry.start}–{entry.end})
          </div>
        ))}
      </div>
    );
  };

  const renderRoleRow = (role, shift) => (
    <tr key={`${role}-${shift}`} className="border-t border-slate-300">
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
                {date ? format(date, 'EEE MM/dd') : <span className="text-red-500">Invalid Date</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...kitchenRoles, ...fohRoles].flatMap(role => (
            ['AM', 'PM'].map(shift => renderRoleRow(role, shift))
          ))}
          {swingRoles.map(role => renderRoleRow(role, 'SWING'))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableWeeklyScheduleTable;
