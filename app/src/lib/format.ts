// Pure formatting (api-contract.md, lib/format.ts). No DOM, no React.
import type { BasisPoints, Cents } from '../types';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const COUNT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** "$1,234.56". Intl rounds to the currency's two fraction digits, so cents / 100 is exact enough here. */
export function formatMoney(cents: Cents): string {
  return MONEY.format(cents / 100);
}

/** "2¢" under a dollar, otherwise currency ("$1.25"). */
export function formatOverage(cents: Cents): string {
  return cents < 100 ? `${cents}¢` : formatMoney(cents);
}

/** "1,500". */
export function formatCount(n: number): string {
  return COUNT.format(n);
}

/** Splits an integer in hundredths into its whole part and its two-digit remainder. */
function splitHundredths(n: number): { whole: number; hundredths: number } {
  const hundredths = n % 100;
  return { whole: (n - hundredths) / 100, hundredths };
}

/** Canonical field and URL text for a bill: "100" for whole dollars, otherwise "86.40". No "$", no grouping. */
export function formatBillText(cents: Cents): string {
  const { whole, hundredths } = splitHundredths(cents);
  return hundredths === 0 ? String(whole) : `${whole}.${String(hundredths).padStart(2, '0')}`;
}

/** Canonical field and URL text for a percent: 2000 -> "20", 1750 -> "17.5", 1725 -> "17.25". */
export function formatPercentText(bp: BasisPoints): string {
  const { whole, hundredths } = splitHundredths(bp);
  if (hundredths === 0) return String(whole);
  const frac = String(hundredths).padStart(2, '0').replace(/0$/, '');
  return `${whole}.${frac}`;
}
