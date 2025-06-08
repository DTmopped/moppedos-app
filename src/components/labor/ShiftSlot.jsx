
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Input } from '@/components/ui/input.jsx';
import { cn } from ''@/lib//utils;

const ShiftSlot = ({ employee, index, handleTimeChange }) => {
  const draggableItemId = employee.id.startsWith('empty-') ? employee.id : `${employee.id}_${employee.shift_id}`;

  if (employee.id.startsWith('empty-')) {
    return (
      <div key={employee.id} className="p-1 mb-1 rounded text-[11px] bg-slate-500/30 border border-dashed border-slate-500/50 shadow-sm min-h-[44px] flex items-center justify-center">
        <p className="text-[10px] text-slate-500 italic tabular-nums">Empty Slot</p>
      </div>
    );
  }

  return (
    <Draggable key={draggableItemId} draggableId={draggableItemId} index={index}>
      {(providedDraggableItem, snapshotDraggableItem) => (
        <div
          ref={providedDraggableItem.innerRef}
          {...providedDraggableItem.draggableProps}
          className={cn(
            "p-1 mb-1 rounded text-[11px] bg-slate-500/60 hover:bg-slate-400/60 border border-slate-500 shadow text-slate-100",
            snapshotDraggableItem.isDragging && "ring-1 ring-purple-500 shadow-lg opacity-90"
          )}
        >
          <div {...providedDraggableItem.dragHandleProps} className="cursor-grab font-semibold">{employee.name}</div>
          <div className="flex items-center justify-between mt-0.5 space-x-1">
            <Input
              type="time"
              value={employee.startTime || ''}
              onChange={(e) => handleTimeChange(employee.shift_id, 'start_time', e.target.value)}
              className="bg-slate-700 text-slate-200 border-slate-600 rounded px-1 py-0.5 text-[10px] h-6 w-[60px]"
            />
            <span className="text-slate-400">-</span>
            <Input
              type="time"
              value={employee.endTime || ''}
              onChange={(e) => handleTimeChange(employee.shift_id, 'end_time', e.target.value)}
              className="bg-slate-700 text-slate-200 border-slate-600 rounded px-1 py-0.5 text-[10px] h-6 w-[60px]"
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ShiftSlot;
