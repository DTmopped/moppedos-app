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
      {/* NO HEADER - Just buttons on the right when in employees view */}
      {isEmployeesView && (
        <div className="flex justify-end">
          <div className="flex items-center space-x-3">
            {/* Add Role Button (Light Green matching brand) */}
            <button
              onClick={() => setActiveView('roles')}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg transition-all shadow-md hover:shadow-lg border-2 border-emerald-200"
              title="Add a new role type from your catalog"
            >
              <DollarSign className="h-5 w-5" />
              <span>Add Role</span>
            </button>
          </div>
        </div>
      )}

      {/* Back button when viewing roles */}
      {isRolesView && (
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setActiveView('employees')}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all"
            title="Return to employee management"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Employees</span>
          </button>
        </div>
      )}

      {/* Content Area - Switches based on activeView */}
      <div>
        {isEmployeesView && <EmployeeOnboardingSystem />}
        {isRolesView && <RoleManagement locationId={locationUuid} />}
      </div>
    </div>
  );
};

export default EmployeeManagementWithTabs;
