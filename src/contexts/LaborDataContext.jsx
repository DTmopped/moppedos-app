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
  const [locationUuid, setLocationUuid] = useState(null); // This will be the UUID for queries
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
          employees!inner(id, name, role)
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

      // Load existing schedules - USE ACTUAL TABLE NAME AND UUID
      const { data: existingSchedules, error: schedulesError } = await supabase
        .from('schedules') // Use actual table name
        .select('*')
        .eq('location_id', locationUuid) // Use UUID here
        .order('week_start_date', { ascending: false });

      if (!schedulesError && existingSchedules) {
        const schedulesMap = {};
        existingSchedules.forEach(schedule => {
          const weekKey = schedule.week_start_date;
          schedulesMap[weekKey] = {
            ...schedule,
            schedule_data: schedule.schedule_data || {}
          };
        });
        setSchedules(schedulesMap);
        console.log('Loaded schedules:', existingSchedules.length);
      }

    } catch (err) {
      console.error('Error loading labor data:', err);
      setError('Database connection failed - check your internet connection');
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

  // Load data when location UUID is available
  useEffect(() => {
    if (locationUuid && !loadingLocation) {
      loadLaborData();
    }
  }, [locationUuid, loadingLocation]);

  // Employee Management Functions - UPDATED TO USE UUID
  const addEmployee = async (employeeData) => {
    try {
      setLoading(true);
      const locationUuid = await getCurrentLocationUuid();
      
      const newEmployee = {
        ...employeeData,
        location_id: locationUuid, // Use UUID
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        hourly_rate: employeeData.hourly_rate || 15,
        performance_rating: employeeData.performance_rating || 4.0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select()
        .single();

      if (error) throw error;

      // Add to local state with enhanced data
      const enhancedEmployee = {
        ...data,
        status: 'active',
        department: DEPARTMENT_MAPPING[data.department] || data.department || 'Front of House'
      };

      setEmployees(prev => [...prev, enhancedEmployee]);
      setIsConnected(true);
      return { success: true, data: enhancedEmployee };

    } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee to database');
      setIsConnected(false);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Smart Forecasting System - UPDATED TO USE UUID
  const getSmartForecast = async (date, parameters = {}) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      // Get historical data for the same day of week over past 8 weeks
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      let totalGuests = 0;
      let totalRevenue = 0;
      let validWeeks = 0;
      let baseLaborHours = 140;

      // Collect 8 weeks of historical data - USE UUID
      for (let week = 1; week <= 8; week++) {
        const historicalDate = getDateWeeksAgo(date, week);
        
        const { data: salesData } = await supabase
          .from('forecast_data') // Use actual table name
          .select('forecast_total, actual_total, labor_cost')
          .eq('location_id', locationUuid) // Use UUID
          .eq('date', historicalDate)
          .single();

        if (salesData && salesData.actual_total > 0) {
          totalGuests += Math.round(salesData.actual_total / MOPPED_RESTAURANT_TEMPLATE.spend_per_guest);
          totalRevenue += salesData.actual_total;
          
          if (salesData.labor_cost) {
            baseLaborHours = Math.round(salesData.labor_cost / 18);
          }
          validWeeks++;
        }
      }

      // Calculate base forecast
      const avgGuests = validWeeks > 0 ? Math.round(totalGuests / validWeeks) : 85;
      const avgRevenue = validWeeks > 0 ? Math.round(totalRevenue / validWeeks) : (avgGuests * MOPPED_RESTAURANT_TEMPLATE.spend_per_guest);

      // Apply multipliers
      const holidayMultiplier = getHolidayMultiplier(date);
      const weatherMultiplier = parameters.weatherMultiplier || 1.0;
      const seasonalMultiplier = parameters.seasonalMultiplier || 1.0;
      const eventMultiplier = parameters.eventMultiplier || 1.0;

      const totalMultiplier = holidayMultiplier * weatherMultiplier * seasonalMultiplier * eventMultiplier;

      // Calculate final forecast
      const forecastGuestCount = Math.round(avgGuests * totalMultiplier);
      const forecastRevenue = Math.round(avgRevenue * totalMultiplier);
      const forecastLaborHours = Math.round(baseLaborHours * totalMultiplier);

      const efficiency = forecastLaborHours > 0 ? 
        Math.round((forecastGuestCount / forecastLaborHours) * 100) / 100 : 1.0;

      return {
        success: true,
        forecast: {
          date: date,
          guestCount: forecastGuestCount,
          revenue: forecastRevenue,
          laborHours: forecastLaborHours,
          efficiency: efficiency,
          confidence: Math.min(validWeeks * 12.5, 100),
          multipliers: {
            holiday: holidayMultiplier,
            weather: weatherMultiplier,
            seasonal: seasonalMultiplier,
            event: eventMultiplier,
            total: totalMultiplier
          },
          historicalWeeks: validWeeks
        }
      };

    } catch (err) {
      console.error('Error generating smart forecast:', err);
      
      // Fallback forecast
      const fallbackGuests = 85;
      return {
        success: false,
        forecast: {
          date: date,
          guestCount: fallbackGuests,
          revenue: fallbackGuests * MOPPED_RESTAURANT_TEMPLATE.spend_per_guest,
          laborHours: Math.round(fallbackGuests * 0.8),
          efficiency: 1.0,
          confidence: 25,
          multipliers: { total: 1.0 },
          historicalWeeks: 0
        },
        error: err.message
      };
    }
  };

  // Weather Impact Analysis
  const getWeatherImpact = (weatherData) => {
    if (!weatherData) return { multiplier: 1.0, recommendations: [] };

    const { temperature, condition, precipitation } = weatherData;
    let multiplier = 1.0;
    const recommendations = [];

    // Temperature impact
    if (temperature < 32) {
      multiplier *= 0.7;
      recommendations.push({
        type: 'weather',
        title: 'Cold Weather Impact',
        description: 'Freezing temperatures typically reduce foot traffic by 30%. Consider hot beverage promotions.',
        impact: 'Reduced foot traffic expected',
        action: 'Promote hot drinks and comfort food'
      });
    } else if (temperature > 85) {
      multiplier *= 1.2;
      recommendations.push({
        type: 'weather',
        title: 'Hot Weather Boost',
        description: 'Hot weather increases demand for cold beverages and lighter meals.',
        impact: 'Improved service quality, avoid wait times',
        action: 'Stock extra cold beverages and prep lighter menu items'
      });
    }

    // Precipitation impact
    if (precipitation > 0.5) {
      multiplier *= 0.6;
      recommendations.push({
        type: 'weather',
        title: 'Heavy Rain/Snow Impact',
        description: 'Significant precipitation reduces walk-in traffic. Focus on delivery and takeout.',
        impact: 'Reduced walk-in customers',
        action: 'Boost delivery marketing and prep for takeout orders'
      });
    }

    return { multiplier, recommendations };
  };

  // Enhanced Labor Analytics - UPDATED TO USE UUID AND ACTUAL TABLES
  const getLaborAnalytics = async (startDate, endDate) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      // Get actual scheduled hours and costs from shifts table - USE UUID
      const { data: shiftsData, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employees(name, hourly_rate, department, role)
        `)
        .eq('location_id', locationUuid) // Use UUID
        .gte('day', startDate)
        .lte('day', endDate);

      if (error) throw error;

      let totalCost = 0;
      let totalHours = 0;
      
      const departmentBreakdown = {
        'FOH': { cost: 0, hours: 0, efficiency: 0 },
        'BOH': { cost: 0, hours: 0, efficiency: 0 },
        'Bar': { cost: 0, hours: 0, efficiency: 0 },
        'Management': { cost: 0, hours: 0, efficiency: 0 }
      };

      shiftsData?.forEach(shift => {
        if (shift.hours && shift.rate) {
          const hours = shift.hours;
          const cost = hours * shift.rate;
          
          totalCost += cost;
          totalHours += hours;
          
          const dept = REVERSE_DEPARTMENT_MAPPING[shift.department] || 'FOH';
          if (departmentBreakdown[dept]) {
            departmentBreakdown[dept].cost += cost;
            departmentBreakdown[dept].hours += hours;
          }
        }
      });

      // Calculate efficiency for each department
      Object.keys(departmentBreakdown).forEach(dept => {
        const deptData = departmentBreakdown[dept];
        deptData.efficiency = deptData.hours > 0 ? Math.round((deptData.cost / deptData.hours) * 100) / 100 : 0;
      });

      return {
        success: true,
        analytics: {
          totalCost: totalCost,
          totalHours: totalHours,
          averageHourlyRate: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
          efficiency: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
          departmentBreakdown: departmentBreakdown,
          period: { startDate, endDate }
        }
      };

    } catch (err) {
      console.error('Error getting labor analytics:', err);
      return {
        success: false,
        analytics: {
          totalCost: 0,
          totalHours: 0,
          averageHourlyRate: 0,
          efficiency: 0,
          departmentBreakdown: {
            'FOH': { cost: 0, hours: 0, efficiency: 0 },
            'BOH': { cost: 0, hours: 0, efficiency: 0 },
            'Bar': { cost: 0, hours: 0, efficiency: 0 },
            'Management': { cost: 0, hours: 0, efficiency: 0 }
          }
        },
        error: err.message
      };
    }
  };

  // Helper function to calculate shift hours with standard time format support
  const calculateShiftHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    // Convert to military time if needed
    const militaryStart = startTime.includes('AM') || startTime.includes('PM') ? 
      convertTimeToMilitary(startTime) : startTime;
    const militaryEnd = endTime.includes('AM') || endTime.includes('PM') ? 
      convertTimeToMilitary(endTime) : endTime;
    
    const start = new Date(`2000-01-01 ${militaryStart}`);
    const end = new Date(`2000-01-01 ${militaryEnd}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
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

  // Schedule Management Functions - UPDATED TO USE ACTUAL TABLE AND UUID
  const saveSchedule = async (weekKey, scheduleData) => {
    try {
      setLoading(true);
      const locationUuid = await getCurrentLocationUuid();
      
      // Convert any standard time formats to military time for database storage
      const processedScheduleData = JSON.parse(JSON.stringify(scheduleData));
      
      // Process each schedule entry to ensure times are in military format
      Object.keys(processedScheduleData).forEach(key => {
        const slot = processedScheduleData[key];
        if (slot.employees) {
          slot.employees = slot.employees.map(emp => ({
            ...emp,
            start: emp.start && (emp.start.includes('AM') || emp.start.includes('PM')) ? 
              convertTimeToMilitary(emp.start) : emp.start,
            end: emp.end && (emp.end.includes('AM') || emp.end.includes('PM')) ? 
              convertTimeToMilitary(emp.end) : emp.end
          }));
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
      
      // Convert times back to standard format for display
      const displayScheduleData = JSON.parse(JSON.stringify(data.schedule_data));
      Object.keys(displayScheduleData).forEach(key => {
        const slot = displayScheduleData[key];
        if (slot.employees) {
          slot.employees = slot.employees.map(emp => ({
            ...emp,
            start: emp.start ? convertTimeToStandard(emp.start) : emp.start,
            end: emp.end ? convertTimeToStandard(emp.end) : emp.end
          }));
        }
      });
      
      setSchedules(prev => ({
        ...prev,
        [weekKey]: {
          ...data,
          schedule_data: displayScheduleData
        }
      }));
      
      return { success: true, data: { ...data, schedule_data: displayScheduleData } };
      
    } catch (err) {
      console.error('Error saving schedule:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // System Stats Function - UPDATED TO USE UUID
  const getSystemStats = async () => {
    try {
      const currentLocationUuid = await getCurrentLocationUuid();
      
      // Get current date for calculations
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const weekStart = startOfWeek.toISOString().split('T')[0];
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStart = startOfMonth.toISOString().split('T')[0];

      // Initialize stats object
      const stats = {
        // Employee Statistics
        totalEmployees: employees.length,
        activeEmployees: employees.filter(emp => emp.status === 'active').length,
        
        // Department Breakdown
        departmentBreakdown: {
          'Front of House': employees.filter(emp => emp.department === 'Front of House').length,
          'Back of House': employees.filter(emp => emp.department === 'Back of House').length,
          'Bar & Beverage': employees.filter(emp => emp.department === 'Bar & Beverage').length,
          'Management': employees.filter(emp => emp.department === 'Management').length
        },
        
        // PTO Statistics
        pendingPTORequests: ptoRequests.filter(pto => pto.status === 'pending').length,
        approvedPTORequests: ptoRequests.filter(pto => pto.status === 'approved').length,
        
        // Schedule Statistics
        totalSchedules: Object.keys(schedules).length,
        
        // System Health
        databaseConnected: isConnected,
        lastDataLoad: new Date().toISOString(),
        
        // Location Info
        locationId: locationId,
        locationUuid: currentLocationUuid,
        locationName: locationName || 'Unknown Location'
      };

      // Get today's schedule stats if available
      const todayScheduleKey = Object.keys(schedules).find(key => 
        schedules[key]?.week_start_date && 
        new Date(schedules[key].week_start_date) <= new Date(today)
      );
      
      if (todayScheduleKey && schedules[todayScheduleKey]) {
        const todaySchedule = schedules[todayScheduleKey].schedule_data || {};
        let scheduledEmployeesToday = 0;
        let totalShiftsToday = 0;
        
        Object.values(todaySchedule).forEach(slot => {
          if (slot.employees && Array.isArray(slot.employees)) {
            scheduledEmployeesToday += slot.employees.length;
            totalShiftsToday += slot.employees.length;
          }
        });
        
        stats.todayStats = {
          scheduledEmployees: scheduledEmployeesToday,
          totalShifts: totalShiftsToday
        };
      } else {
        stats.todayStats = {
          scheduledEmployees: 0,
          totalShifts: 0
        };
      }

      // Try to get sales data for additional metrics - USE UUID
      try {
        const { data: salesData } = await supabase
          .from('forecast_data')
          .select('actual_total, labor_cost')
          .eq('location_id', currentLocationUuid) // Use UUID
          .eq('date', today)
          .single();

        if (salesData) {
          stats.todayStats.revenue = salesData.actual_total || 0;
          stats.todayStats.laborCost = salesData.labor_cost || 0;
        }
      } catch (salesError) {
        // Sales data not available, continue without it
        console.log('Sales data not available for today');
      }

      // Calculate average hourly rate
      const totalHourlyRates = employees.reduce((sum, emp) => sum + (emp.hourly_rate || 0), 0);
      stats.averageHourlyRate = employees.length > 0 ? 
        Math.round((totalHourlyRates / employees.length) * 100) / 100 : 0;

      // Performance metrics
      stats.performance = {
        dataLoadTime: loading ? 'Loading...' : 'Ready',
        errorCount: error ? 1 : 0,
        lastError: error || null
      };

      return {
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      };

    } catch (err) {
      console.error('Error getting system stats:', err);
      return {
        success: false,
        error: err.message,
        stats: {
          totalEmployees: employees.length || 0,
          activeEmployees: 0,
          databaseConnected: false,
          locationName: 'Error Loading'
        }
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

    // PTO functions
    addPTORequest,
    updatePTOStatus,

    // System functions
    getSystemStats,

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
