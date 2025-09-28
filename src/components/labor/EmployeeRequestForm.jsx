import React, { useState } from 'react';
import { useLaborData } from '../contexts/LaborDataContext';
import { Calendar, Clock, Users, Edit, Send, X } from 'lucide-react';

const EmployeeRequestForm = ({ isOpen, onClose }) => {
  const { employees, submitScheduleRequest, loading } = useLaborData();
  
  const [formData, setFormData] = useState({
    request_type: 'time_off',
    requested_date: '',
    end_date: '',
    preferred_shift_start: '',
    preferred_shift_end: '',
    preferred_department: '',
    preferred_role: '',
    target_employee_id: '',
    reason: '',
    priority: 'normal'
  });

  const [errors, setErrors] = useState({});

  const requestTypes = [
    { value: 'time_off', label: 'Time Off Request', icon: Calendar, description: 'Request time off (PTO, sick, personal)' },
    { value: 'shift_preference', label: 'Shift Preference', icon: Clock, description: 'Request specific shift times or departments' },
    { value: 'shift_swap', label: 'Shift Swap', icon: Users, description: 'Trade shifts with another employee' },
    { value: 'schedule_change', label: 'Schedule Change', icon: Edit, description: 'Modify existing scheduled shift' }
  ];

  const departments = ['FOH', 'BOH', 'Bar', 'Management'];
  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requested_date) {
      newErrors.requested_date = 'Date is required';
    }

    if (formData.request_type === 'time_off' && !formData.reason) {
      newErrors.reason = 'Reason is required for time off requests';
    }

    if (formData.request_type === 'shift_preference') {
      if (!formData.preferred_shift_start || !formData.preferred_shift_end) {
        newErrors.shift_times = 'Both start and end times are required';
      }
    }

    if (formData.request_type === 'shift_swap' && !formData.target_employee_id) {
      newErrors.target_employee_id = 'Please select an employee to swap with';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Get current user's employee ID (in real app, this would come from auth)
    const currentEmployee = employees.find(emp => emp.id === '1'); // Mock for demo
    
    const requestData = {
      ...formData,
      employee_id: currentEmployee?.id,
      organization_id: crypto.randomUUID() // This would come from user context
    };

    const result = await submitScheduleRequest(requestData);
    
    if (result.success) {
      // Reset form
      setFormData({
        request_type: 'time_off',
        requested_date: '',
        end_date: '',
        preferred_shift_start: '',
        preferred_shift_end: '',
        preferred_department: '',
        preferred_role: '',
        target_employee_id: '',
        reason: '',
        priority: 'normal'
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedRequestType = requestTypes.find(type => type.value === formData.request_type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Submit Schedule Request</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requestTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      formData.request_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleInputChange('request_type', type.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        formData.request_type === type.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{type.label}</h3>
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.request_type === 'time_off' ? 'Start Date' : 'Date'}
              </label>
              <input
                type="date"
                value={formData.requested_date}
                onChange={(e) => handleInputChange('requested_date', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.requested_date ? 'border-red-500' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.requested_date && (
                <p className="text-red-500 text-xs mt-1">{errors.requested_date}</p>
              )}
            </div>

            {formData.request_type === 'time_off' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={formData.requested_date}
                />
              </div>
            )}
          </div>

          {/* Shift Preference Fields */}
          {formData.request_type === 'shift_preference' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.preferred_shift_start}
                    onChange={(e) => handleInputChange('preferred_shift_start', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shift_times ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred End Time
                  </label>
                  <input
                    type="time"
                    value={formData.preferred_shift_end}
                    onChange={(e) => handleInputChange('preferred_shift_end', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shift_times ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              {errors.shift_times && (
                <p className="text-red-500 text-xs">{errors.shift_times}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Department
                </label>
                <select
                  value={formData.preferred_department}
                  onChange={(e) => handleInputChange('preferred_department', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Shift Swap Fields */}
          {formData.request_type === 'shift_swap' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Swap With Employee
              </label>
              <select
                value={formData.target_employee_id}
                onChange={(e) => handleInputChange('target_employee_id', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.target_employee_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Employee</option>
                {employees.filter(emp => emp.id !== '1').map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </select>
              {errors.target_employee_id && (
                <p className="text-red-500 text-xs mt-1">{errors.target_employee_id}</p>
              )}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason {formData.request_type === 'time_off' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Please explain your request..."
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeRequestForm;
