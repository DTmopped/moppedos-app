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

// Enhanced mock data for demo/fallback - 8 employees with complete data
const mockEmployees = [
  { 
    id: '1', 
    name: 'John Smith', 
    email: 'john@moppedrestaurant.com', 
    phone: '555-0101', 
    is_active: true, 
    role: 'Server', 
    department: 'FOH', 
    hourly_rate: 15.00,
    hire_date: '2024-01-15',
    performance_rating: 4.2,
    created_at: '2024-01-15T10:00:00Z'
  },
  { 
    id: '2', 
    name: 'Sarah Johnson', 
    email: 'sarah@moppedrestaurant.com', 
    phone: '555-0102', 
    is_active: true, 
    role: 'Meat Portioner', 
    department: 'BOH', 
    hourly_rate: 18.00,
    hire_date: '2024-01-20',
    performance_rating: 4.5,
    created_at: '2024-01-20T10:00:00Z'
  },
  { 
    id: '3', 
    name: 'Mike Davis', 
    email: 'mike@moppedrestaurant.com', 
    phone: '555-0103', 
    is_active: true, 
    role: 'Dishwasher', 
    department: 'BOH', 
    hourly_rate: 15.50,
    hire_date: '2024-02-01',
    performance_rating: 4.0,
    created_at: '2024-02-01T10:00:00Z'
  },
  { 
    id: '4', 
    name: 'Lisa Wilson', 
    email: 'lisa@moppedrestaurant.com', 
    phone: '555-0104', 
    is_active: true, 
    role: 'Cashier', 
    department: 'FOH', 
    hourly_rate: 16.50,
    hire_date: '2024-02-10',
    performance_rating: 4.3,
    created_at: '2024-02-10T10:00:00Z'
  },
  { 
    id: '5', 
    name: 'Tom Brown', 
    email: 'tom@moppedrestaurant.com', 
    phone: '555-0105', 
    is_active: true, 
    role: 'Bartender', 
    department: 'Bar', 
    hourly_rate: 18.50,
    hire_date: '2024-02-15',
    performance_rating: 4.1,
    created_at: '2024-02-15T10:00:00Z'
  },
  { 
    id: '6', 
    name: 'Emma Garcia', 
    email: 'emma@moppedrestaurant.com', 
    phone: '555-0106', 
    is_active: true, 
    role: 'Manager', 
    department: 'Management', 
    hourly_rate: 28.00,
    hire_date: '2024-01-01',
    performance_rating: 4.7,
    created_at: '2024-01-01T10:00:00Z'
  },
  { 
    id: '7', 
    name: 'David Lee', 
    email: 'david@moppedrestaurant.com', 
    phone: '555-0107', 
    is_active: true, 
    role: 'Side Portioner', 
    department: 'BOH', 
    hourly_rate: 17.00,
    hire_date: '2024-03-01',
    performance_rating: 4.0,
    created_at: '2024-03-01T10:00:00Z'
  },
  { 
    id: '8', 
    name: 'Maria Rodriguez', 
    email: 'maria@moppedrestaurant.com', 
    phone: '555-0108', 
    is_active: true, 
    role: 'Server Assistant', 
    department: 'FOH', 
    hourly_rate: 15.00,
    hire_date: '2024-03-15',
    performance_rating: 4.4,
    created_at: '2024-03-15T10:00:00Z'
  }
];

const mockPTORequests = [
  { 
    id: '1', 
    employee_id: '1', 
    employee_name: 'John Smith', 
    start_date: '2025-10-01', 
    end_date: '2025-10-03', 
    status: 'pending', 
    reason: 'Family vacation',
    created_at: '2025-09-20T10:00:00Z',
    days_requested: 3
  },
  { 
    id: '2', 
    employee_id: '3', 
    employee_name: 'Mike Davis', 
    start_date: '2025-10-15', 
    end_date: '2025-10-15', 
    status: 'approved', 
    reason: 'Doctor appointment',
    created_at: '2025-09-22T14:30:00Z',
    approved_at: '2025-09-23T09:15:00Z',
    days_requested: 1
  },
  { 
    id: '3', 
    employee_id: '5', 
    employee_name: 'Tom Brown', 
    start_date: '2025-11-01', 
    end_date: '2025-11-05', 
    status: 'pending', 
    reason: 'Personal time',
    created_at: '2025-09-25T09:15:00Z',
    days_requested: 5
  }
];

