import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, Users, Plus, Search, Filter, Edit, Trash2, Eye,
  Mail, Phone, Calendar, MapPin, Star, Clock, DollarSign,
  CheckCircle, XCircle, AlertCircle, UserPlus, Download,
  Upload, Settings, MoreVertical
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-slate-50 text-slate-600 border-slate-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Employee Statistics Component
const EmployeeStatistics = ({ employees }) => {
  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    avgHourlyRate: employees.reduce((sum, emp) => sum + (emp.hourly_rate || 15), 0) / employees.length,
    avgPerformance: employees.reduce((sum, emp) => sum + (emp.performance_rating || 4), 0) / employees.length,
    retentionRate: 92 // This would be calculated from actual data
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-blue-600 rounded-full">
              <Users className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">Total Employees</div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-emerald-600 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.active}</div>
          <div className="text-sm text-emerald-700">Active Staff</div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-purple-600 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">${stats.avgHourlyRate.toFixed(2)}</div>
          <div className="text-sm text-purple-700">Avg Hourly Rate</div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-orange-600 rounded-full">
              <Star className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.avgPerformance.toFixed(1)}/5</div>
          <div className="text-sm text-orange-700">Avg Performance</div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-green-600 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.retentionRate}%</div>
          <div className="text-sm text-green-700">Retention Rate</div>
        </CardContent>
      </Card>
    </div>
  );
};

// Department Breakdown
const DepartmentBreakdown = ({ employees }) => {
  const departments = {
    'Front of House': { count: 0, color: 'bg-blue-500' },
    'Back of House': { count: 0, color: 'bg-emerald-500' },
    'Bar & Beverage': { count: 0, color: 'bg-purple-500' },
    'Management': { count: 0, color: 'bg-orange-500' }
  };

  employees.forEach(emp => {
    if (departments[emp.department]) {
      departments[emp.department].count++;
    }
  });

  return (
    <Card className="border-slate-200 bg-white mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <Users className="h-5 w-5 mr-2" />
          Department Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(departments).map(([dept, data]) => (
            <div key={dept} className="text-center">
              <div className={`w-12 h-12 ${data.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-slate-900 text-sm mb-1">{dept}</h4>
              <div className="text-2xl font-bold text-slate-900">{data.count}</div>
              <div className="text-xs text-slate-600">employees</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Add Employee Modal
const AddEmployeeModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    hourly_rate: '',
    hire_date: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  const roles = [
    'Server', 'Bartender', 'Host/Hostess', 'Busser', 'Food Runner',
    'Meat Portioner', 'Prep Cook', 'Line Cook', 'Dishwasher', 'Expo',
    'Kitchen Manager', 'Assistant Manager', 'General Manager'
  ];

  const departments = [
    'Front of House', 'Back of House', 'Bar & Beverage', 'Management'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.hourly_rate) newErrors.hourly_rate = 'Hourly rate is required';
    if (!formData.hire_date) newErrors.hire_date = 'Hire date is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        performance_rating: 4.0 // Default rating for new employees
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourly_rate: '',
        hire_date: '',
        status: 'active'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Employee</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="John Smith"
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="john.smith@moppedrestaurant.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-600 text-xs mt-1">{errors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-600 text-xs mt-1">{errors.department}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hourly Rate *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="15.00"
                />
                {errors.hourly_rate && (
                  <p className="text-red-600 text-xs mt-1">{errors.hourly_rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hire Date *
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {errors.hire_date && (
                  <p className="text-red-600 text-xs mt-1">{errors.hire_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Employee
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Employee Card Component
const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="active">Active</Badge>;
      case 'inactive':
        return <Badge variant="inactive">Inactive</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDepartmentColor = (department) => {
    switch (department) {
      case 'Front of House': return 'bg-blue-500';
      case 'Back of House': return 'bg-emerald-500';
      case 'Bar & Beverage': return 'bg-purple-500';
      case 'Management': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 fill-yellow-200 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-3 w-3 text-slate-300" />);
    }
    return stars;
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 ${getDepartmentColor(employee.department)} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
              {getInitials(employee.name)}
            </div>
            <div>
              <h4 className="font-medium text-slate-900">{employee.name}</h4>
              <p className="text-sm text-slate-600">{employee.role}</p>
              <Badge variant="secondary" className="mt-1">{employee.department}</Badge>
            </div>
          </div>
          {getStatusBadge(employee.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Hire Date:</span>
            <span className="font-medium text-slate-900">
              {employee.hire_date ? format(new Date(employee.hire_date), 'MMM d, yyyy') : 'Jan 1, 2024'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Hourly Rate:</span>
            <span className="font-medium text-slate-900">${employee.hourly_rate || 15}/hr</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Performance:</span>
            <div className="flex items-center space-x-1">
              {renderStars(employee.performance_rating || 4)}
              <span className="text-xs text-slate-500 ml-1">
                {(employee.performance_rating || 4).toFixed(1)}/5
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(employee)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            onClick={() => onEdit(employee)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Employee Onboarding System Component
const EmployeeOnboardingSystem = ({
  showAddButton = true,  // NEW PROP
  externalAddEmployeeModal = false,  // NEW PROP
  setExternalAddEmployeeModal = null  // NEW PROP
}) => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    loading 
  } = useLaborData();
// Use external modal state if provided, otherwise use internal
  const [internalShowModal, setInternalShowModal] = useState(false);
  const showAddModal = externalAddEmployeeModal !== false ? externalAddEmployeeModal : internalShowModal;
  const setShowAddModal = setExternalAddEmployeeModal || setInternalShowModal;
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAddEmployee = async (employeeData) => {
    const result = await addEmployee(employeeData);
    if (result.success) {
      setShowAddModal(false);
    }
  };

  const handleViewEmployee = (employee) => {
    console.log('View employee:', employee);
    // Implement view employee details modal
  };

  const handleEditEmployee = (employee) => {
    console.log('Edit employee:', employee);
    // Implement edit employee modal
  };

  const handleDeleteEmployee = (employee) => {
    console.log('Delete employee:', employee);
    // Implement delete confirmation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Management</h2>
          <p className="text-slate-600">Manage your restaurant staff and onboarding</p>
        </div>
        {showAddButton && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Statistics */}
      <EmployeeStatistics employees={employees} />

      {/* Department Breakdown */}
      <DepartmentBreakdown employees={employees} />

      {/* Filters and Search */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Front of House">Front of House</option>
                <option value="Back of House">Back of House</option>
                <option value="Bar & Beverage">Bar & Beverage</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div className="sm:w-32">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onView={handleViewEmployee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
            />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No employees have been added yet.'}
            </p>
            {!searchTerm && departmentFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
      />
    </div>
  );
};

export default EmployeeOnboardingSystem;
