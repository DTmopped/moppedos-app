import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { Input } from "components/ui/input.jsx";
import { CalendarClock } from 'lucide-react';
import { SHIFT_BG_CLASSES } from '@/config/laborScheduleConfig.jsx';
import { cn } from '@/lib/utils';

const EditableDailyScheduleTable = ({ day, dailyScheduleData, onUpdate }) => {
  const handleInputChange = (roleName, shift, slotIndex, field, value) => {
    onUpdate(day, roleName, shift, slotIndex, field, value);
  };

  return (
    <Card className="glassmorphic-card mb-8 card-hover-glow">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary dark:text-sky-400 flex items-center">
          <CalendarClock size={24} className="mr-3 text-primary dark:text-sky-400 no-print" />
          {day}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px] text-foreground/80">Role</TableHead>
                <TableHead className="min-w-[80px] text-foreground/80">Shift</TableHead>
                <TableHead className="min-w-[120px] text-foreground/80">Start Time</TableHead>
                <TableHead className="min-w-[120px] text-foreground/80">End Time</TableHead>
                <TableHead className="min-w-[180px] text-foreground/80">Employee Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyScheduleData.map((slot, index) => (
                <TableRow
                  key={`${day}-${slot.role}-${slot.shift}-${slot.slotIndex}-${index}`}
                  className={cn(SHIFT_BG_CLASSES[slot.shift] || '', 'print:text-black')}
                >
                  <TableCell className={cn('font-medium', slot.colorClass)}>{slot.role}</TableCell>
                  <TableCell className={cn(slot.colorClass)}>{slot.shift}</TableCell>
                  <TableCell className={cn(slot.colorClass)}>
                    <Input
                      type="time"
                      value={slot.startTime || ""}
                      onChange={(e) => handleInputChange(slot.role, slot.shift, slot.slotIndex, 'startTime', e.target.value)}
                      className="text-xs p-1 h-8 bg-background/50 dark:bg-background/30 print:border-gray-300 print:bg-white"
                    />
                  </TableCell>
                  <TableCell className={cn(slot.colorClass)}>
                    <Input
                      type="time"
                      value={slot.endTime || ""}
                      onChange={(e) => handleInputChange(slot.role, slot.shift, slot.slotIndex, 'endTime', e.target.value)}
                      className="text-xs p-1 h-8 bg-background/50 dark:bg-background/30 print:border-gray-300 print:bg-white"
                    />
                  </TableCell>
                  <TableCell className={cn(slot.colorClass)}>
                    <Input
                      type="text"
                      placeholder="Employee Name"
                      value={slot.employeeName || ""}
                      onChange={(e) => handleInputChange(slot.role, slot.shift, slot.slotIndex, 'employeeName', e.target.value)}
                      className="text-xs p-1 h-8 bg-background/50 dark:bg-background/30 print:border-gray-300 print:bg-white"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableDailyScheduleTable;
