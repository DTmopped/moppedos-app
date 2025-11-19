import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  MOPPED_RESTAURANT_TEMPLATE, 
  DEPARTMENT_MAPPING, 
  REVERSE_DEPARTMENT_MAPPING,
  formatTimeToStandard, 
  formatTimeToMilitary 
} from '@/config/laborScheduleConfig';

const LaborDataContext = createContext();

export const useLaborData = () => {
  const context = useContext(LaborDataContext);
  if (!context) {
    throw new Error('useLaborData must be used within a LaborDataProvider');
  }
  return context;
};

// Helper function to convert military time to standard 12-hour format
const convertTimeToStandard = (militaryTime) => {
  if (!militaryTime) return '';
  
  const [hours, minutes] = militaryTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${standardHour}:${minutes} ${ampm}`;
};

// Helper function to convert standard time to military format for database storage
const convertTimeToMilitary = (standardTime) => {
  if (!standardTime) return '';
  
  const [time, period] = standardTime.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

// Helper function to get date weeks ago
const getDateWeeksAgo = (date, weeks) => {
  const targetDate = new Date(date);
  targetDate.setDate(targetDate.getDate() - (weeks * 7));
  return targetDate.toISOString().split('T')[0];
};

// Comprehensive holiday detection system
const getHolidayMultiplier = (date) => {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  
  // Fixed date holidays
  const fixedHolidays = {
    [`${year}-01-01`]: 0.3, // New Year's Day
    [`${year}-12-31`]: 1.8, // New Year's Eve
    [`${year}-02-14`]: 2.2, // Valentine's Day
    [`${year}-02-13`]: 1.4, // Day before Valentine's
    [`${year}-03-17`]: 1.6, // St. Patrick's Day
    [`${year}-07-04`]: 1.3, // July 4th
    [`${year}-07-03`]: 1.2, // Day before July 4th
    [`${year}-10-31`]: 1.4, // Halloween
    [`${year}-12-24`]: 0.6, // Christmas Eve
    [`${year}-12-25`]: 0.2, // Christmas Day
  };

  const dateString = targetDate.toISOString().split('T')[0];
  return fixedHolidays[dateString] || 1.0;
};

export const LaborDataProvider = ({ children }) => {
  // Core state
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [ptoRequests, setPtoRequests] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [employeeAvailability, setEmployeeAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Location state - NOW USING UUID SYSTEM
  const [locationId, setLocationId] = useState(null); // This will be the bigint ID
  const [locationUuid, setLocationUuid] = useState(null); // This will be the UUID for database queries
  const [locationName, setLocationName] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      setLoadingLocation(true);
      setLocationError(null);
      
      try {
        // First, get the current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting user session:", sessionError);
          setLocationError("Failed to get user session");
          setLoadingLocation(false);
          return;
        }

        if (session?.user) {
          console.log("🔍 Fetching location data for user:", session.user.id);
          
          // Step 1: Get user's location_id from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('location_id')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("❌ Error fetching user profile:", profileError);
            setLocationError("Failed to fetch user profile");
            setLoadingLocation(false);
            return;
          }

          if (!profile?.location_id) {
            console.error("❌ No location_id found in user profile");
            setLocationError("No location assigned to user");
            setLoadingLocation(false);
            return;
          }

          console.log("✅ Found location_id in profile:", profile.location_id);

          // Step 2: Get location details from locations table
          const { data: location, error: locationError } = await supabase
            .from('locations')
            .select('id, uuid, name, timezone, organization_id')
            .eq('id', profile.location_id)
            .single();

          if (locationError) {
            console.error("❌ Error fetching location details:", locationError);
            setLocationError("Failed to fetch location details");
            setLoadingLocation(false);
            return;
          }

          console.log("✅ Location details fetched:", location);

          // Set all location state - CRITICAL: Use UUID for database queries
          setLocationId(location.id); // Keep the bigint ID for reference
          setLocationUuid(location.uuid); // Use UUID for all database queries
          setLocationName(location.name);
          setLocationError(null);
          
          console.log("🎯 Location state updated:", {
            id: location.id,
            uuid: location.uuid,
            name: location.name
          });

        } else {
          console.log("❌ No user session found");
          setLocationError("User not authenticated");
        }
      } catch (err) {
        console.error("❌ Unexpected error in fetchUserLocation:", err);
        setLocationError("Unexpected error occurred");
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchUserLocation();
  }, []);

  // Helper function to get current location UUID (NOT integer ID)
  const getCurrentLocationUuid = async () => {
    if (locationUuid) return locationUuid;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('User not authenticated');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('location_id')
      .eq('id', session.user.id)
      .single();
    
    if (!profile?.location_id) throw new Error('No location assigned to user');
    
    // Get the UUID from locations table
    const { data: location } = await supabase
      .from('locations')
      .select('uuid')
      .eq('id', profile.location_id)
      .single();
    
    return location?.uuid;
  };

  // Load all labor data - UPDATED TO USE UUID
  const loadLaborData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationUuid = await getCurrentLocationUuid();
      console.log('Loading labor data for location UUID:', locationUuid);

      // Load employees with enhanced data - USE UUID
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('location_id', locationUuid) // Use UUID here
        .eq('is_active', true);

      if (empError) {
        console.error('Error loading employees:', empError);
        setError('Failed to load employees from database');
        setIsConnected(false);
      } else {
        // Enhance employee data with missing fields and standardize departments
        const enhancedEmployees = (employeesData || []).map(emp => ({
          ...emp,
          hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
          performance_rating: emp.performance_rating || 4.0,
          hourly_rate: emp.hourly_rate || 15.00,
          status: emp.is_active ? 'active' : 'inactive',
          // Standardize department names using existing department or mapping
          department: DEPARTMENT_MAPPING[emp.department] || emp.department || 'Front of House'
        }));
        
        setEmployees(enhancedEmployees);
        setIsConnected(true);
        console.log('Loaded employees:', enhancedEmployees.length);
      }

      // Load PTO requests - USE UUID
      const { data: ptoData, error: ptoError } = await supabase
        .from('pto_requests')
        .select(`
          *,
          employees!inner(id, name, email, role)
        `)
        .eq('location_id', locationUuid) // Use UUID here
        .order('created_at', { ascending: false });

      if (!ptoError && ptoData) {
        const enhancedPTO = ptoData.map(pto => ({
          ...pto,
          employee_name: pto.employees?.name || 'Unknown Employee',
          employee_role: pto.employees?.role || 'Employee',
          days_requested: pto.days_requested || calculateDays(pto.start_date, pto.end_date)
        }));
        setPtoRequests(enhancedPTO);
        console.log('Loaded PTO requests:', enhancedPTO.length);
      }

      // Load schedule requests - USE UUID
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule_requests')
        .select(`
          *,
          employees!inner(id, name, role)
        `)
        .eq('location_id', locationUuid) // Use UUID here
        .order('created_at', { ascending: false });

      if (!scheduleError && scheduleData) {
        const enhancedScheduleData = scheduleData.map(req => ({
          ...req,
          employee_name: req.employees?.name || 'Unknown Employee'
        }));
        setScheduleRequests(enhancedScheduleData);
        console.log('Loaded schedule requests:', enhancedScheduleData.length);
      }

      // Load employee availability - USE UUID
      const { data: availabilityData, error: availError } = await supabase
        .from('employee_availability')
        .select(`
          *,
          employees!inner(id, name)
        `)
        .eq('location_id', locationUuid); // Use UUID here

      if (!availError && availabilityData) {
        const enhancedAvailability = availabilityData.map(avail => ({
          ...avail,
          employee_name: avail.employees?.name || 'Unknown Employee'
        }));
        setEmployeeAvailability(enhancedAvailability);
        console.log('Loaded employee availability:', enhancedAvailability.length);
      }

      setIsConnected(true);
    } catch (err) {
      console.error('Error loading labor data:', err);
      setError(err.message);
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

  // Load data on mount and when location changes
  useEffect(() => {
    if (locationUuid) {
      loadLaborData();
    }
  }, [locationUuid]);

  // Helper function to calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    // Convert to military time if needed
    const start = startTime.includes('AM') || startTime.includes('PM') 
      ? convertTimeToMilitary(startTime) 
      : startTime;
    const end = endTime.includes('AM') || endTime.includes('PM') 
      ? convertTimeToMilitary(endTime) 
      : endTime;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + (minutes / 60);
  };

  // Smart Forecasting Functions
  const getSmartForecast = async (date, mealPeriod) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      // Get historical sales data for the same day of week
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get last 4 weeks of data for this day
      const historicalData = [];
      for (let i = 1; i <= 4; i++) {
        const historicalDate = getDateWeeksAgo(date, i);
        
        const { data, error } = await supabase
          .from('sales_data')
          .select('total_sales, customer_count')
          .eq('location_id', locationUuid)
          .eq('date', historicalDate)
          .eq('meal_period', mealPeriod)
          .single();
        
        if (!error && data) {
          historicalData.push(data);
        }
      }
      
      if (historicalData.length === 0) {
        return {
          predictedSales: 0,
          predictedCustomers: 0,
          confidence: 'low',
          reasoning: 'No historical data available'
        };
      }
      
      // Calculate average
      const avgSales = historicalData.reduce((sum, d) => sum + d.total_sales, 0) / historicalData.length;
      const avgCustomers = historicalData.reduce((sum, d) => sum + d.customer_count, 0) / historicalData.length;
      
      // Apply holiday multiplier
      const holidayMultiplier = getHolidayMultiplier(date);
      
      return {
        predictedSales: Math.round(avgSales * holidayMultiplier),
        predictedCustomers: Math.round(avgCustomers * holidayMultiplier),
        confidence: historicalData.length >= 3 ? 'high' : 'medium',
        reasoning: `Based on ${historicalData.length} weeks of historical data${holidayMultiplier !== 1.0 ? ' with holiday adjustment' : ''}`
      };
      
    } catch (err) {
      console.error('Error getting smart forecast:', err);
      return {
        predictedSales: 0,
        predictedCustomers: 0,
        confidence: 'low',
        reasoning: 'Error calculating forecast'
      };
    }
  };

  const getWeatherImpact = async (date) => {
    // Placeholder for weather API integration
    return {
      condition: 'clear',
      impact: 1.0,
      reasoning: 'Weather data not available'
    };
  };

  const getLaborAnalytics = async (weekKey) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const { data, error } = await supabase
        .from('schedules')
        .select('schedule_data')
        .eq('week_start_date', weekKey)
        .eq('location_id', locationUuid)
        .single();
      
      if (error || !data) {
        return {
          totalHours: 0,
          totalCost: 0,
          laborPercentage: 0,
          efficiency: 0
        };
      }
      
      // Calculate total hours from schedule_data
      let totalHours = 0;
      const scheduleData = data.schedule_data;
      
      Object.values(scheduleData).forEach(slot => {
        if (slot.employees) {
          slot.employees.forEach(emp => {
            totalHours += calculateShiftHours(emp.start, emp.end);
          });
        }
      });
      
      // Estimate cost (would need actual wage data)
      const avgWage = 15; // placeholder
      const totalCost = totalHours * avgWage;
      
      return {
        totalHours: Math.round(totalHours * 10) / 10,
        totalCost: Math.round(totalCost),
        laborPercentage: 0, // Would need sales data
        efficiency: 85 // placeholder
      };
      
    } catch (err) {
      console.error('Error getting labor analytics:', err);
      return {
        totalHours: 0,
        totalCost: 0,
        laborPercentage: 0,
        efficiency: 0
      };
    }
  };

  // Employee Management Functions - UPDATED TO USE UUID
  const addEmployee = async (employeeData) => {
    try {
      setLoading(true);
      const locationUuid = await getCurrentLocationUuid();
      
      const newEmployee = {
        ...employeeData,
        location_id: locationUuid, // Use UUID
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select()
        .single();

      if (error) throw error;

      const enhancedEmployee = {
        ...data,
        hire_date: data.hire_date || new Date().toISOString().split('T')[0],
        performance_rating: data.performance_rating || 4.0,
        hourly_rate: data.hourly_rate || 15.00,
        status: 'active',
        department: DEPARTMENT_MAPPING[data.department] || data.department || 'Front of House'
      };

      setEmployees(prev => [...prev, enhancedEmployee]);
      return { success: true, data: enhancedEmployee };

    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced PTO Management Functions - UPDATED TO USE UUID
  const addPTORequest = async (ptoData) => {
    try {
      setLoading(true);
      const locationUuid = await getCurrentLocationUuid();
      
      const newPTO = {
        ...ptoData,
        location_id: locationUuid, // Use UUID
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('pto_requests')
        .insert([newPTO])
        .select(`*, employees(name, email)`)
        .single();

      if (error) throw error;

      const enhancedPTO = {
        ...data,
        employee_name: data.employees?.name || 'Unknown Employee'
      };

      setPtoRequests(prev => [enhancedPTO, ...prev]);
      return { success: true, data: enhancedPTO };

    } catch (err) {
      console.error('Error adding PTO request:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePTOStatus = async (ptoId, status, notes = '') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pto_requests')
        .update({ 
          status, 
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ptoId)
        .select(`*, employees(name, email)`)
        .single();

      if (error) throw error;

      const enhancedPTO = {
        ...data,
        employee_name: data.employees?.name || 'Unknown Employee'
      };

      setPtoRequests(prev => 
        prev.map(pto => pto.id === ptoId ? enhancedPTO : pto)
      );

      return { success: true, data: enhancedPTO };

    } catch (err) {
      console.error('Error updating PTO status:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Approve PTO request using Supabase RPC function
  const approvePTORequest = async (requestId, options = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('approve_pto_request_self', {
          p_request_id: requestId,
          p_notes: options.notes || null
        });
      
      if (error) throw error;
      
      // Refresh PTO requests to get updated data
      await loadLaborData();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error approving PTO request:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Deny PTO request using Supabase RPC function
  const denyPTORequest = async (requestId, options = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('deny_pto_request_self', {
          p_request_id: requestId,
          p_denial_reason: options.reason || 'Denied by manager'
        });
      
      if (error) throw error;
      
      // Refresh PTO requests to get updated data
      await loadLaborData();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error denying PTO request:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Schedule Management Functions - UPDATED TO USE ACTUAL TABLE AND UUID
  const saveSchedule = async (weekKey, scheduleData) => {
    try {
      setLoading(true);
      const locationUuid = await getCurrentLocationUuid();
      
            // Convert any standard time formats to military time for database storage
      const processedScheduleData = JSON.parse(JSON.stringify(scheduleData));
      
      // ✅ NEW: Process each schedule entry (now using single employee per cell)
      Object.keys(processedScheduleData).forEach(key => {
        const slot = processedScheduleData[key];
        // ✅ NEW: Check for .employee (singular) instead of .employees (array)
        if (slot.employee) {
          slot.employee = {
            ...slot.employee,
            start: slot.employee.start && (slot.employee.start.includes('AM') || slot.employee.start.includes('PM')) ? 
              convertTimeToMilitary(slot.employee.start) : slot.employee.start,
            end: slot.employee.end && (slot.employee.end.includes('AM') || slot.employee.end.includes('PM')) ? 
              convertTimeToMilitary(slot.employee.end) : slot.employee.end
          };
        }
      });

      
      const scheduleEntry = {
        week_start_date: weekKey, // Use actual column name
        schedule_data: processedScheduleData,
        location_id: locationUuid, // Use UUID
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('schedules') // Use actual table name
        .upsert(scheduleEntry, { onConflict: ['week_start_date', 'location_id'] })
        .select()
        .single();
      
      if (error) throw error;
      
      setSchedules(prev => ({
        ...prev,
        [weekKey]: processedScheduleData
      }));

      return { success: true, data };

    } catch (err) {
      console.error('Error saving schedule:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch Week Schedule Function - Fetches shifts from database
  const fetchWeekSchedule = async (weekStartDate) => {
    if (!locationUuid) {
      console.warn('⚠️ fetchWeekSchedule: No location UUID available yet');
      return [];
    }

    try {
      // Calculate week end date (6 days after start)
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekEndDate = weekEnd.toISOString().split('T')[0];
      const weekStartFormatted = new Date(weekStartDate).toISOString().split('T')[0];

      console.log('📅 Fetching shifts from database:', {
        weekStart: weekStartFormatted,
        weekEnd: weekEndDate,
        locationUuid
      });

      // Fetch shifts from database with employee details
      const { data: shiftsData, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employees (
            id,
            name,
            role,
            department,
            hourly_rate
          )
        `)
        .gte('day', weekStartFormatted)
        .lte('day', weekEndDate)
        .eq('location_id', locationUuid)
        .not('employee_id', 'is', null)  // ← ADD THIS NEW LINE
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching week schedule from database:', error);
        throw error;
      }

      console.log(`📊 Raw shifts from database: ${shiftsData?.length || 0} shifts`);

      // Format and normalize shifts
      const formattedShifts = (shiftsData || []).map(shift => {
        // Normalize shift_type to uppercase to match config
        let normalizedShiftType = (shift.shift_type || '').toUpperCase();
        
        // Map 'SCHEDULED' shifts to appropriate time slot based on start_time
        if (normalizedShiftType === 'SCHEDULED') {
          const hour = parseInt(shift.start_time?.split(':')[0] || '0');
          if (hour < 11) {
            normalizedShiftType = 'AM';
            console.log(`🔄 Mapped SCHEDULED shift to AM (${shift.start_time})`);
          } else if (hour < 15) {
            normalizedShiftType = 'MID';
            console.log(`🔄 Mapped SCHEDULED shift to MID (${shift.start_time})`);
          } else {
            normalizedShiftType = 'PM';
            console.log(`🔄 Mapped SCHEDULED shift to PM (${shift.start_time})`);
          }
        }

        // Calculate shift hours
        const shiftHours = calculateShiftHours(shift.start_time, shift.end_time);

        // Format employee name
        const employeeName = shift.employees?.name || 'Unknown Employee';

        // Convert times to standard format for display
        const startTimeStandard = convertTimeToStandard(shift.start_time);
        const endTimeStandard = convertTimeToStandard(shift.end_time);

        return {
          ...shift,
          shift_type: normalizedShiftType, // Normalized to uppercase (AM/MID/PM)
          employee_name: employeeName,
          employee_role: shift.employees?.role || shift.role,
          employee_department: shift.employees?.department,
          hourly_rate: shift.employees?.hourly_rate || 15.00,
          shift_hours: shiftHours,
          start_time_display: startTimeStandard,
          end_time_display: endTimeStandard,
          estimated_cost: shiftHours * (shift.employees?.hourly_rate || 15.00)
        };
      });

      // Log shift type distribution for debugging
      const shiftTypes = [...new Set(formattedShifts.map(s => s.shift_type))];
      const typeCounts = {};
      shiftTypes.forEach(type => {
        typeCounts[type] = formattedShifts.filter(s => s.shift_type === type).length;
      });

      console.log('✅ Shifts formatted successfully:', {
        total: formattedShifts.length,
        shiftTypes: shiftTypes,
        distribution: typeCounts
      });

      return formattedShifts;

    } catch (error) {
      console.error('❌ Failed to fetch week schedule:', error);
      return [];
    }
  };

   // NEW: LABOR ANALYTICS & SCHEDULE GENERATION FUNCTIONS

  // ============================================================================

  /**
   * Fetch weekly labor summary from v_weekly_labor_summary view
   * This provides real-time labor cost, hours, and percentage data
   */
  /*
const fetchWeeklyLaborSummary = async (weekStartDate) => {
  try {
    const locationUuid = await getCurrentLocationUuid();
    
    console.log('Fetching labor summary for:', { locationUuid, weekStartDate });
    
    const { data, error } = await supabase
      .from('v_weekly_labor_summary')
      .select('*')
      .eq('location_id', locationUuid)
      .eq('week_start_date', weekStartDate)
      .single();
    
    if (error) {
      console.error('Error fetching labor summary:', error);
      return null;
    }
    
    console.log('Labor summary fetched:', data);
    return data;
    
  } catch (err) {
    console.error('Error in fetchWeeklyLaborSummary:', err);
    return null;
  }
};
*/


  /**
   * Fetch labor analytics history from labor_analytics table
   * This provides historical trends for comparison
   */
  /*
const fetchLaborAnalytics = async (limit = 12) => {
  try {
    const locationUuid = await getCurrentLocationUuid();
    
    const { data, error } = await supabase
      .from('labor_analytics')
      .select('*')
      .eq('location_id', locationUuid)
      .order('week_start_date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching labor analytics:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} weeks of labor analytics`);
    return data || [];
    
  } catch (err) {
    console.error('Error in fetchLaborAnalytics:', err);
    return [];
  }
};
*/


  /**
   * Fetch shifts for a specific week with employee details
   * This provides the individual shift data for the schedule grid
   */
  const fetchWeeklyShifts = async (weekStartDate, weekEndDate) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employees (
            id,
            name,
            role,
            department,
            hourly_rate
          )
        `)
        .eq('location_id', locationUuid)
        .not('employee_id', 'is', null)  // ✅ ADD THIS LINE - Filter out unassigned shifts
        .gte('day', weekStartDate)
        .lte('day', weekEndDate)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} shifts for week`);
      return data || [];
      
    } catch (err) {
      console.error('Error in fetchWeeklyShifts:', err);
      return [];
    }
  };

  /**
   * Generate schedule for a specific week using the backend generator
   * Calls regenerate_weekly_schedule() function
   */
  const generateWeeklySchedule = async (weekStartDate) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      console.log('Generating schedule for:', { locationUuid, weekStartDate });
      
      // Call the regenerate_weekly_schedule function
      const { data, error } = await supabase.rpc(
        'regenerate_weekly_schedule',
        {
          p_location_id: locationUuid,
          p_week_start_date: weekStartDate
        }
      );
      
      if (error) {
        console.error('Error generating schedule:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Schedule generated successfully:', data);
      
      // Snapshot the labor analytics
      await snapshotWeeklyLabor(weekStartDate);
      
      return { success: true, data };
      
    } catch (err) {
      console.error('Error in generateWeeklySchedule:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Snapshot weekly labor data into labor_analytics table
   * This captures the current week's metrics for historical tracking
   */
  const snapshotWeeklyLabor = async (weekStartDate) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const { data, error } = await supabase.rpc(
        'snapshot_weekly_labor',
        {
          p_location_id: locationUuid,
          p_week_start_date: weekStartDate
        }
      );
      
      if (error) {
        console.error('Error snapshotting labor:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Labor snapshot created:', data);
      return { success: true, data };
      
    } catch (err) {
      console.error('Error in snapshotWeeklyLabor:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Calculate labor metrics for the current schedule state
   * This provides real-time calculations from the shifts data
   */
  const calculateLaborMetrics = (shifts, weeklyRevenue = 76923) => {
    if (!shifts || shifts.length === 0) {
      return {
        totalShifts: 0,
        totalHours: 0,
        totalCost: 0,
        totalCostWithBurden: 0,
        laborPercent: 0,
        laborPercentWithBurden: 0,
        departments: {
          foh: { shifts: 0, hours: 0, cost: 0, costWithBurden: 0 },
          boh: { shifts: 0, hours: 0, cost: 0, costWithBurden: 0 },
          bar: { shifts: 0, hours: 0, cost: 0, costWithBurden: 0 },
          management: { shifts: 0, hours: 0, cost: 0, costWithBurden: 0 }
        }
      };
    }
    
    const burden = 1.20; // 20% burden
    const departments = {
      foh: { shifts: 0, hours: 0, cost: 0 },
      boh: { shifts: 0, hours: 0, cost: 0 },
      bar: { shifts: 0, hours: 0, cost: 0 },
      management: { shifts: 0, hours: 0, cost: 0 }
    };
    
    let totalShifts = 0;
    let totalHours = 0;
    let totalCost = 0;
    
    shifts.forEach(shift => {
      const hours = shift.hours || 0;
      const rate = shift.hourly_rate || shift.employees?.hourly_rate || 15;
      const cost = hours * rate;
      const dept = (shift.department || 'foh').toLowerCase().replace(/\s+/g, '_');
      
      totalShifts++;
      totalHours += hours;
      totalCost += cost;
      
      // Map department names
      let deptKey = 'foh';
      if (dept.includes('boh') || dept.includes('back')) deptKey = 'boh';
      else if (dept.includes('bar')) deptKey = 'bar';
      else if (dept.includes('mgmt') || dept.includes('management')) deptKey = 'management';
      
      departments[deptKey].shifts++;
      departments[deptKey].hours += hours;
      departments[deptKey].cost += cost;
    });
    
    // Apply burden to all departments
    Object.keys(departments).forEach(dept => {
      departments[dept].costWithBurden = departments[dept].cost * burden;
    });
    
    const totalCostWithBurden = totalCost * burden;
    const laborPercent = (totalCost / weeklyRevenue) * 100;
    const laborPercentWithBurden = (totalCostWithBurden / weeklyRevenue) * 100;
    
    return {
      totalShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCost: Math.round(totalCost),
      totalCostWithBurden: Math.round(totalCostWithBurden),
      laborPercent: Math.round(laborPercent * 10) / 10,
      laborPercentWithBurden: Math.round(laborPercentWithBurden * 10) / 10,
      departments
    };
  };

  /**
   * Get weekly labor data (summary + shifts + metrics)
   * This is the main function to call from components
   */
  const getWeeklyLaborData = async (weekStartDate) => {
    try {
      // Calculate week end date (6 days after start)
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const weekEndDate = endDate.toISOString().split('T')[0];
      
     // Only fetch shifts (other functions are commented out)
      const shifts = await fetchWeeklyShifts(weekStartDate, weekEndDate);

      
      // Calculate real-time metrics from shifts
      const metrics = calculateLaborMetrics(shifts);
      
      return {
        summary: metrics, // Use calculated metrics
        shifts,
        analytics: [], // Empty (table doesn't exist yet)
        metrics
      };
      
    } catch (err) {
      console.error('Error in getWeeklyLaborData:', err);
      return {
        summary: null,
        shifts: [],
        analytics: [],
        metrics: null
      };
    }
  };
  // System Stats Function
  const getSystemStats = async () => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get location details
      const { data: location } = await supabase
        .from('locations')
        .select('name')
        .eq('uuid', locationUuid)
        .single();
      
      return {
        databaseConnected: isConnected,
        locationName: location?.name || locationName || 'Unknown Location',
        employeeCount: employees.length,
        activeSchedules: Object.keys(schedules).length,
        pendingPTORequests: ptoRequests.filter(r => r.status === 'pending').length,
        userEmail: session?.user?.email || 'Not logged in'
      };
    } catch (err) {
      console.error('Error getting system stats:', err);
      return {
        databaseConnected: false,
        locationName: 'Error Loading'
      };
    }
  };

  // Context value with all functions and state
  const value = {
    // Core state
    employees,
    schedules,
    ptoRequests,
    scheduleRequests,
    employeeAvailability,
    loading,
    error,
    isConnected,

    // Location state - NOW INCLUDES BOTH ID AND UUID
    locationId, // bigint ID for reference
    locationUuid, // UUID for database queries
    locationName,
    loadingLocation,
    locationError,

    // Core functions
    loadLaborData,
    addEmployee,

    // Analytics and forecasting
    getSmartForecast,
    getWeatherImpact,
    getLaborAnalytics,

    // Schedule functions
    saveSchedule,
    fetchWeekSchedule,

    // PTO functions
    addPTORequest,
    updatePTOStatus,
    approvePTORequest,
    denyPTORequest,

    // System functions
    getSystemStats,

    // NEW: Labor Analytics & Schedule Generation
   generateWeeklySchedule,
   calculateLaborMetrics,
   getWeeklyLaborData,

    // Helper functions
    calculateShiftHours,
    convertTimeToStandard,
    convertTimeToMilitary,

    // Mappings
    DEPARTMENT_MAPPING,
    REVERSE_DEPARTMENT_MAPPING
  };

  return (
    <LaborDataContext.Provider value={value}>
      {children}
    </LaborDataContext.Provider>
  );
};
