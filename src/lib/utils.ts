import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Money helpers: operate in paise/cents to avoid floating precision issues
export type MoneyCents = number; // integer

export function toCents(value: string | number | null | undefined): MoneyCents {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  if (!isFinite(n)) return 0;
  // Round to 2 decimals then convert to integer cents
  return Math.round(Math.round(n * 100) + 0);
}

export function fromCents(cents: MoneyCents): number {
  if (!isFinite(cents as number)) return 0;
  return (cents as number) / 100;
}

export function addCents(...values: MoneyCents[]): MoneyCents {
  return values.reduce((sum, v) => sum + (isFinite(v) ? v : 0), 0);
}

export function clampMin(min: MoneyCents, value: MoneyCents): MoneyCents {
  return value < min ? min : value;
}

export function formatINR(cents: MoneyCents): string {
  return fromCents(cents).toFixed(2);
}

export function safeSubtract(a: MoneyCents, b: MoneyCents): MoneyCents {
  return a - b;
}

export function computeTotals(params: {
  previousBalance: MoneyCents;
  itemsTotal: MoneyCents;
  deliveryCharge: MoneyCents;
  cleaningCharge: MoneyCents;
  paidAmount: MoneyCents;
}): {
  totalAmount: MoneyCents; // Previous + Items + Charges
  newBalance: MoneyCents; // max(total - paid, 0)
  advanceAmount: MoneyCents; // max(paid - total, 0)
  transactionAmount: MoneyCents; // Items + Charges (exclude previous balance)
} {
  const charges = addCents(params.deliveryCharge, params.cleaningCharge);
  const transactionAmount = addCents(params.itemsTotal, charges);
  const totalAmount = addCents(params.previousBalance, transactionAmount);
  const diff = safeSubtract(totalAmount, params.paidAmount);
  const newBalance = clampMin(0, diff);
  const overpay = safeSubtract(params.paidAmount, totalAmount);
  const advanceAmount = overpay > 0 ? overpay : 0;
  return { totalAmount, newBalance, advanceAmount, transactionAmount };
}