// Mock schedule requests for demo
const mockScheduleRequests = [
  { 
    id: '1', 
    employee_id: '1', 
    employee_name: 'John Smith', 
    request_type: 'time_off', 
    requested_date: '2025-10-05', 
    status: 'pending', 
    reason: 'Personal appointment',
    created_at: '2025-09-28T10:00:00Z'
  },
  { 
    id: '2', 
    employee_id: '2', 
    employee_name: 'Sarah Johnson', 
    request_type: 'shift_preference', 
    requested_date: '2025-10-08', 
    status: 'approved', 
    reason: 'Prefer morning shift',
    created_at: '2025-09-27T14:00:00Z',
    approved_at: '2025-09-28T09:00:00Z'
  },
  { 
    id: '3', 
    employee_id: '4', 
    employee_name: 'Lisa Wilson', 
    request_type: 'shift_swap', 
    requested_date: '2025-10-10', 
    status: 'pending', 
    reason: 'Need to swap with Tom',
    created_at: '2025-09-26T16:30:00Z'
  }
];

// Mock availability data
const mockAvailability = [
  { 
    id: '1', 
    employee_id: '1', 
    employee_name: 'John Smith', 
    day_of_week: 1, 
    available_start: '09:00', 
    available_end: '17:00', 
    preferred_departments: ['FOH'],
    created_at: '2024-01-15T10:00:00Z'
  },
  { 
    id: '2', 
    employee_id: '2', 
    employee_name: 'Sarah Johnson', 
    day_of_week: 2, 
    available_start: '08:00', 
    available_end: '16:00', 
    preferred_departments: ['BOH'],
    created_at: '2024-01-20T10:00:00Z'
  },
  { 
    id: '3', 
    employee_id: '3', 
    employee_name: 'Mike Davis', 
    day_of_week: 3, 
    available_start: '10:00', 
    available_end: '18:00', 
    preferred_departments: ['BOH'],
    created_at: '2024-02-01T10:00:00Z'
  }
];

