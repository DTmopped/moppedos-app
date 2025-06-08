
import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { UserPlus } from 'lucide-react';
import { cn } from '../'@/lib//utils.js';
import { ROLES } from '@/config/laborScheduleConfig.jsx';

const UnassignedEmployeesPanel = ({ unassignedEmployees, employees }) => {
  return (
    <Droppable droppableId="unassigned-employees">
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "w-full lg:w-60 xl:w-72 flex-shrink-0 bg-slate-800/60 border-slate-700 shadow-lg",
            snapshot.isDraggingOver && "bg-slate-700/80 ring-2 ring-purple-500"
          )}
        >
          <CardHeader className="py-2.5 px-3 border-b border-slate-700">
            <CardTitle className="text-md text-purple-300 flex items-center">
              <UserPlus className="mr-2 h-5 w-5" /> Available Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 min-h-[150px] lg:max-h-[calc(100vh-330px)] overflow-y-auto p-2">
            {unassignedEmployees.map((employee, index) => (
              <Draggable key={employee.id} draggableId={String(employee.id)} index={index}>
                {(providedDraggable, snapshotDraggable) => (
                  <div
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    {...providedDraggable.dragHandleProps}
                    className={cn(
                      "p-2 rounded text-xs cursor-grab bg-slate-700 hover:bg-slate-600/90 border border-slate-600 shadow-md text-slate-100",
                      snapshotDraggable.isDragging && "ring-2 ring-pink-500 shadow-xl opacity-80 transform scale-105"
                    )}
                  >
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-slate-400 ml-1">({ROLES.find(r => r.name === employee.role)?.abbreviation || employee.role})</span>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {unassignedEmployees.length === 0 && employees.length > 0 && <p className="text-xs text-slate-500 italic text-center py-3">All employees assigned.</p>}
            {employees.length === 0 && <p className="text-xs text-slate-500 italic text-center py-3">No employees available.</p>}
          </CardContent>
        </Card>
      )}
    </Droppable>
  );
};

export default UnassignedEmployeesPanel;
