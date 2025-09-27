import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, 
  Plus, Filter, Search, Mail, MessageSquare, FileText,
  CalendarDays, Users, TrendingUp
} from 'lucide-react';
import { format, parseISO, differenceInDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';
import { supabase } from '@/supabaseClient';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    outline: "bg-white text-slate-700 border-slate-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// PTO Request Form Modal
const PTORequestModal = ({ isOpen, onClose, onSubmit, employees }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    type: 'vacation', // vacation, sick, personal, emergency
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.employee_id) newErrors.employee_id = 'Employee is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      setFormData({
        employee_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        type: 'vacation',
        notes: ''
      });
    }
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
  const daysDifference = formData.start_date && formData.end_date 
    ? differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">New PTO Request</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Employee *
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select an employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="text-red-600 text-xs mt-1">{errors.employee_id}</p>
              )}
            </div>

            {/* PTO Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Day</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
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
                {errors.start_date && (
                  <p className="text-red-600 text-xs mt-1">{errors.start_date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {errors.end_date && (
                  <p className="text-red-600 text-xs mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {daysDifference > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center text-blue-700">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Duration: {daysDifference} day{daysDifference > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason *
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Brief reason for time off"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.reason && (
                <p className="text-red-600 text-xs mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information..."
                rows={3}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Submit Buttons */}
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
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// PTO Request Card
const PTORequestCard = ({ request, onApprove, onReject, onViewDetails }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'vacation':
        return 'text-blue-600';
      case 'sick':
        return 'text-red-600';
      case 'personal':
        return 'text-purple-600';
      case 'emergency':
        return 'text-orange-600';
      default:
        return 'text-slate-600';
    }
  };

  const startDate = parseISO(request.start_date);
  const endDate = parseISO(request.end_date);
  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900">{request.employee_name}</h4>
              <p className="text-sm text-slate-600">{request.employee_role || 'Employee'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(request.status)}
            {getStatusBadge(request.status)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Type:</span>
            <span className={`font-medium capitalize ${getTypeColor(request.type)}`}>
              {request.type}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Duration:</span>
            <span className="font-medium text-slate-900">{duration} day{duration > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Dates:</span>
            <span className="font-medium text-slate-900">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-1">Reason:</p>
          <p className="text-sm text-slate-900 font-medium">{request.reason}</p>
        </div>

        {request.status === 'pending' && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request.id)}
              className="border-red-300 text-red-700 hover:bg-red-50 flex-1"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {request.status !== 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(request)}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Main PTO Management System
const PTOManagementSystem = () => {
  const { employees, ptoRequests, isConnected } = useLaborData();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localPTORequests, setLocalPTORequests] = useState(ptoRequests);

  useEffect(() => {
    setLocalPTORequests(ptoRequests);
  }, [ptoRequests]);

  // Filter and search PTO requests
  const filteredRequests = localPTORequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle new PTO request submission
  const handlePTOSubmit = async (formData) => {
    try {
      const employee = employees.find(emp => emp.id === formData.employee_id);
      const newRequest = {
        id: `pto-${Date.now()}`,
        employee_id: formData.employee_id,
        employee_name: employee?.name || 'Unknown Employee',
        employee_role: employee?.role || 'Employee',
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        type: formData.type,
        notes: formData.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isConnected) {
        // Save to Supabase
        const { error } = await supabase
          .from('pto_requests')
          .insert([newRequest]);
        
        if (error) throw error;
      }

      // Update local state
      setLocalPTORequests(prev => [newRequest, ...prev]);
      setShowRequestModal(false);
      
      // Show success message (you can implement toast notifications)
      console.log('PTO request submitted successfully');
    } catch (error) {
      console.error('Error submitting PTO request:', error);
    }
  };

  // Handle PTO approval
  const handleApprove = async (requestId) => {
    try {
      if (isConnected) {
        const { error } = await supabase
          .from('pto_requests')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
        
        if (error) throw error;
      }

      setLocalPTORequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', updated_at: new Date().toISOString() }
            : req
        )
      );
    } catch (error) {
      console.error('Error approving PTO request:', error);
    }
  };

  // Handle PTO rejection
  const handleReject = async (requestId) => {
    try {
      if (isConnected) {
        const { error } = await supabase
          .from('pto_requests')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
        
        if (error) throw error;
      }

      setLocalPTORequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected', updated_at: new Date().toISOString() }
            : req
        )
      );
    } catch (error) {
      console.error('Error rejecting PTO request:', error);
    }
  };

  // Statistics
  const stats = {
    total: localPTORequests.length,
    pending: localPTORequests.filter(req => req.status === 'pending').length,
    approved: localPTORequests.filter(req => req.status === 'approved').length,
    rejected: localPTORequests.filter(req => req.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">PTO Management</h2>
          <p className="text-slate-600">Manage vacation and time-off requests</p>
        </div>
        <Button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <div className="text-sm text-slate-600">Approved</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-slate-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee or reason..."
            className="flex-1 border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* PTO Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map(request => (
          <PTORequestCard
            key={request.id}
            request={request}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={(req) => console.log('View details:', req)}
          />
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-8 text-center">
            <CalendarDays className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No PTO requests found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating a new PTO request.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                onClick={() => setShowRequestModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Request
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* PTO Request Modal */}
      <PTORequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handlePTOSubmit}
        employees={employees}
      />
    </div>
  );
};

export default PTOManagementSystem;
