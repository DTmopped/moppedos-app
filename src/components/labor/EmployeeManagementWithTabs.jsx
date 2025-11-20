import React, { useState } from 'react';
import { Users, DollarSign, ArrowLeft, Plus } from 'lucide-react';
import EmployeeOnboardingSystem from '@/components/labor/EmployeeOnboardingSystem';
import RoleManagement from '@/components/settings/RoleManagement';
import { useLaborData } from '@/contexts/LaborDataContext';

/**
 * FINAL Simplified Employee Management
 * - BOTH buttons side-by-side in wrapper
 * - Pass showAddButton={false} to child components
 * - Clean, simple interface
 */

const EmployeeManagementWithTabs = () => {
  const [activeView, setActiveView] = useState('employees'); // 'employees' or 'roles'
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const { locationUuid, loadRoles } = useLaborData(); // ✅ NEW: Get loadRoles

  const isEmployeesView = activeView === 'employees';
  const isRolesView = activeView === 'roles';

  return (
    <div className="space-y-6">
      {/* Buttons - Side by Side when in employees view */}
      {isEmployeesView && (
        <div className="flex justify-end items-center space-x-3">
          {/* Add Employee Button (Blue) */}
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            title="Hire a new team member"
          >
            <Plus className="h-5 w-5" />
            <span>Add Employee</span>
          </button>

          {/* Add Role Button (Light Green) */}
          <button
            onClick={() => setActiveView('roles')}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg transition-all shadow-md hover:shadow-lg border-2 border-emerald-200"
            title="Add a new role type from your catalog"
          >
            <DollarSign className="h-5 w-5" />
            <span>Add Role</span>
          </button>
        </div>
      )}

      {/* Back button when viewing roles */}
      {isRolesView && (
        <div className="flex justify-start">
          <button
            onClick={() => {
              setActiveView('employees');
              loadRoles(); // ✅ NEW: Refresh roles when returning to employees
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all"
            title="Return to employee management"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Employees</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div>
        {isEmployeesView && (
          <EmployeeOnboardingSystem 
            showAddButton={false}
            externalAddEmployeeModal={showAddEmployeeModal}
            setExternalAddEmployeeModal={setShowAddEmployeeModal}
          />
        )}
        {isRolesView && (
          <RoleManagement 
            locationId={locationUuid}
            lightGreenButton={true}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeManagementWithTabs;

