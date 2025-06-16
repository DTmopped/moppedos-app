import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

// 👇 Tailwind classes for color logic
const getRowColor = (employeeName, isManagerView = false) => {
  if (!employeeName) return 'bg-green-100 text-green-900';         // needs assignment
  if (employeeName && !isManagerView) return 'bg-blue-100 text-blue-900'; // assigned
  return 'bg-slate-50'; // fallback/default
};

const EditableDailyScheduleTable = ({ day, dailyScheduleData, onUpdate, isManagerView = true }) => {
  const handleInputChange = (roleName, shift, slotIndex, field, value) => {
    onUpdate(day, roleName, shift, slotIndex, field, value);
  };

  return (
    <Card className="glassmorphic-card mb-8 card-hover-glow">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary dark:text-sky-400 flex items-center">
          <CalendarClock size={22} className="mr-3 text-primary dark:text-sky-400 no-print" />
          {day}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 dark:bg-slate-800">
                <TableHead className="min-w-[160px] text-foreground/80">Role</TableHead>
                <TableHead className="min-w-[80px] text-foreground/80">Shift</TableHead>
                <TableHead className="min-w-[120px] text-foreground/80">Start Time</TableHead>
                <TableHead className="min-w-[120px] text-foreground/80">End Time</TableHead>
                <TableHead className="min-w-[180px] text-foreground/80">Employee Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyScheduleData.map((slot, index) => {
                const rowColor = getRowColor(slot.employeeName, isManagerView);
                return (
                  <TableRow key={`${day}-${slot.role}-${slot.shift}-${slot.slotIndex}-${index}`} className={cn(rowColor)}>
                    <TableCell className="font-medium">{slot.role}</TableCell>
                    <TableCell>{slot.shift}</TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={slot.startTime || ''}
                        onChange={(e) =>
                          handleInputChange(slot.role, slot.shift, slot.slotIndex, 'startTime', e.target.value)
                        }
                        className="text-xs p-1 h-8 bg-white/70 dark:bg-slate-800 print:bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={slot.endTime || ''}
                        onChange={(e) =>
                          handleInputChange(slot.role, slot.shift, slot.slotIndex, 'endTime', e.target.value)
                        }
                        className="text-xs p-1 h-8 bg-white/70 dark:bg-slate-800 print:bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Employee Name"
                        value={slot.employeeName || ''}
                        onChange={(e) =>
                          handleInputChange(slot.role, slot.shift, slot.slotIndex, 'employeeName', e.target.value)
                        }
                        className="text-xs p-1 h-8 bg-white/70 dark:bg-slate-800 print:bg-white"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableDailyScheduleTable;
