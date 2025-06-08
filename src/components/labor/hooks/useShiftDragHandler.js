import { supabase } from '@/supabaseClient';
import { SHIFT_TIMES } from '@/config/laborScheduleConfig.js';

export const useShiftDragHandler = (scheduleId, employees, localCurrentWeekDates, toast, fetchShiftsAndFormatForUI, setScheduleDataState) => {
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId: rawDraggableId } = result;

    if (!destination || !scheduleId) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Optimistically update UI - this part can be complex and might be skipped for simplicity
    // For now, we rely on re-fetching from DB for UI updates.

    const isDraggingEmployeeFromUnassigned = source.droppableId === 'unassigned-employees';
    // If dragging from slot, draggableId is empId_shiftId. If from unassigned, it's just empId.
    const employeeIdBeingDragged = isDraggingEmployeeFromUnassigned ? rawDraggableId : rawDraggableId.split('_')[0]; 
    
    let sourceShiftId = null;
    if (!isDraggingEmployeeFromUnassigned) {
      sourceShiftId = rawDraggableId.split('_')[1];
      if (!sourceShiftId || sourceShiftId === 'undefined') { // Handle case where shift_id might be missing from draggableId
        // This might happen if a newly dragged employee (not yet saved) is being moved again.
        // We need to find its temporary representation in scheduleData or rely on a full save later.
        // For now, this path might lead to issues if not handled carefully.
        // The current `handleSaveSchedule` in DragDropScheduler (delete all then insert) simplifies this.
        // The user's new `handleDragEnd` implies direct DB updates, which is what we are building here.
        console.warn("Source shift ID is undefined, this might indicate an issue with dragging newly added items before a save cycle that assigns a DB shift_id.");
      }
    }
  
    // Case 1: Dragging from a schedule slot to "unassigned"
    if (!isDraggingEmployeeFromUnassigned && destination.droppableId === 'unassigned-employees') {
      if (sourceShiftId && sourceShiftId !== 'undefined') {
        const { error } = await supabase
          .from('shifts')
          .update({ employee_id: null }) 
          .eq('id', sourceShiftId);
        if (error) {
          toast({ title: "Error unassigning shift", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Shift Unassigned", description: "Employee removed from shift." });
        }
      } else {
         toast({ title: "Cannot Unassign", description: "Shift information missing for unassignment.", variant: "warning" });
      }
    }
    // Case 2: Dragging from "unassigned" to a schedule slot OR from one slot to another
    else if (destination.droppableId !== 'unassigned-employees') {
      const [date, shiftType, roleName] = destination.droppableId.split('_');
      const shiftTimes = SHIFT_TIMES[shiftType] || { start: "00:00", end: "00:00" };
      
      // If moving from another slot, first unassign from source
      if (!isDraggingEmployeeFromUnassigned && sourceShiftId && sourceShiftId !== 'undefined') {
        const { error: unassignError } = await supabase
          .from('shifts')
          .update({ employee_id: null })
          .eq('id', sourceShiftId);
        if (unassignError) {
          toast({ title: "Error moving (unassign)", description: unassignError.message, variant: "destructive" });
          // Re-fetch to ensure UI consistency after partial failure
          const freshData = await fetchShiftsAndFormatForUI(scheduleId, employees, localCurrentWeekDates());
          setScheduleDataState(freshData);
          return; // Stop further processing
        }
      }

      // Try to find an existing empty slot in the destination
      const { data: emptySlots, error: slotError } = await supabase
        .from('shifts')
        .select('id')
        .eq('schedule_id', scheduleId)
        .eq('day', date)
        .eq('shift_type', shiftType)
        .eq('role', roleName)
        .is('employee_id', null)
        .limit(1);

      if (slotError) {
         toast({ title: "Error finding slot", description: slotError.message, variant: "destructive" });
      } else if (emptySlots && emptySlots.length > 0) {
        const targetShiftId = emptySlots[0].id;
        const { error: updateError } = await supabase
          .from('shifts')
          .update({ employee_id: employeeIdBeingDragged, start_time: shiftTimes.start, end_time: shiftTimes.end })
          .eq('id', targetShiftId);
        if (updateError) {
          toast({ title: "Error assigning shift", description: updateError.message, variant: "destructive" });
        } else {
          toast({ title: "Shift Assigned", description: "Employee assigned to shift." });
        }
      } else {
        // No empty slot, create a new shift record
        const { error: createError } = await supabase
            .from('shifts')
            .insert([{ 
                schedule_id: scheduleId, 
                day: date, 
                shift_type: shiftType, 
                role: roleName, 
                employee_id: employeeIdBeingDragged,
                start_time: shiftTimes.start,
                end_time: shiftTimes.end
            }]);
        if (createError) {
            toast({ title: "Error creating shift", description: createError.message, variant: "destructive" });
        } else {
            toast({ title: "New Shift Created", description: "Employee assigned to a new shift." });
        }
      }
    }
    
    // Always re-fetch from DB to ensure UI consistency after any operation
    const newScheduleUIFormattedData = await fetchShiftsAndFormatForUI(scheduleId, employees, localCurrentWeekDates());
    setScheduleDataState(newScheduleUIFormattedData);
  };

  return { handleDragEnd };
};
