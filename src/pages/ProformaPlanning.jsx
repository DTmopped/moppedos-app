import React from 'react';
import ProformaTool from '../components/ProformaTool';

/**
 * Proforma Planning Page
 * 
 * Financial planning and forecasting tool for restaurant operations.
 * Includes 5-year projections, budget planning, and variance analysis.
 */
export default function ProformaPlanning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ProformaTool />
    </div>
  );
}
