import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export const useFinancialData = (timeRange = 'week') => {
  const [tenantId, setTenantId] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [summary, setSummary] = useState({
    totalCost: 0,
    totalSavings: 0,
    avgDailyCost: 0,
    trend: 'stable'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tenant ID for current user
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No user logged in');
          return;
        }

        const { data: userTenant, error: tenantError } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (tenantError) throw tenantError;
        
        console.log('Fetched tenant_id for financial data:', userTenant.tenant_id);
        setTenantId(userTenant.tenant_id);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err.message);
      }
    };

    fetchTenant();
  }, []);

  // Fetch financial data when tenant and time range are available
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case 'day':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log('Fetching financial data for:', { 
          tenantId, 
          startDate: startDateStr, 
          endDate: endDateStr 
        });

        // Fetch financial tracking data
        const { data: financialRecords, error: financialError } = await supabase
          .from('financial_tracking')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });

        if (financialError) throw financialError;

        console.log('Financial records found:', financialRecords);
        setFinancialData(financialRecords || []);

        // Calculate summary
        if (financialRecords && financialRecords.length > 0) {
          const totalCost = financialRecords.reduce((sum, record) => sum + (record.total_prep_cost || 0), 0);
          const totalSavings = financialRecords.reduce((sum, record) => sum + (record.estimated_savings || 0), 0);
          const avgDailyCost = totalCost / financialRecords.length;

          // Calculate trend (simple: compare first half vs second half)
          const midpoint = Math.floor(financialRecords.length / 2);
          const firstHalfAvg = financialRecords.slice(0, midpoint)
            .reduce((sum, r) => sum + (r.total_prep_cost || 0), 0) / midpoint;
          const secondHalfAvg = financialRecords.slice(midpoint)
            .reduce((sum, r) => sum + (r.total_prep_cost || 0), 0) / (financialRecords.length - midpoint);
          
          let trend = 'stable';
          if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
          else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';

          setSummary({
            totalCost: Math.round(totalCost * 100) / 100,
            totalSavings: Math.round(totalSavings * 100) / 100,
            avgDailyCost: Math.round(avgDailyCost * 100) / 100,
            trend
          });
        } else {
          setSummary({
            totalCost: 0,
            totalSavings: 0,
            avgDailyCost: 0,
            trend: 'stable'
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [tenantId, timeRange]);

  return {
    tenantId,
    financialData,
    summary,
    loading,
    error
  };
};
