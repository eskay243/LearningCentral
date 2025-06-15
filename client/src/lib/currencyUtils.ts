/**
 * Currency formatting utilities for the LMS
 */

export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }
  
  // Fallback for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNaira = (amount: number): string => {
  return formatCurrency(amount, 'NGN');
};

export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and convert to number
  return parseFloat(currencyString.replace(/[₦,$\s]/g, '')) || 0;
};