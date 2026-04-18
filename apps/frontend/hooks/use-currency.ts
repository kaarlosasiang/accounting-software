"use client";

import { formatCurrency, getCurrencySymbol } from "@/lib/format";

import { useOrganization } from "./use-organization";

/**
 * Hook to format currency using the company's currency setting
 */
export function useCurrency() {
  const { currency } = useOrganization();

  const formatAmount = (amount: number | undefined | null) => {
    return formatCurrency(amount, currency);
  };

  const getCurrency = () => {
    return currency || "USD";
  };

  const getSymbol = () => {
    return getCurrencySymbol(currency);
  };

  return {
    formatCurrency: formatAmount,
    currency: getCurrency(),
    symbol: getSymbol(),
  };
}
