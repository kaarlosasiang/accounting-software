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
  currency: string = "USD",
  locale: string = "en-US",
) {
  if (amount === undefined || amount === null) return "$0.00";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch (_err) {
    return `$${amount.toFixed(2)}`;
  }
}
