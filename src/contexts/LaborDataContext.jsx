import React, { createContext, useState, useEffect, useContext } from 'react';
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

  // ✅ NEW FUNCTION: Fetch schedule for a specific week
  const fetchWeekSchedule = async (weekStartDate) => {
    if (!locationUuid) {
      console.error('❌ No location UUID available');
      return null;
    }
    
    try {
      console.log(`📅 Fetching schedule for week starting ${weekStartDate}...`);
      
      // Calculate week end date
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      // Fetch shifts for this week
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:employees(*)
        `)
        .eq('location_id', locationUuid)
        .gte('day', startDate.toISOString().split('T')[0])
        .lte('day', endDate.toISOString().split('T')[0])
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching shifts:', error);
        return null;
      }
      
      console.log(`✅ Fetched ${shifts?.length || 0} shifts for week ${weekStartDate}`);
      // Format shifts to include employee_name
const formattedShifts = shifts?.map(shift => ({
  ...shift,
  employee_name: shift.employee?.name || null
})) || [];

console.log('✅ Formatted shifts with employee names:', formattedShifts.slice(0, 3));
return formattedShifts;

      
    } catch (err) {
      console.error('❌ Exception in fetchWeekSchedule:', err);
      return null;
    }
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
        .order('start_date', { ascending: false });

      if (ptoError) {
        console.error('Error loading PTO requests:', ptoError);
      } else {
        setPtoRequests(ptoData || []);
        console.log('Loaded PTO requests:', ptoData?.length || 0);
      }

      // Load employee availability - USE UUID
      const { data: availData, error: availError } = await supabase
        .from('employee_availability')
        .select('*')
        .eq('location_id', locationUuid); // Use UUID here

      if (availError) {
        console.error('Error loading availability:', availError);
      } else {
        setEmployeeAvailability(availData || []);
        console.log('Loaded availability records:', availData?.length || 0);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in loadLaborData:', err);
      setError('Failed to load labor data');
      setIsConnected(false);
      setLoading(false);
    }
  };

  // Load data when location is ready
  useEffect(() => {
    if (locationUuid) {
      loadLaborData();
    }
  }, [locationUuid]);

  // Add employee function - UPDATED TO USE UUID
  const addEmployee = async (employeeData) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const newEmployee = {
        ...employeeData,
        location_id: locationUuid, // Use UUID
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();

      if (error) throw error;

      setEmployees(prev => [...prev, data[0]]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    }
  };

  // Calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const start = convertTimeToMilitary(startTime);
    const end = convertTimeToMilitary(endTime);
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + (minutes / 60);
  };

  // Save schedule function - UPDATED TO USE UUID
  const saveSchedule = async (weekStartDate, scheduleData) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const scheduleRecord = {
        location_id: locationUuid, // Use UUID
        week_start_date: weekStartDate,
        schedule_data: scheduleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('schedules')
        .upsert([scheduleRecord], { onConflict: ['location_id', 'week_start_date'] })
        .select();

      if (error) throw error;

      setSchedules(prev => ({
        ...prev,
        [weekStartDate]: scheduleData
      }));

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error saving schedule:', err);
      return { success: false, error: err.message };
    }
  };

  // PTO functions - UPDATED TO USE UUID
  const addPTORequest = async (ptoData) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const newRequest = {
        ...ptoData,
        location_id: locationUuid, // Use UUID
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('pto_requests')
        .insert([newRequest])
        .select(`
          *,
          employees!inner(id, name, email, role)
        `);

      if (error) throw error;

      setPtoRequests(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding PTO request:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePTOStatus = async (requestId, status, reviewedBy) => {
    try {
      const { data, error } = await supabase
        .from('pto_requests')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select(`
          *,
          employees!inner(id, name, email, role)
        `);

      if (error) throw error;

      setPtoRequests(prev =>
        prev.map(req => (req.id === requestId ? data[0] : req))
      );

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error updating PTO status:', err);
      return { success: false, error: err.message };
    }
  };

  const approvePTORequest = async (requestId, reviewedBy) => {
    return updatePTOStatus(requestId, 'approved', reviewedBy);
  };

  const denyPTORequest = async (requestId, reviewedBy) => {
    return updatePTOStatus(requestId, 'denied', reviewedBy);
  };

  // Smart forecast function with holiday detection
  const getSmartForecast = async (date) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get historical data for same day of week
      const historicalData = [];
      for (let weeksBack = 1; weeksBack <= 4; weeksBack++) {
        const historicalDate = getDateWeeksAgo(date, weeksBack);
        
        const { data, error } = await supabase
          .from('fva_daily_history')
          .select('actual_sales, forecast_sales')
          .eq('location_uuid', locationUuid) // Use UUID
          .eq('date', historicalDate)
          .single();
        
        if (!error && data) {
          historicalData.push(data.actual_sales || data.forecast_sales || 0);
        }
      }
      
      // Calculate base forecast
      let baseForecast = 0;
      if (historicalData.length > 0) {
        baseForecast = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
      } else {
        // Fallback to typical day patterns
        const typicalSales = {
          0: 8000,  // Sunday
          1: 5000,  // Monday
          2: 5500,  // Tuesday
          3: 6000,  // Wednesday
          4: 7000,  // Thursday
          5: 12000, // Friday
          6: 13000  // Saturday
        };
        baseForecast = typicalSales[dayOfWeek];
      }
      
      // Apply holiday multiplier
      const holidayMultiplier = getHolidayMultiplier(date);
      const adjustedForecast = Math.round(baseForecast * holidayMultiplier);
      
      return {
        forecast: adjustedForecast,
        confidence: historicalData.length >= 3 ? 'high' : 'medium',
        historicalAverage: Math.round(baseForecast),
        holidayMultiplier,
        isHoliday: holidayMultiplier !== 1.0
      };
    } catch (err) {
      console.error('Error generating smart forecast:', err);
      return {
        forecast: 8000,
        confidence: 'low',
        error: err.message
      };
    }
  };

  // Weather impact placeholder
  const getWeatherImpact = async (date) => {
    return {
      temperature: 72,
      conditions: 'Clear',
      impact: 'neutral',
      adjustment: 1.0
    };
  };

  // Labor analytics placeholder
  const getLaborAnalytics = async (startDate, endDate) => {
    try {
      const locationUuid = await getCurrentLocationUuid();
      
      const { data, error } = await supabase
        .from('fva_daily_history')
        .select('*')
        .eq('location_uuid', locationUuid) // Use UUID
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      return {
        totalSales: data.reduce((sum, day) => sum + (day.actual_sales || 0), 0),
        totalLaborCost: data.reduce((sum, day) => sum + (day.actual_labor_cost || 0), 0),
        avgLaborPercent: data.length > 0
          ? (data.reduce((sum, day) => sum + ((day.actual_labor_cost || 0) / (day.actual_sales || 1) * 100), 0) / data.length)
          : 0,
        days: data.length
      };
    } catch (err) {
      console.error('Error getting labor analytics:', err);
      return {
        totalSales: 0,
        totalLaborCost: 0,
        avgLaborPercent: 0,
        days: 0
      };
    }
  };

  // System stats
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
    fetchWeekSchedule, // ✅ NEW FUNCTION ADDED

    // PTO functions
    addPTORequest,
    updatePTOStatus,
    approvePTORequest,
    denyPTORequest,

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

export default LaborDataContext;
