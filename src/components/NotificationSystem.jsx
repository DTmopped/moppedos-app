import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Component
const Notification = ({ notification, onClose }) => {
  const { id, type, title, message, duration } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`${getStyles()} border rounded-lg p-4 shadow-lg max-w-md w-full transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium text-sm mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Container
const NotificationContainer = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000, // 5 seconds default
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (message, title = 'Success', duration = 4000) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const showError = (message, title = 'Error', duration = 6000) => {
    return addNotification({ type: 'error', title, message, duration });
  };

  const showWarning = (message, title = 'Warning', duration = 5000) => {
    return addNotification({ type: 'warning', title, message, duration });
  };

  const showInfo = (message, title = 'Info', duration = 4000) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
