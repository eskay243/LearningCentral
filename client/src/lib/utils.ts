import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, includeTime = false): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return includeTime 
      ? `Today, ${format(dateObj, "h:mm a")}`
      : "Today";
  }
  
  if (isTomorrow(dateObj)) {
    return includeTime 
      ? `Tomorrow, ${format(dateObj, "h:mm a")}`
      : "Tomorrow";
  }
  
  return includeTime 
    ? format(dateObj, "MMM d, yyyy, h:mm a")
    : format(dateObj, "MMM d, yyyy");
}

export function formatTimeFromNow(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function getInitials(name: string): string {
  if (!name) return "?";
  
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDuration(durationInSeconds: number): string {
  if (!durationInSeconds) return "N/A";
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes} minutes`;
}

export function getColorClass(index: number) {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-purple-100 text-purple-600",
    "bg-red-100 text-red-600",
    "bg-yellow-100 text-yellow-600",
    "bg-indigo-100 text-indigo-600",
    "bg-pink-100 text-pink-600",
  ];
  
  return colors[index % colors.length] || colors[0];
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getFullName(user?: { firstName?: string; lastName?: string }): string {
  if (!user) return "";
  
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  
  if (!firstName && !lastName) return "Anonymous User";
  
  return `${firstName} ${lastName}`.trim();
}

export function truncateText(text: string, maxLength = 100): string {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + "...";
}
