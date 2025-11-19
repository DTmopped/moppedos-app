import React, { useState } from 'react';
import { Users, DollarSign } from 'lucide-react';
import EmployeeOnboardingSystem from '@/components/labor/EmployeeOnboardingSystem';
import RoleManagement from '@/components/settings/RoleManagement';
import { useLaborData } from '@/contexts/LaborDataContext';

/**
 * Employee Management with Sub-tabs
 * Contains: Employees (onboarding) and Roles & Rates (role management)
 */

const EmployeeManagementWithTabs = () => {
  const [activeSubTab, setActiveSubTab] = useState('employees');
  const { locationUuid } = useLaborData();

  const subTabs = [
    { 
      id: 'employees', 
      label: 'Employees', 
      icon: Users,
      description: 'Manage staff and onboarding'
    },
    { 
      id: 'roles', 
      label: 'Roles & Rates', 
      icon: DollarSign,
      description: 'Manage roles, rates, and assignments'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className="bg-white border-b border-slate-200 rounded-lg shadow-sm">
        <div className="flex space-x-1 p-2">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={tab.description}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
