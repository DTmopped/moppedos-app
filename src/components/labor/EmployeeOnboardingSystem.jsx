import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, User, Mail, Phone, MapPin, Calendar, Clock, 
  DollarSign, Shield, CheckCircle, XCircle, AlertCircle,
  Save, Edit, Trash2, Eye, EyeOff, Copy, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';
import { supabase } from '@/supabaseClient';
import { ROLES, DEPARTMENTS } from '@/config/laborScheduleConfig';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Employee Onboarding Modal
const EmployeeOnboardingModal = ({ isOpen, onClose, onSubmit, editingEmployee = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    hourly_rate: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    availability: {
      monday: { available: true, start: '08:00', end: '22:00' },
      tuesday: { available: true, start: '08:00', end: '22:00' },
      wednesday: { available: true, start: '08:00', end: '22:00' },
      thursday: { available: true, start: '08:00', end: '22:00' },
      friday: { available: true, start: '08:00', end: '22:00' },
      saturday: { available: true, start: '08:00', end: '22:00' },
      sunday: { available: true, start: '08:00', end: '22:00' }
    },
    notes: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showAvailability, setShowAvailability] = useState(false);

  // Initialize form with editing data
  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        ...editingEmployee,
        availability: editingEmployee.availability || formData.availability
      });
    } else {
      // Reset form for new employee
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        hourly_rate: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        availability: {
          monday: { available: true, start: '08:00', end: '22:00' },
          tuesday: { available: true, start: '08:00', end: '22:00' },
          wednesday: { available: true, start: '08:00', end: '22:00' },
          thursday: { available: true, start: '08:00', end: '22:00' },
          friday: { available: true, start: '08:00', end: '22:00' },
          saturday: { available: true, start: '08:00', end: '22:00' },
          sunday: { available: true, start: '08:00', end: '22:00' }
        },
        notes: '',
        is_active: true
      });
    }
  }, [editingEmployee, isOpen]);

  // Auto-fill department when role is selected
  useEffect(() => {
    if (formData.role) {
      const selectedRole = ROLES.find(role => role.name === formData.role);
      if (selectedRole) {
        setFormData(prev => ({
          ...prev,
          department: selectedRole.department,
          hourly_rate: selectedRole.hourly_rate.toString()
        }));
      }
    }
  }, [formData.role]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.role) newErrors.role = 'Role is required';
    }

    if (step === 2) {
      if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
        newErrors.hourly_rate = 'Valid hourly rate is required';
      }
      if (!formData.start_date) newErrors.start_date = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      onSubmit(formData);
      setCurrentStep(1);
      setErrors({});
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const copyAvailabilityToAll = (sourceDay) => {
    const sourceAvailability = formData.availability[sourceDay];
    const newAvailability = {};
    
    Object.keys(formData.availability).forEach(day => {
      newAvailability[day] = { ...sourceAvailability };
    });
    
    setFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  if (!isOpen) return null;

  const selectedRole = ROLES.find(role => role.name === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {editingEmployee ? 'Edit Employee' : 'New Employee Onboarding'}
              </h3>
              <p className="text-sm text-slate-600">
                Step {currentStep} of 3 - {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Employment Details' :
                  'Availability & Notes'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
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
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a role</option>
                      {ROLES.map(role => (
                        <option key={role.name} value={role.name}>
                          {role.name} - {role.department}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                {selectedRole && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center text-blue-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Role: {selectedRole.name} | Department: {selectedRole.department} | 
                        Suggested Rate: ${selectedRole.hourly_rate}/hr
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Employment Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hourly Rate *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                        className="w-full pl-10 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="15.00"
                      />
                    </div>
                    {errors.hourly_rate && <p className="text-red-600 text-xs mt-1">{errors.hourly_rate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.start_date && <p className="text-red-600 text-xs mt-1">{errors.start_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Active employee (can be scheduled)
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Availability & Notes */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Weekly Availability</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAvailability(!showAvailability)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    {showAvailability ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showAvailability ? 'Hide' : 'Show'} Availability
                  </Button>
                </div>

                {showAvailability && (
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    {Object.entries(formData.availability).map(([day, dayData]) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-20">
                          <span className="text-sm font-medium text-slate-700 capitalize">{day}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={dayData.available}
                            onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600">Available</span>
                        </div>
                        {dayData.available && (
                          <>
                            <input
                              type="time"
                              value={dayData.start}
                              onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                              className="border border-slate-300 rounded px-2 py-1 text-sm"
                            />
                            <span className="text-slate-600">to</span>
                            <input
                              type="time"
                              value={dayData.end}
                              onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                              className="border border-slate-300 rounded px-2 py-1 text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyAvailabilityToAll(day)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Any additional information about the employee, special requirements, certifications, etc."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingEmployee ? 'Update Employee' : 'Add Employee'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Employee Card Component
const EmployeeCard = ({ employee, onEdit, onDelete, onToggleActive }) => {
  const getDepartmentColor = (department) => {
    const colors = {
      FOH: 'bg-blue-50 text-blue-700 border-blue-200',
      BOH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Bar: 'bg-purple-50 text-purple-700 border-purple-200',
      Management: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return colors[department] || colors.FOH;
  };

  return (
    <Card className={`border-slate-200 shadow-sm transition-all ${
      employee.is_active ? 'bg-white' : 'bg-slate-50 opacity-75'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900">{employee.name}</h4>
              <p className="text-sm text-slate-600">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={employee.is_active ? "success" : "secondary"}>
              {employee.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge className={getDepartmentColor(employee.department)}>
              {employee.department}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <Mail className="h-3 w-3 mr-2" />
            {employee.email}
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Phone className="h-3 w-3 mr-2" />
            {employee.phone}
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <DollarSign className="h-3 w-3 mr-2" />
            ${employee.hourly_rate}/hour
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="h-3 w-3 mr-2" />
            Started {format(new Date(employee.start_date), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(employee)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleActive(employee.id, !employee.is_active)}
            className={`border-slate-300 flex-1 ${
              employee.is_active 
                ? 'text-amber-700 hover:bg-amber-50' 
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {employee.is_active ? (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(employee.id)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Employee Onboarding System
const EmployeeOnboardingSystem = () => {
  const { employees, isConnected } = useLaborData();
  const [localEmployees, setLocalEmployees] = useState(employees);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // Filter employees
  const filteredEmployees = localEmployees.filter(employee => {
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && employee.is_active) ||
      (filterStatus === 'inactive' && !employee.is_active);
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesStatus && matchesSearch;
  });

  // Handle employee submission
  const handleEmployeeSubmit = async (formData) => {
    try {
      const employeeData = {
        ...formData,
        id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
        created_at: editingEmployee ? editingEmployee.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isConnected) {
        if (editingEmployee) {
          // Update existing employee
          const { error } = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', editingEmployee.id);
          
          if (error) throw error;
        } else {
          // Create new employee
          const { error } = await supabase
            .from('employees')
            .insert([employeeData]);
          
          if (error) throw error;
        }
      }

      // Update local state
      if (editingEmployee) {
        setLocalEmployees(prev => 
          prev.map(emp => emp.id === editingEmployee.id ? employeeData : emp)
        );
      } else {
        setLocalEmployees(prev => [employeeData, ...prev]);
      }

      setShowOnboardingModal(false);
      setEditingEmployee(null);
      
      console.log('Employee saved successfully');
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  // Handle employee edit
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowOnboardingModal(true);
  };

  // Handle employee delete
  const handleDelete = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      if (isConnected) {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);
        
        if (error) throw error;
      }

      setLocalEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      console.log('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (employeeId, newStatus) => {
    try {
      if (isConnected) {
        const { error } = await supabase
          .from('employees')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', employeeId);
        
        if (error) throw error;
      }

      setLocalEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeId 
            ? { ...emp, is_active: newStatus, updated_at: new Date().toISOString() }
            : emp
        )
      );
    } catch (error) {
      console.error('Error updating employee status:', error);
    }
  };

  // Statistics
  const stats = {
    total: localEmployees.length,
    active: localEmployees.filter(emp => emp.is_active).length,
    inactive: localEmployees.filter(emp => !emp.is_active).length,
    departments: Object.keys(DEPARTMENTS).reduce((acc, dept) => {
      acc[dept] = localEmployees.filter(emp => emp.department === dept && emp.is_active).length;
      return acc;
    }, {})
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Management</h2>
          <p className="text-slate-600">Onboard and manage your team members</p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployee(null);
            setShowOnboardingModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Employees</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            <div className="text-sm text-slate-600">Active</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-600">{stats.inactive}</div>
            <div className="text-sm text-slate-600">Inactive</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(stats.departments).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-slate-600">Active by Dept</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          {Object.keys(DEPARTMENTS).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search employees..."
          className="flex-1 max-w-sm border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-8 text-center">
            <UserPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first team member.'}
            </p>
            {!searchTerm && filterDepartment === 'all' && filterStatus === 'all' && (
              <Button
                onClick={() => {
                  setEditingEmployee(null);
                  setShowOnboardingModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Onboarding Modal */}
      <EmployeeOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleEmployeeSubmit}
        editingEmployee={editingEmployee}
      />
    </div>
  );
};

export default EmployeeOnboardingSystem;
