import { useQuery } from "@tanstack/react-query";

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  GBP: "£"
};

// Default exchange rates (fallback values)
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1500,
  GBP: 0.79
};

// Hook to get the system currency settings
export function useCurrencySettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/settings/system", "currency"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/system?category=currency");
        if (!response.ok) throw new Error("Failed to fetch currency settings");
        
        const data = await response.json();
        return {
          defaultCurrency: data.find((s: any) => s.key === "defaultCurrency")?.value || "NGN",
          exchangeRates: JSON.parse(data.find((s: any) => s.key === "exchangeRates")?.value || 
            JSON.stringify(DEFAULT_EXCHANGE_RATES))
        };
      } catch (error) {
        console.error("Error fetching currency settings:", error);
        return {
          defaultCurrency: "NGN",
          exchangeRates: DEFAULT_EXCHANGE_RATES
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    currency: data?.defaultCurrency || "NGN",
    exchangeRates: data?.exchangeRates || DEFAULT_EXCHANGE_RATES,
    symbol: CURRENCY_SYMBOLS[data?.defaultCurrency || "NGN"] || "₦",
    isLoading
  };
}

// Format a value (in USD) to the specified currency
export function formatCurrency(
  value: number, 
  currency?: string, 
  exchangeRates?: Record<string, number>
) {
  if (!currency) currency = "NGN";
  if (!exchangeRates) exchangeRates = DEFAULT_EXCHANGE_RATES;
  
  // Default to NGN for safety
  const rate = exchangeRates[currency] || exchangeRates.NGN || 1500;
  const symbol = CURRENCY_SYMBOLS[currency] || "₦";
  
  // Convert the value from USD to the target currency
  const convertedValue = value * rate;
  
  // Format the value with appropriate decimal places
  let formattedValue: string;
  if (currency === "NGN") {
    // No decimal places for Naira
    formattedValue = Math.round(convertedValue).toLocaleString();
  } else {
    formattedValue = convertedValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  return `${symbol}${formattedValue}`;
}

// Component props for useCurrencyFormatter hook
export interface CurrencyFormatterProps {
  value: number;
}

// Hook to provide consistent currency formatting in components
export function useCurrencyFormatter() {
  const { currency, exchangeRates, symbol } = useCurrencySettings();
  
  return (value: number) => formatCurrency(value, currency, exchangeRates);
}