import React, { useState } from 'react';
import { Users, DollarSign, ArrowLeft } from 'lucide-react';
import EmployeeOnboardingSystem from '@/components/labor/EmployeeOnboardingSystem';
import RoleManagement from '@/components/settings/RoleManagement';
import { useLaborData } from '@/contexts/LaborDataContext';

/**
 * Enhanced Employee Management with Sub-tabs
 * Features:
 * - Clean tab navigation with back button on Roles tab
 * - Side-by-side action buttons (blue + green)
 * - Hover tooltips for better UX
 * - Context-aware button display
 */

const EmployeeManagementWithTabs = () => {
  const [activeSubTab, setActiveSubTab] = useState('employees');
  const { locationUuid } = useLaborData();

  const isEmployeesTab = activeSubTab === 'employees';
  const isRolesTab = activeSubTab === 'roles';

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation with Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          {/* Left: Tab Navigation */}
          <div className="flex space-x-2">
            {/* Employees Tab */}
            <button
              onClick={() => setActiveSubTab('employees')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isEmployeesTab
                  ? 'bg-cyan-50 text-cyan-700 border-2 border-cyan-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent'
              }`}
              title="View and manage your staff members"
            >
              {isRolesTab ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Employees</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>Employees</span>
                </>
              )}
            </button>

            {/* Roles & Rates Tab */}
            <button
              onClick={() => setActiveSubTab('roles')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isRolesTab
                  ? 'bg-cyan-50 text-cyan-700 border-2 border-cyan-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent'
              }`}
              title="Manage job roles, rates, and staffing rules"
            >
              <DollarSign className="h-4 w-4" />
              <span>Roles & Rates</span>
            </button>
          </div>

          {/* Right: Action Buttons - Only show on Employees tab */}
          {isEmployeesTab && (
            <div className="flex items-center space-x-3">
              {/* Add Employee Button (Blue) */}
              <button
                onClick={() => {
                  // This will be handled by EmployeeOnboardingSystem's existing button
                  // We're just showing it here for visual consistency
                }}
                className="hidden" // Hide this one, let the component's own button show
                title="Hire a new team member"
              >
              </button>
              
              {/* Add Role Button (Green) - Shows on Employees tab */}
              <button
                onClick={() => setActiveSubTab('roles')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                title="Add a new role type from our 140+ catalog"
              >
                <DollarSign className="h-4 w-4" />
                <span>Add Role</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>
        {activeSubTab === 'employees' && <EmployeeOnboardingSystem />}
        {activeSubTab === 'roles' && <RoleManagement locationId={locationUuid} />}
      </div>
    </div>
  );
};

export default EmployeeManagementWithTabs;
