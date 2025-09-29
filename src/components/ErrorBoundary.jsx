import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console for debugging
    console.error('Labor Management Error:', error, errorInfo);
    
    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-red-700 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Error Details</h3>
                  <p className="text-red-700 text-sm">
                    {this.state.error?.message || 'An unexpected error occurred in the Labor Management System'}
                  </p>
                </div>

                {isDevelopment && this.state.errorInfo && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="font-medium text-slate-800 mb-2 flex items-center">
                      <Bug className="h-4 w-4 mr-2" />
                      Debug Information
                    </h3>
                    <pre className="text-xs text-slate-600 overflow-auto max-h-40">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">What you can do:</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Try refreshing the page or clicking "Retry" below</li>
                    <li>• Check your internet connection</li>
                    <li>• If the problem persists, contact support</li>
                    <li>• Your data is safe and will be restored when the issue is resolved</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry ({this.state.retryCount + 1})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <div className="text-center text-xs text-slate-500">
                  Error ID: {Date.now().toString(36)} | 
                  Time: {new Date().toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
