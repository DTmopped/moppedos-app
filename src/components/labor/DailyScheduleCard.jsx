
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../src/lib/utils.js';
import { SHIFT_BG_CLASSES } from '@/config/laborScheduleConfig.jsx';
import ShiftSlot from '@/components/labor/ShiftSlot';

const DailyScheduleCard = ({
  date,
  scheduleDataForDay,
  laborCostForDay,
  optimalStaffingForDay,
  handleAutoSchedule,
  handleTimeChange,
  isProcessingDay,
  isSchedulerLoading,
}) => {
  return (
    <Card className="overflow-hidden bg-slate-800/60 border-slate-700 shadow-lg flex flex-col">
      <CardHeader className="bg-slate-700/50 p-2.5 border-b border-slate-600">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-sm font-medium text-slate-200">
            {format(parseISO(date), 'EEE')}
            <span className="block text-xs text-slate-400">{format(parseISO(date), 'MMM d')}</span>
          </CardTitle>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-slate-300">
            {optimalStaffingForDay ? (
              <span className="font-medium">
                Forecast: {optimalStaffingForDay.projectedGuests} guests
              </span>
            ) : (
              <span className="text-slate-500">No forecast</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-purple-300 border-purple-500/50 hover:bg-purple-600/30 hover:text-purple-200"
            onClick={() => handleAutoSchedule(date)}
            disabled={!optimalStaffingForDay || isProcessingDay === date || isSchedulerLoading}
          >
            {isProcessingDay === date ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Brain className="h-3 w-3 mr-1" />}
            Auto
          </Button>
        </div>

        {laborCostForDay && (
          <div className={cn(
            "text-xs p-1 rounded mb-1 flex items-center justify-between",
            laborCostForDay.isOverTarget
              ? 'bg-red-700/50 text-red-300 border border-red-600/70'
              : 'bg-green-700/50 text-green-300 border border-green-600/70'
          )}>
            <span>Labor: {laborCostForDay.laborCostPercentage.toFixed(1)}%</span>
            {laborCostForDay.isOverTarget ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
          </div>
        )}
        {optimalStaffingForDay && laborCostForDay && (
          <div className="text-[10px] text-slate-400 leading-tight">
            <span>Sales: ${optimalStaffingForDay?.projectedSales?.toFixed(2) || 'N/A'}</span>
            <span className="ml-2">Cost: ${laborCostForDay.totalLaborCost.toFixed(2)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-1.5 space-y-2 flex-grow lg:max-h-[calc(100vh-400px)] overflow-y-auto">
        {scheduleDataForDay && Object.entries(scheduleDataForDay).map(([shiftType, roles]) => (
          <div key={shiftType} className={cn("p-1.5 rounded", SHIFT_BG_CLASSES[shiftType]?.replace(/bg-(\w+)-(\d+)/, 'bg-$1-800/50 border border-$1-700').replace(/text-(\w+)-(\d+)/, 'text-$1-200') || 'bg-slate-700/50 border border-slate-600')}>
            <h4 className="text-xs font-semibold mb-1 text-center text-slate-300">{shiftType}</h4>
            {Object.entries(roles).map(([roleName, assignedEmpsInSlot]) => {
              const optimalCount = optimalStaffingForDay?.optimalStaffing?.[roleName]?.[shiftType];
              return (
                <Droppable key={`${date}_${shiftType}_${roleName}`} droppableId={`${date}_${shiftType}_${roleName}`}>
                  {(providedDroppableArea, snapshotDroppableArea) => (
                    <div
                      ref={providedDroppableArea.innerRef}
                      {...providedDroppableArea.droppableProps}
                      className={cn(
                        "mb-1.5 p-1 rounded bg-slate-600/30 min-h-[60px]",
                        snapshotDroppableArea.isDraggingOver && "bg-slate-500/50 ring-1 ring-pink-400"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-medium text-slate-400 mb-0.5 uppercase tracking-wider">{roleName}</p>
                        {optimalCount !== undefined && <span className="text-[9px] text-purple-300/70">Opt: {optimalCount}</span>}
                      </div>

                      {assignedEmpsInSlot.map((employee, index) => (
                        <ShiftSlot
                          key={employee.id.startsWith('empty-') ? employee.id : `${employee.id}_${employee.shift_id}`}
                          employee={employee}
                          index={index}
                          handleTimeChange={handleTimeChange}
                        />
                      ))}
                      {providedDroppableArea.placeholder}
                      {assignedEmpsInSlot.filter(e => !e.id.startsWith('empty-')).length === 0 &&
                        !assignedEmpsInSlot.find(e => e.id.startsWith('empty-')) && (
                          <p className="text-[10px] text-slate-500 italic text-center pt-1 min-h-[44px] flex items-center justify-center">Drop Employee Here</p>
                        )}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DailyScheduleCard;