export const LaborDataProvider = ({ children }) => {
  // Core state
  const [employees, setEmployees] = useState(mockEmployees);
  const [ptoRequests, setPtoRequests] = useState(mockPTORequests);
  const [currentTemplate, setCurrentTemplate] = useState(MOPPED_RESTAURANT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Enhanced scheduling state
  const [scheduleRequests, setScheduleRequests] = useState(mockScheduleRequests);
  const [employeeAvailability, setEmployeeAvailability] = useState(mockAvailability);
  const [schedules, setSchedules] = useState({});
  const [aiForecasts, setAiForecasts] = useState({});
  const [weatherData, setWeatherData] = useState({});
  const [laborAnalytics, setLaborAnalytics] = useState({});

  // Get current user's location
  const getCurrentLocationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Your test location
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('location_id')
        .eq('user_id', user.id)
        .single();
      
      return profile?.location_id || 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b';
    } catch (error) {
      console.warn('Using fallback location ID:', error);
      return 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b';
    }
  };

  // Load data from Supabase with enhanced error handling
  const loadLaborData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationId = await getCurrentLocationId();
      
      // Try to load employees
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('location_id', locationId);

      if (!empError && employeesData?.length > 0) {
        // Enhance employee data with missing fields
        const enhancedEmployees = employeesData.map(emp => ({
          ...emp,
          hire_date: emp.hire_date || '2024-01-01',
          performance_rating: emp.performance_rating || 4.0,
          hourly_rate: emp.hourly_rate || 15.00
        }));
        setEmployees(enhancedEmployees);
        setIsConnected(true);
      } else {
        console.log('Using mock employee data - Supabase data not available');
        setIsConnected(false);
      }

      // Try to load PTO requests
      const { data: ptoData, error: ptoError } = await supabase
        .from('pto_requests')
        .select(`*, employees(name, email)`)
        .eq('location_id', locationId);

      if (!ptoError && ptoData) {
        const enhancedPTO = ptoData.map(pto => ({
          ...pto,
          employee_name: pto.employees?.name || 'Unknown Employee',
          days_requested: pto.days_requested || calculateDays(pto.start_date, pto.end_date)
        }));
        setPtoRequests(enhancedPTO);
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
        const enhancedScheduleData = scheduleData.map(req => ({
          ...req,
          employee_name: req.employees?.name || 'Unknown Employee'
        }));
        setScheduleRequests(enhancedScheduleData);
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
        const enhancedAvailability = availabilityData.map(avail => ({
          ...avail,
          employee_name: avail.employees?.name || 'Unknown Employee'
        }));
        setEmployeeAvailability(enhancedAvailability);
      }

    } catch (err) {
      console.error('Error loading labor data:', err);
      setError('Using demo data - Supabase connection failed');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate days between dates
  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Enhanced Employee Management Functions
  const addEmployee = async (employeeData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      const newEmployee = {
        ...employeeData,
        location_id: locationId,
        is_active: true,
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        hourly_rate: employeeData.hourly_rate || 15,
        performance_rating: employeeData.performance_rating || 4.0,
        created_at: new Date().toISOString()
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('employees')
          .insert([newEmployee])
          .select()
          .single();
        
        if (error) throw error;
        
        setEmployees(prev => [...prev, data]);
        return { success: true, data };
      } else {
        // Fallback to local state
        const localEmployee = {
          ...newEmployee,
          id: Date.now().toString()
        };
        setEmployees(prev => [...prev, localEmployee]);
        return { success: true, data: localEmployee };
      }
      
    } catch (err) {
      console.error('Failed to add employee:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (employeeId, employeeData) => {
    try {
      setLoading(true);
      
      const updatedData = {
        ...employeeData,
        updated_at: new Date().toISOString()
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('employees')
          .update(updatedData)
          .eq('id', employeeId)
          .select()
          .single();
        
        if (error) throw error;
        
        setEmployees(prev => 
          prev.map(emp => emp.id === employeeId ? data : emp)
        );
        return { success: true, data };
      } else {
        // Fallback to local state
        const updatedEmployee = {
          ...employees.find(emp => emp.id === employeeId),
          ...updatedData
        };
        setEmployees(prev => 
          prev.map(emp => emp.id === employeeId ? updatedEmployee : emp)
        );
        return { success: true, data: updatedEmployee };
      }
      
    } catch (err) {
      console.error('Failed to update employee:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      setLoading(true);
      
      if (isConnected) {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);
        
        if (error) throw error;
      }
      
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      return { success: true };
      
    } catch (err) {
      console.error('Failed to delete employee:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced PTO Management Functions
  const addPTORequest = async (ptoData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      const newPTORequest = {
        ...ptoData,
        location_id: locationId,
        status: 'pending',
        days_requested: calculateDays(ptoData.start_date, ptoData.end_date),
        created_at: new Date().toISOString()
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('pto_requests')
          .insert([newPTORequest])
          .select(`*, employees(name, email)`)
          .single();
        
        if (error) throw error;
        
        const enhancedPTO = {
          ...data,
          employee_name: data.employees?.name || 'Unknown Employee'
        };
        
        setPtoRequests(prev => [...prev, enhancedPTO]);
        return { success: true, data: enhancedPTO };
      } else {
        // Fallback to local state
        const employee = employees.find(emp => emp.id === ptoData.employee_id);
        const localPTO = {
          ...newPTORequest,
          id: Date.now().toString(),
          employee_name: employee?.name || 'Unknown Employee'
        };
        setPtoRequests(prev => [...prev, localPTO]);
        return { success: true, data: localPTO };
      }
      
    } catch (err) {
      console.error('Failed to add PTO request:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const approvePTORequest = async (requestId, approvalData = {}) => {
    try {
      setLoading(true);
      
      const updateData = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'current_user_id', // Replace with actual user ID
        manager_notes: approvalData.notes || '',
        ...approvalData
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('pto_requests')
          .update(updateData)
          .eq('id', requestId)
          .select(`*, employees(name, email)`)
          .single();
        
        if (error) throw error;
        
        const enhancedPTO = {
          ...data,
          employee_name: data.employees?.name || 'Unknown Employee'
        };
        
        setPtoRequests(prev => 
          prev.map(req => req.id === requestId ? enhancedPTO : req)
        );
        return { success: true, data: enhancedPTO };
      } else {
        // Fallback to local state
        const approvedRequest = {
          ...ptoRequests.find(req => req.id === requestId),
          ...updateData
        };
        setPtoRequests(prev => 
          prev.map(req => req.id === requestId ? approvedRequest : req)
        );
        return { success: true, data: approvedRequest };
      }
      
    } catch (err) {
      console.error('Failed to approve PTO request:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const denyPTORequest = async (requestId, denialData = {}) => {
    try {
      setLoading(true);
      
      const updateData = {
        status: 'denied',
        denied_at: new Date().toISOString(),
        denied_by: 'current_user_id', // Replace with actual user ID
        denial_reason: denialData.reason || '',
        manager_notes: denialData.notes || '',
        ...denialData
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('pto_requests')
          .update(updateData)
          .eq('id', requestId)
          .select(`*, employees(name, email)`)
          .single();
        
        if (error) throw error;
        
        const enhancedPTO = {
          ...data,
          employee_name: data.employees?.name || 'Unknown Employee'
        };
        
        setPtoRequests(prev => 
          prev.map(req => req.id === requestId ? enhancedPTO : req)
        );
        return { success: true, data: enhancedPTO };
      } else {
        // Fallback to local state
        const deniedRequest = {
          ...ptoRequests.find(req => req.id === requestId),
          ...updateData
        };
        setPtoRequests(prev => 
          prev.map(req => req.id === requestId ? deniedRequest : req)
        );
        return { success: true, data: deniedRequest };
      }
      
    } catch (err) {
      console.error('Failed to deny PTO request:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Schedule Management Functions
  const getWeekSchedule = async (weekDate) => {
    try {
      if (isConnected) {
        const { data, error } = await supabase
          .from('schedules')
          .select(`
            *,
            employees(id, name, role)
          `)
          .gte('date', weekDate)
          .lt('date', new Date(new Date(weekDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        if (error) throw error;
        
        const weekSchedule = {
          week: weekDate,
          entries: data || [],
          totalHours: data?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0,
          totalCost: data?.reduce((sum, entry) => sum + (entry.cost || 0), 0) || 0
        };
        
        setSchedules(prev => ({
          ...prev,
          [weekDate]: weekSchedule
        }));
        
        return weekSchedule;
      } else {
        // Mock schedule data
        const weekSchedule = {
          week: weekDate,
          entries: [],
          totalHours: 0,
          totalCost: 0
        };
        
        setSchedules(prev => ({
          ...prev,
          [weekDate]: weekSchedule
        }));
        
        return weekSchedule;
      }
      
    } catch (err) {
      console.error('Failed to get week schedule:', err);
      throw err;
    }
  };

  const addScheduleEntry = async (scheduleData) => {
    try {
      const locationId = await getCurrentLocationId();
      
      const newEntry = {
        ...scheduleData,
        location_id: locationId,
        created_at: new Date().toISOString()
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('schedules')
          .insert([newEntry])
          .select(`
            *,
            employees(id, name, role)
          `)
          .single();
        
        if (error) throw error;
        
        // Update local schedule state
        const weekDate = scheduleData.date;
        setSchedules(prev => ({
          ...prev,
          [weekDate]: {
            ...prev[weekDate],
            entries: [...(prev[weekDate]?.entries || []), data]
          }
        }));
        
        return { success: true, data };
      } else {
        // Fallback to local state
        const localEntry = {
          ...newEntry,
          id: Date.now().toString()
        };
        
        const weekDate = scheduleData.date;
        setSchedules(prev => ({
          ...prev,
          [weekDate]: {
            ...prev[weekDate],
            entries: [...(prev[weekDate]?.entries || []), localEntry]
          }
        }));
        
        return { success: true, data: localEntry };
      }
      
    } catch (err) {
      console.error('Failed to add schedule entry:', err);
      return { success: false, error: err.message };
    }
  };

   // Save schedule function for WeeklyCalendarGrid
  const saveSchedule = async (weekKey, scheduleData) => {
    try {
      console.log('Saving schedule for week:', weekKey, scheduleData);
      // Store in local state for now
      setSchedules(prev => ({
        ...prev,
        [weekKey]: scheduleData
      }));
      return { success: true };
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  };

  // AI and Analytics Functions (Mock implementations)
  const getAIForecast = async (date, parameters = {}) => {
    try {
      // Mock AI forecast data - replace with actual API call when available
      const forecast = {
        date,
        guestCount: 187 + Math.floor(Math.random() * 40) - 20, // 167-207 range
        laborHours: 142 + Math.floor(Math.random() * 20) - 10, // 132-152 range
        laborCost: 2556 + Math.floor(Math.random() * 400) - 200, // 2356-2756 range
        efficiency: 94 + Math.floor(Math.random() * 10) - 5, // 89-99 range
        confidence: 89 + Math.floor(Math.random() * 8), // 89-97 range
        recommendations: [
          {
            id: '1',
            type: 'staffing',
            priority: 'high',
            title: 'Optimize Kitchen Swing Shifts',
            description: 'Reduce kitchen swing staff by 1 position during 2-4 PM low period',
            impact: 'Save $45/day',
            confidence: 87
          },
          {
            id: '2',
            type: 'scheduling',
            priority: 'medium',
            title: 'Adjust FOH Coverage',
            description: 'Add 1 server during 6-8 PM peak period',
            impact: 'Improve service quality',
            confidence: 92
          }
        ],
        trends: {
          guestCountTrend: 12,
          laborHoursTrend: -5,
          laborCostTrend: -8,
          efficiencyTrend: 3
        }
      };
      
      setAiForecasts(prev => ({
        ...prev,
        [date]: forecast
      }));
      
      return forecast;
      
    } catch (err) {
      console.error('Failed to get AI forecast:', err);
      throw err;
    }
  };

  const getWeatherImpact = async (date, location = 'default') => {
    try {
      // Mock weather data - replace with actual API call when available
      const weatherConditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy'];
      const baseTemp = 70;
      
      const forecast = Array.from({ length: 7 }, (_, i) => {
        const forecastDate = new Date(date);
        forecastDate.setDate(forecastDate.getDate() + i);
        const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        const temp = baseTemp + Math.floor(Math.random() * 20) - 10;
        
        let guestImpact = 170;
        if (condition === 'sunny') guestImpact += 15;
        if (condition === 'rainy') guestImpact -= 75;
        if (condition === 'cloudy') guestImpact -= 10;
        
        return {
          date: forecastDate.toISOString().split('T')[0],
          condition,
          temp,
          guestImpact: Math.max(guestImpact, 80) // Minimum 80 guests
        };
      });
      
      const weatherData = {
        date,
        location,
        forecast,
        recommendation: forecast.some(f => f.condition === 'rainy') 
          ? "Rainy weather expected this week. Consider reducing FOH staff by 2-3 positions on rainy days."
          : "Good weather conditions expected. Maintain normal staffing levels."
      };
      
      setWeatherData(prev => ({
        ...prev,
        [date]: weatherData
      }));
      
      return weatherData;
      
    } catch (err) {
      console.error('Failed to get weather impact:', err);
      throw err;
    }
  };

  const getLaborAnalytics = async (startDate, endDate) => {
    try {
      // Mock analytics data - replace with actual calculations when available
      const analytics = {
        period: { startDate, endDate },
        totalCost: 31185 + Math.floor(Math.random() * 2000) - 1000,
        totalHours: 1733 + Math.floor(Math.random() * 100) - 50,
        averageWeeklyCost: 6237 + Math.floor(Math.random() * 400) - 200,
        efficiency: 94 + Math.floor(Math.random() * 8) - 4,
        trends: {
          costTrend: Math.floor(Math.random() * 20) - 10,
          hoursTrend: Math.floor(Math.random() * 16) - 8,
          efficiencyTrend: Math.floor(Math.random() * 10) - 5
        },
        departmentBreakdown: {
          'FOH': { 
            cost: 12474 + Math.floor(Math.random() * 1000) - 500, 
            hours: 693 + Math.floor(Math.random() * 50) - 25, 
            efficiency: 92 + Math.floor(Math.random() * 6) - 3 
          },
          'BOH': { 
            cost: 15592 + Math.floor(Math.random() * 1200) - 600, 
            hours: 866 + Math.floor(Math.random() * 60) - 30, 
            efficiency: 96 + Math.floor(Math.random() * 4) - 2 
          },
          'Bar': { 
            cost: 2080 + Math.floor(Math.random() * 200) - 100, 
            hours: 104 + Math.floor(Math.random() * 10) - 5, 
            efficiency: 90 + Math.floor(Math.random() * 8) - 4 
          },
          'Management': { 
            cost: 1039 + Math.floor(Math.random() * 100) - 50, 
            hours: 70 + Math.floor(Math.random() * 8) - 4, 
            efficiency: 98 + Math.floor(Math.random() * 3) - 1 
          }
        }
      };
      
      setLaborAnalytics(prev => ({
        ...prev,
        [`${startDate}-${endDate}`]: analytics
      }));
      
      return analytics;
      
    } catch (err) {
      console.error('Failed to get labor analytics:', err);
      throw err;
    }
  };

  // Existing scheduling functions (preserved from your original code)
  const submitScheduleRequest = async (requestData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      if (isConnected) {
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
      } else {
        // Fallback to local state
        const newRequest = {
          ...requestData,
          id: Date.now().toString(),
          location_id: locationId,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        setScheduleRequests(prev => [...prev, newRequest]);
        return { success: true, data: newRequest };
      }
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
      
      const updateData = {
        status,
        manager_notes: managerNotes,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('schedule_requests')
          .update(updateData)
          .eq('id', requestId)
          .select();
        
        if (error) throw error;
        
        // Refresh data
        await loadLaborData();
        return { success: true, data };
      } else {
        // Fallback to local state
        const updatedRequest = {
          ...scheduleRequests.find(req => req.id === requestId),
          ...updateData
        };
        setScheduleRequests(prev => 
          prev.map(req => req.id === requestId ? updatedRequest : req)
        );
        return { success: true, data: updatedRequest };
      }
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
      
      const newAvailability = {
        ...availabilityData,
        location_id: locationId,
        created_at: new Date().toISOString()
      };

      if (isConnected) {
        const { data, error } = await supabase
          .from('employee_availability')
          .insert([newAvailability])
          .select();
        
        if (error) throw error;
        
        // Refresh data
        await loadLaborData();
        return { success: true, data };
      } else {
        // Fallback to local state
        const localAvailability = {
          ...newAvailability,
          id: Date.now().toString()
        };
        setEmployeeAvailability(prev => [...prev, localAvailability]);
        return { success: true, data: localAvailability };
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Utility Functions
  const getEmployeeById = (employeeId) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const getEmployeesByDepartment = (department) => {
    return employees.filter(emp => emp.department === department);
  };

  const getPendingPTORequests = () => {
    return ptoRequests.filter(req => req.status === 'pending');
  };

  const getApprovedPTORequests = () => {
    return ptoRequests.filter(req => req.status === 'approved');
  };

  const getPendingRequestsCount = () => {
    return scheduleRequests.filter(req => req.status === 'pending').length;
  };

  const getRequestsByStatus = (status) => {
    return scheduleRequests.filter(req => req.status === status);
  };

  const getSystemStats = () => ({
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.is_active).length,
    pendingPTO: ptoRequests.filter(req => req.status === 'pending').length,
    approvedPTO: ptoRequests.filter(req => req.status === 'approved').length,
    pendingScheduleRequests: scheduleRequests.filter(req => req.status === 'pending').length,
    totalRoles: currentTemplate?.default_roles?.length || 13,
    averageHourlyRate: employees.reduce((sum, emp) => sum + (emp.hourly_rate || 0), 0) / employees.length,
    averagePerformance: employees.reduce((sum, emp) => sum + (emp.performance_rating || 0), 0) / employees.length,
    retentionRate: 92 // Mock retention rate - calculate from actual data when available
  });

  // Refresh all data
  const refreshData = async () => {
    await loadLaborData();
  };

  // Initialize data on mount
  useEffect(() => {
    loadLaborData();
  }, []);

  // Enhanced context value with all functions
  const contextValue = {
    // Core state
    employees,
    ptoRequests,
    currentTemplate,
    loading,
    error,
    isConnected,
    
    // Enhanced state
    schedules,
    aiForecasts,
    weatherData,
    laborAnalytics,
    scheduleRequests,
    employeeAvailability,
    
    // Employee functions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getEmployeesByDepartment,
    
    // PTO functions
    addPTORequest,
    approvePTORequest,
    denyPTORequest,
    getPendingPTORequests,
    getApprovedPTORequests,
    
    // Schedule functions
    getWeekSchedule,
    addScheduleEntry,
    submitScheduleRequest,
    updateRequestStatus,
    addEmployeeAvailability,
    
    // AI and Analytics functions
    getAIForecast,
    getWeatherImpact,
    getLaborAnalytics,

    // Schedule functions
    saveSchedule,
    
    // Utility functions
    getSystemStats,
    getPendingRequestsCount,
    getRequestsByStatus,
    refreshData,
    loadLaborData,
    setError,
    setCurrentTemplate
  };

  return (
    <LaborDataContext.Provider value={contextValue}>
      {children}
    </LaborDataContext.Provider>
  );
};
