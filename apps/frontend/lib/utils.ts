import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centralized currency formatter (Philippine Peso)
// Ensures consistent formatting across transaction-related pages.
export function formatCurrency(amount: number, options: { minimumFractionDigits?: number } = {}) {
  const { minimumFractionDigits = 2 } = options
  // Use en-PH locale for grouping; prepend symbol explicitly to keep styling flexibility.
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits, maximumFractionDigits: minimumFractionDigits })}`
}
