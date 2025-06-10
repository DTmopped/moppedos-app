
import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { supabase } from 'supabaseClient.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Calendar,
  Clock,
  Info 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";

const ScheduleCrudTest = () => {
  // State declarations
  const [startDate, setStartDate] = useState('2025-06-03');
  const [scheduleData, setScheduleData] = useState('{"notes": "Test schedule created from CRUD test"}');
  const [schedules, setSchedules] = useState([]);
  const [updateId, setUpdateId] = useState('');
  const [updateStatus, setUpdateStatus] = useState('published');
  const [deleteId, setDeleteId] = useState('');
  const [loading, setLoading] = useState({
    create: false,
    read: false,
    update: false,
    delete: false
  });
  const [results, setResults] = useState({
    create: null,
    read: null,
    update: null,
    delete: null
  });
  
  const { toast } = useToast();

  const showToast = (title, description, type = 'default') => {
    toast({
      title,
      description,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  const fetchSchedules = async () => {
    setLoading(prev => ({ ...prev, read: true }));
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          shifts (
            id,
            employee_id,
            day,
            shift_type,
            role,
            start_time,
            end_time
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data.length === 0) {
        setResults(prev => ({ 
          ...prev, 
          read: { success: true, message: 'No schedules found.' } 
        }));
      } else {
        setResults(prev => ({ 
          ...prev, 
          read: { success: true, message: `Found ${data.length} schedules` } 
        }));
      }

      setSchedules(data);
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        read: { success: false, message: error.message } 
      }));
      showToast('Error Reading Schedules', error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, read: false }));
    }
  };

  const createSchedule = async () => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const scheduleDataObj = JSON.parse(scheduleData);
      
      // Calculate end date (7 days after start date)
      const endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('schedules')
        .insert([
          {
            week_start_date: startDate,
            week_end: endDate,
            status: 'draft',
            schedule_data: scheduleDataObj
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setResults(prev => ({ 
        ...prev, 
        create: { 
          success: true, 
          message: `Schedule created successfully for week ${startDate} to ${endDate}` 
        } 
      }));
      showToast('Success', `Schedule created for week ${startDate} to ${endDate}`);
      fetchSchedules();
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        create: { success: false, message: error.message } 
      }));
      showToast('Error Creating Schedule', error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const updateSchedule = async () => {
    if (!updateId) {
      setResults(prev => ({ 
        ...prev, 
        update: { success: false, message: 'Please select a schedule to update' } 
      }));
      showToast('Error', 'Please select a schedule to update', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, update: true }));
    try {
      // First, verify the schedule exists
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', updateId)
        .single();

      if (fetchError) {
        throw new Error(`Schedule not found: ${fetchError.message}`);
      }

      // Perform the update
      const { data, error } = await supabase
        .from('schedules')
        .update({ 
          status: updateStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', updateId)
        .select(`
          *,
          shifts (
            id,
            employee_id,
            day,
            shift_type,
            role,
            start_time,
            end_time
          )
        `)
        .single();

      if (error) throw error;

      setResults(prev => ({ 
        ...prev, 
        update: { 
          success: true, 
          message: 'Schedule updated successfully',
          data: data // Store the updated data for display
        } 
      }));
      showToast('Success', `Schedule ${updateId} updated to status: ${updateStatus}`);
      fetchSchedules();
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        update: { 
          success: false, 
          message: error.message,
          details: error.details || 'No additional details available'
        } 
      }));
      showToast('Error Updating Schedule', error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const deleteSchedule = async () => {
    if (!deleteId) {
      setResults(prev => ({ 
        ...prev, 
        delete: { success: false, message: 'Please select a schedule to delete' } 
      }));
      showToast('Error', 'Please select a schedule to delete', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, delete: true }));
    try {
      // First, verify the schedule exists and get its data for the confirmation message
      const { data: scheduleToDelete, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', deleteId)
        .single();

      if (fetchError) {
        throw new Error(`Schedule not found: ${fetchError.message}`);
      }

      // Delete associated shifts first (if any)
      const { error: shiftsError } = await supabase
        .from('shifts')
        .delete()
        .eq('schedule_id', deleteId);

      if (shiftsError) {
        throw new Error(`Error deleting associated shifts: ${shiftsError.message}`);
      }

      // Delete the schedule
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setResults(prev => ({ 
        ...prev, 
        delete: { 
          success: true, 
          message: `Schedule deleted successfully (ID: ${deleteId}, Week: ${format(parseISO(scheduleToDelete.week_start_date), 'MMM d, yyyy')})` 
        } 
      }));
      showToast('Success', 'Schedule deleted successfully');
      fetchSchedules();
      setDeleteId('');
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        delete: { 
          success: false, 
          message: error.message,
          details: error.details || 'No additional details available'
        } 
      }));
      showToast('Error Deleting Schedule', error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div className="space-y-6">
      {/* ... rest of the JSX remains exactly the same ... */}
    </div>
  );
};

export default ScheduleCrudTest;
