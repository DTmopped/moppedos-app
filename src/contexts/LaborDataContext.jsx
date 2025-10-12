import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { MOPPED_RESTAURANT_TEMPLATE } from '@/config/laborScheduleConfig';

const LaborDataContext = createContext();

export const useLaborData = () => {
  const context = useContext(LaborDataContext);
  if (!context) {
    throw new Error('useLaborData must be used within a LaborDataProvider');
  }
  return context;
};

// Department mapping to standardize between config and database
const DEPARTMENT_MAPPING = {
  'FOH': 'Front of House',
  'BOH': 'Back of House', 
  'Bar': 'Bar & Beverage',
  'Management': 'Management'
};

const REVERSE_DEPARTMENT_MAPPING = {
  'Front of House': 'FOH',
  'Back of House': 'BOH',
  'Bar & Beverage': 'Bar',
  'Management': 'Management'
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
    [`${year}-10-31`]: 1.5, // Halloween
    [`${year}-12-24`]: 0.2, // Christmas Eve
    [`${year}-12-25`]: 0.1, // Christmas Day
    [`${year}-12-26`]: 0.4, // Day after Christmas
  };
  
  // Calculate floating holidays
  const floatingHolidays = {};
  
  // Mother's Day (second Sunday in May)
  const mothersDay = getNthSundayOfMonth(year, 5, 2);
  floatingHolidays[mothersDay] = 2.5; // Busiest day of year
  floatingHolidays[getDateBefore(mothersDay, 1)] = 1.8; // Saturday before
  
  // Father's Day (third Sunday in June)
  const fathersDay = getNthSundayOfMonth(year, 6, 3);
  floatingHolidays[fathersDay] = 1.9;
  floatingHolidays[getDateBefore(fathersDay, 1)] = 1.4;
  
  // Easter Sunday
  const easter = getEasterDate(year);
  floatingHolidays[easter] = 1.8;
  floatingHolidays[getDateBefore(easter, 1)] = 1.3;
  
  // Thanksgiving (fourth Thursday in November)
  const thanksgiving = getNthThursdayOfMonth(year, 11, 4);
  floatingHolidays[thanksgiving] = 0.1;
  floatingHolidays[getDateBefore(thanksgiving, 1)] = 0.3;
  floatingHolidays[getDateAfter(thanksgiving, 1)] = 0.8; // Black Friday
  
  const dateStr = targetDate.toISOString().split('T')[0];
  return fixedHolidays[dateStr] || floatingHolidays[dateStr] || 1.0;
};

// Holiday calculation helper functions
const getNthSundayOfMonth = (year, month, n) => {
  const firstDay = new Date(year, month - 1, 1);
  const firstSunday = new Date(firstDay);
  firstSunday.setDate(1 + (7 - firstDay.getDay()) % 7);
  firstSunday.setDate(firstSunday.getDate() + (n - 1) * 7);
  return firstSunday.toISOString().split('T')[0];
};

const getNthThursdayOfMonth = (year, month, n) => {
  const firstDay = new Date(year, month - 1, 1);
  const firstThursday = new Date(firstDay);
  firstThursday.setDate(1 + (4 - firstDay.getDay() + 7) % 7);
  firstThursday.setDate(firstThursday.getDate() + (n - 1) * 7);
  return firstThursday.toISOString().split('T')[0];
};

const getDateBefore = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const getDateAfter = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Easter calculation
const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day).toISOString().split('T')[0];
};

// Seasonal adjustments
const getSeasonalMultiplier = (month) => {
  const seasonalFactors = {
    0: 0.80,  // January - post-holiday slow
    1: 0.85,  // February - still slow, Valentine's boost
    2: 0.95,  // March - spring pickup
    3: 1.05,  // April - spring busy season
    4: 1.15,  // May - Mother's Day and spring peak
    5: 1.20,  // June - summer season starts
    6: 1.25,  // July - peak summer
    7: 1.20,  // August - still summer busy
    8: 1.10,  // September - back to school
    9: 1.05,  // October - fall season
    10: 1.15, // November - Thanksgiving boost
    11: 1.10  // December - holiday parties
  };
  return seasonalFactors[month] || 1.0;
};

