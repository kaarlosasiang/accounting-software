// Map company currency codes to ISO 4217 currency codes
const CURRENCY_MAP: Record<string, string> = {
  PESO: "PHP",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  JPY: "JPY",
  SGD: "SGD",
};

// Map currency codes to their symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  SGD: "S$",
};

// Map currency codes to their locales
const CURRENCY_LOCALES: Record<string, string> = {
  PHP: "en-PH",
  USD: "en-US",
  EUR: "en-GB",
  GBP: "en-GB",
  JPY: "ja-JP",
  SGD: "en-SG",
};

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}

export function formatCurrency(
  amount: number | undefined | null,
  currencyCode?: string,
) {
  if (amount === undefined || amount === null) return "$0.00";

  // Map company currency to ISO currency code
  const mappedCurrency = currencyCode
    ? CURRENCY_MAP[currencyCode] || currencyCode
    : "USD";
  const locale = CURRENCY_LOCALES[mappedCurrency] || "en-US";
  const symbol = CURRENCY_SYMBOLS[mappedCurrency] || "$";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: mappedCurrency,
    }).format(amount);
  } catch (_err) {
    // Fallback to manual formatting
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return "$";
  const mappedCurrency = CURRENCY_MAP[currencyCode] || currencyCode;
  return CURRENCY_SYMBOLS[mappedCurrency] || "$";
}
