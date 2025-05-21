/**
 * Currency formatting utilities for consistent display across the application
 */
import { useState, useCallback } from 'react';

type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€'
};

const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  NGN: 0,  // Nigerian Naira typically shown without decimals
  USD: 2,
  GBP: 2,
  EUR: 2
};

/**
 * Format a number as currency with the appropriate symbol and formatting
 * 
 * @param amount The amount to format
 * @param currencyCode The currency code (NGN, USD, GBP, EUR)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'NGN',
  options?: {
    showCurrencyCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  }
): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || '₦';
  const decimals = options?.maximumFractionDigits ?? CURRENCY_DECIMALS[currencyCode] ?? 2;
  const minDecimals = options?.minimumFractionDigits ?? (currencyCode === 'NGN' ? 0 : 2);

  // Use compact notation for large numbers if requested
  const formattedAmount = options?.compact && amount >= 1000
    ? new Intl.NumberFormat('en', {
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(amount)
    : new Intl.NumberFormat('en', {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: decimals
      }).format(amount);

  return options?.showCurrencyCode
    ? `${symbol}${formattedAmount} ${currencyCode}`
    : `${symbol}${formattedAmount}`;
}

/**
 * Convert an amount from one currency to another using the provided exchange rate
 * 
 * @param amount The amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param exchangeRates Exchange rate object
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const exchangeKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[exchangeKey];
  
  if (!rate) {
    console.warn(`Exchange rate for ${exchangeKey} not found`);
    return amount;
  }
  
  return amount * rate;
}

/**
 * Parse a currency string back into a number
 * 
 * @param currencyString The formatted currency string
 * @returns Numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and non-numeric characters except decimal point
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
}

/**
 * Get a discount percentage text
 * 
 * @param originalPrice Original price
 * @param discountedPrice Discounted price
 * @returns Formatted discount percentage string
 */
export function getDiscountPercentage(originalPrice: number, discountedPrice: number): string {
  if (originalPrice <= 0 || discountedPrice >= originalPrice) return '';
  
  const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  return `-${discountPercent}%`;
}

/**
 * React hook for currency formatting with state management of currency preferences
 * 
 * @returns A function to format currency values with current preferences
 */
export function useCurrencyFormatter() {
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  
  const formatter = useCallback((
    amount: number, 
    options?: {
      showCurrencyCode?: boolean;
      currencyOverride?: CurrencyCode;
      compact?: boolean;
    }
  ) => {
    return formatCurrency(
      amount,
      options?.currencyOverride || currency,
      {
        showCurrencyCode: options?.showCurrencyCode,
        compact: options?.compact
      }
    );
  }, [currency]);
  
  return formatter;
}