import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  showHomeButton?: boolean;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class EnhancedErrorBoundary extends React.Component<EnhancedErrorBoundaryProps, ErrorState> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {this.props.title || 'Something went wrong'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                {this.state.error?.message || 'An unexpected error occurred while loading this content.'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-red-500 dark:text-red-400">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {this.props.showHomeButton && (
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Wrapper for specific page sections
export function PageErrorBoundary({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <EnhancedErrorBoundary title={title} showHomeButton={true}>
      {children}
    </EnhancedErrorBoundary>
  );
}

// Wrapper for smaller components
export function ComponentErrorBoundary({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <EnhancedErrorBoundary title={title} showHomeButton={false}>
      {children}
    </EnhancedErrorBoundary>
  );
}