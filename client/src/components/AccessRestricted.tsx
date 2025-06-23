import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Shield, ArrowLeft, Lock } from 'lucide-react';

interface AccessRestrictedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  showBackButton?: boolean;
}

const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  title = "Access Restricted",
  message = "You don't have permission to access this page.",
  requiredRole,
  showBackButton = true
}) => {
  const [, setLocation] = useLocation();

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden">
          {/* Animated background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20" />
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
            <div className="w-full h-full rounded-full bg-red-100 dark:bg-red-900/30 animate-pulse" />
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-12 translate-y-12">
            <div className="w-full h-full rounded-full bg-orange-100 dark:bg-orange-900/30 animate-pulse delay-300" />
          </div>
          
          <CardContent className="relative p-8 text-center">
            {/* Animated icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30 animate-ping" />
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-red-500 dark:bg-red-600">
                <Shield className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>

            {/* Title with slide-in animation */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 animate-slide-up">
              {title}
            </h1>

            {/* Message with delayed slide-in */}
            <div className="space-y-3 mb-6 animate-slide-up-delay">
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              
              {requiredRole && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Required role: <span className="font-medium capitalize">{requiredRole}</span></span>
                </div>
              )}
              
              <p className="text-xs text-gray-400 dark:text-gray-500">
                If you believe this is an error, please contact your administrator.
              </p>
            </div>

            {/* Action buttons with staggered animation */}
            <div className="space-y-3 animate-slide-up-delay-2">
              {showBackButton && (
                <Button 
                  onClick={handleGoBack}
                  className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Dashboard
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/api/logout')}
                className="w-full hover:scale-105 transition-transform"
              >
                Switch Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slide-up {
            animation: slide-up 0.6s ease-out;
          }

          .animate-slide-up-delay {
            animation: slide-up 0.6s ease-out 0.2s both;
          }

          .animate-slide-up-delay-2 {
            animation: slide-up 0.6s ease-out 0.4s both;
          }
        `
      }} />
    </div>
  );
};

export default AccessRestricted;