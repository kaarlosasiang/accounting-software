/**
 * Money helpers.
 *
 * Amounts are stored as JS numbers. Every computed amount must be rounded to
 * cents at the point it is produced, otherwise binary floating-point noise
 * (e.g. 0.1 + 0.2 = 0.30000000000000004) leaks into totals, balances and
 * debit/credit equality checks.
 */

/** Two amounts closer than this are considered equal (half a cent). */
export const MONEY_TOLERANCE = 0.005;

/** Round to 2 decimal places (half away from zero). */
export const round2 = (value: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round((Math.abs(n) + Number.EPSILON) * 100)) / 100;
};

/** Parse a number or numeric string (legacy ledger values) into cents-rounded money. */
export const toMoney = (value: unknown): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? round2(n) : 0;
};

/** Sum amounts, rounding the result to cents. */
export const sumMoney = (values: Array<number | undefined | null>): number =>
  round2(values.reduce<number>((sum, v) => sum + (Number(v) || 0), 0));

/** True when two amounts are equal to the cent. */
export const moneyEquals = (a: number, b: number): boolean =>
  Math.abs(round2(a) - round2(b)) < MONEY_TOLERANCE;
