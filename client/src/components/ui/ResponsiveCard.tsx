import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const ResponsiveCard = ({
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  children,
  footer,
  onClick,
  hoverable = false,
}: ResponsiveCardProps) => {
  return (
    <Card
      className={cn(
        "w-full border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200",
        hoverable && "hover:shadow-md dark:hover:shadow-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className={cn("px-4 sm:px-6 py-4 sm:py-5", headerClassName)}>
          {title && (
            typeof title === 'string' ? (
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</CardTitle>
            ) : (
              title
            )
          )}
          {description && (
            typeof description === 'string' ? (
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</CardDescription>
            ) : (
              description
            )
          )}
        </CardHeader>
      )}
      <CardContent className={cn("px-4 sm:px-6 py-3 sm:py-4", !title && !description && "pt-5", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn("px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};