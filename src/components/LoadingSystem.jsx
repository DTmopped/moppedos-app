import React, { createContext, useContext, useState } from 'react';
import { RefreshCw, Loader2, Clock, Zap } from 'lucide-react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 ${className}`} />
  );
};

// Loading Button Component
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...', 
  icon: Icon,
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${props.className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {children}
        </>
      )}
    </button>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  show, 
  message = 'Loading...', 
  description,
  type = 'default'
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'saving':
        return <Clock className="h-8 w-8 text-blue-600 animate-pulse" />;
      case 'processing':
        return <Zap className="h-8 w-8 text-amber-600 animate-bounce" />;
      case 'loading':
      default:
        return <LoadingSpinner size="xl" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {message}
        </h3>
        {description && (
          <p className="text-sm text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Skeleton Loader Component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  showAvatar = false 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            {index === lines - 1 && (
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Card Component
export const LoadingCard = ({ 
  title = 'Loading...', 
  description,
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <LoadingSpinner size="md" />
        <div>
          <h3 className="font-medium text-slate-900">{title}</h3>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
      </div>
      
      {showProgress && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Loading Provider
export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const setLoading = (key, loading, message = 'Loading...') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading ? { loading: true, message } : undefined
    }));
  };

  const isLoading = (key) => {
    return loadingStates[key]?.loading || false;
  };

  const getLoadingMessage = (key) => {
    return loadingStates[key]?.message || 'Loading...';
  };

  const setGlobalLoadingState = (loading, message = 'Loading...', description) => {
    setGlobalLoading(loading ? { loading: true, message, description } : false);
  };

  const contextValue = {
    setLoading,
    isLoading,
    getLoadingMessage,
    setGlobalLoadingState,
    globalLoading
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <LoadingOverlay
        show={!!globalLoading}
        message={globalLoading?.message}
        description={globalLoading?.description}
      />
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;
