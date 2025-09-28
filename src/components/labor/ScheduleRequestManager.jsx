import React, { useState, useEffect } from 'react';
import { useLaborData } from '../contexts/LaborDataContext';
import { Clock, User, Calendar, MessageSquare, Check, X, Filter } from 'lucide-react';

const ScheduleRequestManager = () => {
  const { 
    scheduleRequests, 
    updateRequestStatus, 
    loading, 
    getPendingRequestsCount,
    getRequestsByStatus 
  } = useLaborData();

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [managerNotes, setManagerNotes] = useState('');

  const filteredRequests = selectedStatus === 'all' 
    ? scheduleRequests 
    : getRequestsByStatus(selectedStatus);

  const handleApprove = async (requestId) => {
    const result = await updateRequestStatus(requestId, 'approved', managerNotes);
    if (result.success) {
      setSelectedRequest(null);
      setManagerNotes('');
    }
  };

  const handleDeny = async (requestId) => {
    const result = await updateRequestStatus(requestId, 'denied', managerNotes);
    if (result.success) {
      setSelectedRequest(null);
      setManagerNotes('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'time_off': return <Calendar className="w-4 h-4" />;
      case 'shift_preference': return <Clock className="w-4 h-4" />;
      case 'shift_swap': return <User className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              {getPendingRequestsCount()} pending requests
            </p>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No {selectedStatus === 'all' ? '' : selectedStatus} requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getRequestTypeIcon(request.request_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {request.employees?.name || request.employee_name}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 capitalize">
                      {request.request_type.replace('_', ' ')} - {formatDate(request.requested_date)}
                    </p>
                    
                    {request.reason && (
                      <p className="text-sm text-gray-500 mt-1">"{request.reason}"</p>
                    )}
                    
                    {request.manager_notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <span className="font-medium text-blue-900">Manager Notes:</span>
                        <p className="text-blue-800">{request.manager_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Review Request
              </h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Employee:</span>
                  <p className="text-sm text-gray-900">{selectedRequest.employees?.name || selectedRequest.employee_name}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <p className="text-sm text-gray-900 capitalize">{selectedRequest.request_type.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Date:</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedRequest.requested_date)}</p>
                </div>
                
                {selectedRequest.reason && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Reason:</span>
                    <p className="text-sm text-gray-900">"{selectedRequest.reason}"</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Notes (optional)
                </label>
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add notes about this decision..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setManagerNotes('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => handleDeny(selectedRequest.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center space-x-1"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  <span>Deny</span>
                </button>
                
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-1"
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRequestManager;
