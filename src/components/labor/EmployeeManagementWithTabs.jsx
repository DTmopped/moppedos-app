import React, { useState } from 'react';
import { Users, DollarSign, ArrowLeft, Plus } from 'lucide-react';
import EmployeeOnboardingSystem from '@/components/labor/EmployeeOnboardingSystem';
import RoleManagement from '@/components/settings/RoleManagement';
import { useLaborData } from '@/contexts/LaborDataContext';

/**
 * Simplified Employee Management - NO SUB-TABS!
 * Just two action buttons side-by-side that switch views
 * 
 * Features:
 * - [+ Add Employee] [+ Add Role] buttons side-by-side
 * - Lighter green for Add Role (emerald-400)
 * - "← Back to Employees" when viewing roles
 * - Clean, simple interface
 */

const EmployeeManagementWithTabs = () => {
  const [activeView, setActiveView] = useState('employees'); // 'employees' or 'roles'
  const { locationUuid } = useLaborData();

  const isEmployeesView = activeView === 'employees';
  const isRolesView = activeView === 'roles';

  return (
    <div className="space-y-6">
      {/* Header with Side-by-Side Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEmployeesView ? 'Employee Management' : 'Role Management'}
          </h2>
          <p className="text-slate-600 mt-1">
            {isEmployeesView 
              ? 'Manage your restaurant staff and onboarding'
              : 'Manage roles and rates for this location'}
          </p>
        </div>

        {/* Action Buttons - Side by Side */}
        <div className="flex items-center space-x-3">
          {isEmployeesView ? (
            <>
              {/* NOTE: Add Employee button is rendered by EmployeeOnboardingSystem itself */}
              {/* We just show the Add Role button here */}
              
              {/* Add Role Button (Lighter Green) */}
              <button
                onClick={() => setActiveView('roles')}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-400 hover:bg-emerald-500 text-black font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                title="Add a new role type from your catalog"
              >
                <DollarSign className="h-5 w-5" />
                <span>Add Role</span>
              </button>
            </>
          ) : (
            <>
              {/* Back to Employees Button */}
              <button
                onClick={() => setActiveView('employees')}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all"
                title="Return to employee management"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Employees</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area - Switches based on activeView */}
      <div>
        {isEmployeesView && <EmployeeOnboardingSystem />}
        {isRolesView && <RoleManagement locationId={locationUuid} />}
      </div>
    </div>
  );
};

export default EmployeeManagementWithTabs;
