import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Your existing Supabase client
import { MOPPED_RESTAURANT_TEMPLATE } from '@/config/laborScheduleConfig';

const LaborDataContext = createContext();

export const useLaborData = () => {
  const context = useContext(LaborDataContext);
  if (!context) {
    throw new Error('useLaborData must be used within a LaborDataProvider');
  }
  return context;
};

// Mock data for demo/fallback
const mockEmployees = [
  { id: '1', name: 'John Smith', email: 'john@moppedrestaurant.com', phone: '555-0101', is_active: true, role: 'Server', department: 'FOH', hourly_rate: 15.00 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@moppedrestaurant.com', phone: '555-0102', is_active: true, role: 'Meat Portioner', department: 'BOH', hourly_rate: 18.00 },
  { id: '3', name: 'Mike Davis', email: 'mike@moppedrestaurant.com', phone: '555-0103', is_active: true, role: 'Dishwasher', department: 'BOH', hourly_rate: 15.50 },
  { id: '4', name: 'Lisa Wilson', email: 'lisa@moppedrestaurant.com', phone: '555-0104', is_active: true, role: 'Cashier', department: 'FOH', hourly_rate: 16.50 },
  { id: '5', name: 'Tom Brown', email: 'tom@moppedrestaurant.com', phone: '555-0105', is_active: true, role: 'Bartender', department: 'Bar', hourly_rate: 18.50 },
  { id: '6', name: 'Emma Garcia', email: 'emma@moppedrestaurant.com', phone: '555-0106', is_active: true, role: 'Manager', department: 'Management', hourly_rate: 28.00 }
];

const mockPTORequests = [
  { id: '1', employee_id: '1', employee_name: 'John Smith', start_date: '2025-10-01', end_date: '2025-10-03', status: 'pending', reason: 'Family vacation' },
  { id: '2', employee_id: '3', employee_name: 'Mike Davis', start_date: '2025-10-15', end_date: '2025-10-15', status: 'approved', reason: 'Doctor appointment' },
  { id: '3', employee_id: '5', employee_name: 'Tom Brown', start_date: '2025-11-01', end_date: '2025-11-05', status: 'pending', reason: 'Personal time' }
];

// Mock schedule requests for demo
const mockScheduleRequests = [
  { id: '1', employee_id: '1', employee_name: 'John Smith', request_type: 'time_off', requested_date: '2025-10-05', status: 'pending', reason: 'Personal appointment' },
  { id: '2', employee_id: '2', employee_name: 'Sarah Johnson', request_type: 'shift_preference', requested_date: '2025-10-08', status: 'approved', reason: 'Prefer morning shift' },
  { id: '3', employee_id: '4', employee_name: 'Lisa Wilson', request_type: 'shift_swap', requested_date: '2025-10-10', status: 'pending', reason: 'Need to swap with Tom' }
];

// Mock availability data
const mockAvailability = [
  { id: '1', employee_id: '1', employee_name: 'John Smith', day_of_week: 1, available_start: '09:00', available_end: '17:00', preferred_departments: ['FOH'] },
  { id: '2', employee_id: '2', employee_name: 'Sarah Johnson', day_of_week: 2, available_start: '08:00', available_end: '16:00', preferred_departments: ['BOH'] },
  { id: '3', employee_id: '3', employee_name: 'Mike Davis', day_of_week: 3, available_start: '10:00', available_end: '18:00', preferred_departments: ['BOH'] }
];

export const LaborDataProvider = ({ children }) => {
  // Existing state
  const [employees, setEmployees] = useState(mockEmployees);
  const [ptoRequests, setPtoRequests] = useState(mockPTORequests);
  const [currentTemplate, setCurrentTemplate] = useState(MOPPED_RESTAURANT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // New scheduling state
  const [scheduleRequests, setScheduleRequests] = useState(mockScheduleRequests);
  const [employeeAvailability, setEmployeeAvailability] = useState(mockAvailability);

  // Get current user's location
  const getCurrentLocationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Use your test location
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('location_id')
        .eq('user_id', user.id)
        .single();
      
      return profile?.location_id || 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b';
    } catch (error) {
      return 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b';
    }
  };

  // Load data from Supabase
  const loadLaborData = async () => {
    setLoading(true);
    try {
      const locationId = await getCurrentLocationId();
      
      // Try to load employees
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('location_id', locationId);

      if (!empError && employeesData?.length > 0) {
        setEmployees(employeesData);
        setIsConnected(true);
      }

      // Try to load PTO requests
      const { data: ptoData, error: ptoError } = await supabase
        .from('pto_requests')
        .select(`*, employees(name, email)`)
        .eq('location_id', locationId);

      if (!ptoError && ptoData) {
        setPtoRequests(ptoData);
      }

      // Load schedule requests
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule_requests')
        .select(`
          *,
          employees!inner(id, name, role)
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (!scheduleError && scheduleData) {
        setScheduleRequests(scheduleData);
      }

      // Load employee availability
      const { data: availabilityData, error: availError } = await supabase
        .from('employee_availability')
        .select(`
          *,
          employees!inner(id, name, role)
        `)
        .eq('location_id', locationId);

      if (!availError && availabilityData) {
        setEmployeeAvailability(availabilityData);
      }

    } catch (err) {
      console.error('Error loading labor data:', err);
      setError('Using demo data - Supabase connection failed');
    } finally {
      setLoading(false);
    }
  };

  // New scheduling functions
  const submitScheduleRequest = async (requestData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      const { data, error } = await supabase
        .from('schedule_requests')
        .insert([{
          ...requestData,
          location_id: locationId,
          organization_id: requestData.organization_id || crypto.randomUUID(),
          status: 'pending'
        }])
        .select();
      
      if (error) throw error;
      
      // Refresh data
      await loadLaborData();
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, managerNotes = '') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedule_requests')
        .update({
          status,
          manager_notes: managerNotes,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', requestId)
        .select();
      
      if (error) throw error;
      
      // Refresh data
      await loadLaborData();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating request:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const addEmployeeAvailability = async (availabilityData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      const { data, error } = await supabase
        .from('employee_availability')
        .insert([{
          ...availabilityData,
          location_id: locationId
        }])
        .select();
      
      if (error) throw error;
      
      // Refresh data
      await loadLaborData();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding availability:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaborData();
  }, []);

  const getSystemStats = () => ({
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.is_active).length,
    pendingPTO: ptoRequests.filter(req => req.status === 'pending').length,
    approvedPTO: ptoRequests.filter(req => req.status === 'approved').length,
    pendingScheduleRequests: scheduleRequests.filter(req => req.status === 'pending').length,
    totalRoles: currentTemplate?.default_roles?.length || 13
  });

  // Helper functions for scheduling
  const getPendingRequestsCount = () => {
    return scheduleRequests.filter(req => req.status === 'pending').length;
  };

  const getRequestsByStatus = (status) => {
    return scheduleRequests.filter(req => req.status === status);
  };

  const contextValue = {
    // Existing values
    employees,
    ptoRequests,
    currentTemplate,
    loading,
    error,
    isConnected,
    getSystemStats,
    setError,
    
    // New scheduling values
    scheduleRequests,
    employeeAvailability,
    
    // New scheduling functions
    submitScheduleRequest,
    updateRequestStatus,
    addEmployeeAvailability,
    getPendingRequestsCount,
    getRequestsByStatus,
    loadLaborData
  };

  return (
    <LaborDataContext.Provider value={contextValue}>
      {children}
    </LaborDataContext.Provider>
  );
};

