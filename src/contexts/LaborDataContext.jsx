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

export const LaborDataProvider = ({ children }) => {
  const [employees, setEmployees] = useState(mockEmployees);
  const [ptoRequests, setPtoRequests] = useState(mockPTORequests);
  const [currentTemplate, setCurrentTemplate] = useState(MOPPED_RESTAURANT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get current user's location
  const getCurrentLocationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'demo-location-123';
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('location_id')
        .eq('user_id', user.id)
        .single();
      
      return profile?.location_id || 'demo-location-123';
    } catch (error) {
      return 'demo-location-123';
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
        .eq('location_id', locationId)
        .eq('is_active', true);

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

    } catch (err) {
      console.error('Error loading labor data:', err);
      setError('Using demo data - Supabase connection failed');
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
    totalRoles: currentTemplate?.default_roles?.length || 13
  });

  const contextValue = {
    employees,
    ptoRequests,
    currentTemplate,
    loading,
    error,
    isConnected,
    getSystemStats,
    setError
  };

  return (
    <LaborDataContext.Provider value={contextValue}>
      {children}
    </LaborDataContext.Provider>
  );
};
