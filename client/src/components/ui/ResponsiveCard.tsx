import React from 'react';
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
  hoverable = false
}: ResponsiveCardProps) => {
  const cardClasses = cn(
    'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm',
    hoverable && 'transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600',
    onClick && 'cursor-pointer',
    className
  );

  const headerClasses = cn(
    'px-4 py-3 border-b border-gray-100 dark:border-gray-700',
    headerClassName
  );

  const contentClasses = cn(
    'p-4',
    contentClassName
  );

  const footerClasses = cn(
    'px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
    footerClassName
  );

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || description) && (
        <div className={headerClasses}>
          {title && (
            typeof title === 'string' 
              ? <h3 className="text-base font-medium text-gray-900 dark:text-white">{title}</h3>
              : title
          )}
          {description && (
            typeof description === 'string'
              ? <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
              : description
          )}
        </div>
      )}
      
      {children && (
        <div className={contentClasses}>
          {children}
        </div>
      )}
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );
};