export const LaborDataProvider = ({ children }) => {
  // Core state - NO MORE MOCK DATA
  const [employees, setEmployees] = useState([]);
  const [ptoRequests, setPtoRequests] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(MOPPED_RESTAURANT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Enhanced scheduling state - NO MORE MOCK DATA
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [employeeAvailability, setEmployeeAvailability] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [smartForecasts, setSmartForecasts] = useState({});
  const [weatherData, setWeatherData] = useState({});
  const [laborAnalytics, setLaborAnalytics] = useState({});

  // Get current user's location
  const getCurrentLocationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Fallback location
      
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

  // Load data from Supabase - DATABASE FIRST APPROACH
  const loadLaborData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationId = await getCurrentLocationId();
      
      // Load employees - NO FALLBACK TO MOCK DATA
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('location_id', locationId)
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
          // Standardize department names
          department: DEPARTMENT_MAPPING[emp.department] || emp.department || 'Front of House'
        }));
        
        setEmployees(enhancedEmployees);
        setIsConnected(true);
        console.log('Loaded employees:', enhancedEmployees.length);
      }

      // Load PTO requests
      const { data: ptoData, error: ptoError } = await supabase
        .from('pto_requests')
        .select(`
          *,
          employees!inner(id, name, email, role)
        `)
        .eq('location_id', locationId)
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
        console.log('Loaded schedule requests:', enhancedScheduleData.length);
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
        console.log('Loaded employee availability:', enhancedAvailability.length);
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
        // Convert department to database format
        department: REVERSE_DEPARTMENT_MAPPING[employeeData.department] || employeeData.department,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select()
        .single();
      
      if (error) throw error;
      
      // Enhance the returned data for display
      const enhancedEmployee = {
        ...data,
        status: 'active',
        department: DEPARTMENT_MAPPING[data.department] || data.department
      };
      
      setEmployees(prev => [...prev, enhancedEmployee]);
      return { success: true, data: enhancedEmployee };
      
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
        // Convert department to database format
        department: REVERSE_DEPARTMENT_MAPPING[employeeData.department] || employeeData.department,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .update(updatedData)
        .eq('id', employeeId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Enhance the returned data for display
      const enhancedEmployee = {
        ...data,
        status: data.is_active ? 'active' : 'inactive',
        department: DEPARTMENT_MAPPING[data.department] || data.department
      };
      
      setEmployees(prev => 
        prev.map(emp => emp.id === employeeId ? enhancedEmployee : emp)
      );
      return { success: true, data: enhancedEmployee };
      
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
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
      
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

  // Smart Forecasting System - REPLACES FAKE AI
  const getSmartForecast = async (date, parameters = {}) => {
    try {
      const locationId = await getCurrentLocationId();
      
      // Get historical sales/guest data from multiple sources
      const [salesData, scheduleData] = await Promise.all([
        supabase
          .from('daily_sales')
          .select('guest_count, labor_cost, sales_total, date, day_of_week')
          .eq('location_id', locationId)
          .gte('date', getDateWeeksAgo(date, 12))
          .lte('date', date)
          .order('date', { ascending: false }),
        
        supabase
          .from('weekly_schedules')
          .select('schedule_data, week_start')
          .eq('location_id', locationId)
          .gte('week_start', getDateWeeksAgo(date, 12))
          .lte('week_start', date)
      ]);
      
      const historicalData = salesData.data || [];
      
      // Calculate baseline metrics from historical data
      let baseGuestCount = 150; // Default fallback
      let baseLaborCost = 2400;
      let baseLaborHours = 140;
      let confidence = 40;
      let dataQuality = 'Limited';
      
      if (historicalData.length > 0) {
        const validGuestData = historicalData.filter(day => day.guest_count > 0);
        const validLaborData = historicalData.filter(day => day.labor_cost > 0);
        
        if (validGuestData.length > 0) {
          baseGuestCount = Math.round(
            validGuestData.reduce((sum, day) => sum + day.guest_count, 0) / validGuestData.length
          );
        }
        
        if (validLaborData.length > 0) {
          baseLaborCost = Math.round(
            validLaborData.reduce((sum, day) => sum + day.labor_cost, 0) / validLaborData.length
          );
          baseLaborHours = Math.round(baseLaborCost / 18);
        }
        
        const totalDataPoints = historicalData.length;
        confidence = Math.min(50 + (totalDataPoints * 3), 95);
        
        if (totalDataPoints >= 30) dataQuality = 'Excellent';
        else if (totalDataPoints >= 15) dataQuality = 'Good';
        else if (totalDataPoints >= 5) dataQuality = 'Fair';
        else dataQuality = 'Limited';
      }
      
      // Apply day-of-week patterns (YOUR business: Thu-Sat busy)
      const dayOfWeek = new Date(date).getDay();
      const dayPatterns = {
        0: 1.1,  // Sunday - moderate
        1: 0.6,  // Monday - slowest day
        2: 0.7,  // Tuesday - slow
        3: 0.8,  // Wednesday - building up
        4: 1.3,  // Thursday - BUSY (your pattern)
        5: 1.4,  // Friday - VERY BUSY (your pattern)
        6: 1.4   // Saturday - VERY BUSY (your pattern)
      };
      
      // Learn actual patterns if enough data
      if (historicalData.length >= 21) {
        const dayAverages = {};
        for (let dow = 0; dow <= 6; dow++) {
          const dayData = historicalData.filter(day => new Date(day.date).getDay() === dow);
          if (dayData.length > 0) {
            const dayAvg = dayData.reduce((sum, day) => sum + day.guest_count, 0) / dayData.length;
            dayAverages[dow] = dayAvg / baseGuestCount;
          }
        }
        
        if (Object.keys(dayAverages).length >= 5) {
          Object.assign(dayPatterns, dayAverages);
          confidence += 10;
        }
      }
      
      const dayMultiplier = dayPatterns[dayOfWeek] || 1.0;
      
      // Apply seasonal and holiday adjustments
      const month = new Date(date).getMonth();
      const seasonalMultiplier = getSeasonalMultiplier(month);
      const holidayMultiplier = getHolidayMultiplier(date);
      
      // Calculate final forecast
      const totalMultiplier = dayMultiplier * seasonalMultiplier * holidayMultiplier;
      const forecastGuestCount = Math.round(baseGuestCount * totalMultiplier);
      const forecastLaborCost = Math.round(baseLaborCost * totalMultiplier);
      const forecastLaborHours = Math.round(baseLaborHours * totalMultiplier);
      
      const efficiency = forecastLaborHours > 0 ? 
        Math.round((forecastGuestCount / forecastLaborHours) * 100) / 100 : 1.0;
      
      // Generate smart recommendations
      const recommendations = generateSmartRecommendations({
        guestCount: forecastGuestCount,
        laborCost: forecastLaborCost,
        dayOfWeek,
        historicalAverage: baseGuestCount,
        confidence,
        holidayMultiplier,
        date
      });
      
      let methodology = 'Basic day-of-week patterns';
      if (historicalData.length >= 21) {
        methodology = 'Historical data + learned patterns + seasonal/holiday adjustments';
      } else if (historicalData.length >= 5) {
        methodology = 'Limited historical data + day-of-week patterns + seasonal/holiday adjustments';
      }
      
      const forecast = {
        date,
        guestCount: forecastGuestCount,
        laborHours: forecastLaborHours,
        laborCost: forecastLaborCost,
        efficiency,
        confidence,
        dataPoints: historicalData.length,
        dataQuality,
        recommendations,
        methodology,
        factors: {
          baseGuestCount,
          dayMultiplier: Math.round(dayMultiplier * 100) / 100,
          seasonalMultiplier: Math.round(seasonalMultiplier * 100) / 100,
          holidayMultiplier: Math.round(holidayMultiplier * 100) / 100,
          totalMultiplier: Math.round(totalMultiplier * 100) / 100
        }
      };
      
      // Cache the forecast
      setSmartForecasts(prev => ({
        ...prev,
        [date]: forecast
      }));
      
      return forecast;
      
    } catch (err) {
      console.error('Failed to generate smart forecast:', err);
      
      // Fallback to basic logic
      const dayOfWeek = new Date(date).getDay();
      const isThursdayToSaturday = dayOfWeek >= 4 && dayOfWeek <= 6;
      const holidayMultiplier = getHolidayMultiplier(date);
      
      const baseGuests = isThursdayToSaturday ? 195 : 120;
      const adjustedGuests = Math.round(baseGuests * holidayMultiplier);
      
      return {
        date,
        guestCount: adjustedGuests,
        laborHours: Math.round(adjustedGuests * 0.8),
        laborCost: Math.round(adjustedGuests * 14.4),
        efficiency: 1.25,
        confidence: 35,
        dataPoints: 0,
        dataQuality: 'None - using fallback logic',
        recommendations: [
          "Connect sales data to improve forecasting accuracy",
          "Track daily guest counts for better predictions"
        ],
        methodology: 'Basic Thu-Sat busy pattern + holiday detection',
        factors: {
          baseGuestCount: baseGuests,
          dayMultiplier: isThursdayToSaturday ? 1.4 : 0.8,
          seasonalMultiplier: 1.0,
          holidayMultiplier,
          totalMultiplier: holidayMultiplier
        }
      };
    }
  };

  // Smart recommendations generator
  const generateSmartRecommendations = ({ 
    guestCount, 
    laborCost, 
    dayOfWeek, 
    historicalAverage, 
    confidence, 
    holidayMultiplier,
    date 
  }) => {
    const recommendations = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // High confidence recommendations
    if (confidence > 70) {
      if (guestCount > historicalAverage * 1.3) {
        const extraStaff = Math.ceil((guestCount - historicalAverage) / 25);
        recommendations.push({
          id: 'high-volume',
          type: 'staffing',
          priority: 'high',
          title: 'High Volume Expected',
          description: `Forecast shows ${guestCount} guests (${Math.round(((guestCount - historicalAverage) / historicalAverage) * 100)}% above average). Consider adding ${extraStaff} extra staff members.`,
          impact: 'Improved service quality, avoid wait times',
          confidence: confidence
        });
      }
      
      if (guestCount < historicalAverage * 0.7) {
        const reduceStaff = Math.ceil((historicalAverage - guestCount) / 30);
        const savings = reduceStaff * 120;
        recommendations.push({
          id: 'low-volume',
          type: 'cost-saving',
          priority: 'medium',
          title: 'Lower Volume Expected',
          description: `Forecast shows ${guestCount} guests (${Math.round(((historicalAverage - guestCount) / historicalAverage) * 100)}% below average). Consider reducing staff by ${reduceStaff} position(s).`,
          impact: `Save ~$${savings} in labor costs`,
          confidence: confidence
        });
      }
    }
    
    // Holiday-specific recommendations
    if (holidayMultiplier > 1.5) {
      recommendations.push({
        id: 'major-holiday',
        type: 'preparation',
        priority: 'critical',
        title: 'Major Holiday - High Volume Expected',
        description: `${date} appears to be a major holiday. Expect ${Math.round((holidayMultiplier - 1) * 100)}% increase in volume.`,
        impact: 'Avoid service failures on busy holiday',
        confidence: 90
      });
    } else if (holidayMultiplier < 0.5) {
      recommendations.push({
        id: 'slow-holiday',
        type: 'cost-saving',
        priority: 'high',
        title: 'Holiday - Very Low Volume Expected',
        description: `${date} appears to be a slow holiday. Consider reduced hours or minimal staffing.`,
        impact: 'Significant labor cost savings',
        confidence: 85
      });
    }
    
    // Day-specific recommendations
    if (dayOfWeek === 1) {
      recommendations.push({
        id: 'monday-prep',
        type: 'operational',
        priority: 'medium',
        title: 'Monday Prep Focus',
        description: 'Mondays are typically your slowest day. Focus on prep work, deep cleaning, and inventory management.',
        impact: 'Better preparation for busy Thursday-Saturday period',
        confidence: 85
      });
    }
    
    if (dayOfWeek >= 4 && dayOfWeek <= 6) {
      recommendations.push({
        id: 'busy-period-prep',
        type: 'preparation',
        priority: 'high',
        title: `${dayName} Rush Preparation`,
        description: `${dayName} is one of your busiest days. Ensure full staffing, extra prep, and all stations are fully stocked.`,
        impact: 'Smooth service during peak volume',
        confidence: 90
      });
    }
    
    return recommendations;
  };

  // Static Weather Placeholder - REPLACES FAKE RANDOM WEATHER
  const getWeatherImpact = async (date, location = 'default') => {
    // Static placeholder until location data is configured
    return {
      date,
      location,
      forecast: "Weather integration available - configure location data to enable real weather forecasting",
      recommendation: "Add location coordinates to enable weather-based staffing recommendations",
      status: 'placeholder'
    };
  };

  // Real Labor Analytics - REPLACES FAKE RANDOM ANALYTICS
  const getLaborAnalytics = async (startDate, endDate) => {
    try {
      const locationId = await getCurrentLocationId();
      
      // Get actual scheduled hours and costs from database
      const { data: scheduleData } = await supabase
        .from('weekly_schedules')
        .select('schedule_data, week_start')
        .eq('location_id', locationId)
        .gte('week_start', startDate)
        .lte('week_start', endDate);
      
      // Calculate real totals from actual schedule data
      let totalHours = 0;
      let totalCost = 0;
      let departmentBreakdown = {
        'FOH': { cost: 0, hours: 0, efficiency: 0 },
        'BOH': { cost: 0, hours: 0, efficiency: 0 },
        'Bar': { cost: 0, hours: 0, efficiency: 0 },
        'Management': { cost: 0, hours: 0, efficiency: 0 }
      };
      
      scheduleData?.forEach(week => {
        Object.values(week.schedule_data || {}).forEach(slot => {
          slot.employees?.forEach(emp => {
            const hours = calculateShiftHours(emp.start, emp.end);
            const cost = hours * (emp.hourly_rate || 15);
            const dept = REVERSE_DEPARTMENT_MAPPING[emp.department] || 'FOH';
            
            totalHours += hours;
            totalCost += cost;
            
            if (departmentBreakdown[dept]) {
              departmentBreakdown[dept].hours += hours;
              departmentBreakdown[dept].cost += cost;
            }
          });
        });
      });
      
      // Calculate efficiency for each department
      Object.keys(departmentBreakdown).forEach(dept => {
        const deptData = departmentBreakdown[dept];
        deptData.efficiency = deptData.hours > 0 ? Math.round((deptData.cost / deptData.hours) * 100) / 100 : 0;
      });
      
      const analytics = {
        period: { startDate, endDate },
        totalCost: totalCost,
        totalHours: totalHours,
        averageWeeklyCost: Math.round(totalCost / Math.max(1, scheduleData?.length || 1)),
        efficiency: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
        departmentBreakdown,
        dataSource: 'actual_schedules',
        dataPoints: scheduleData?.length || 0
      };
      
      setLaborAnalytics(prev => ({
        ...prev,
        [`${startDate}-${endDate}`]: analytics
      }));
      
      return analytics;
      
    } catch (err) {
      console.error('Failed to calculate labor analytics:', err);
      
      // Return basic structure if calculation fails
      return {
        period: { startDate, endDate },
        totalCost: 0,
        totalHours: 0,
        averageWeeklyCost: 0,
        efficiency: 0,
        departmentBreakdown: {
          'FOH': { cost: 0, hours: 0, efficiency: 0 },
          'BOH': { cost: 0, hours: 0, efficiency: 0 },
          'Bar': { cost: 0, hours: 0, efficiency: 0 },
          'Management': { cost: 0, hours: 0, efficiency: 0 }
        },
        dataSource: 'calculation_failed',
        dataPoints: 0,
        error: err.message
      };
    }
  };

  // Helper function to calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
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
      
    } catch (err) {
      console.error('Failed to deny PTO request:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Schedule Management Functions
  const saveSchedule = async (scheduleData) => {
    try {
      setLoading(true);
      const locationId = await getCurrentLocationId();
      
      const scheduleEntry = {
        ...scheduleData,
        location_id: locationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('weekly_schedules')
        .upsert([scheduleEntry])
        .select()
        .single();
      
      if (error) throw error;
      
      setSchedules(prev => ({
        ...prev,
        [scheduleData.week_start]: data
      }));
      
      return { success: true, data };
      
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadLaborData();
  }, []);

  // Context value
  const value = {
    // Core state
    employees,
    ptoRequests,
    currentTemplate,
    loading,
    error,
    isConnected,
    
    // Enhanced state
    schedules,
    smartForecasts,
    weatherData,
    laborAnalytics,
    scheduleRequests,
    employeeAvailability,
    
    // Employee functions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    loadLaborData,
    
    // PTO functions
    addPTORequest,
    approvePTORequest,
    denyPTORequest,
    
    // Smart Analytics functions (NO MORE FAKE DATA)
    getSmartForecast,
    getWeatherImpact,
    getLaborAnalytics,

    // Schedule functions
    saveSchedule,
    
    // Utility functions
    getCurrentLocationId,
    
    // Department mapping
    DEPARTMENT_MAPPING,
    REVERSE_DEPARTMENT_MAPPING
  };

  return (
    <LaborDataContext.Provider value={value}>
      {children}
    </LaborDataContext.Provider>
  );
};
