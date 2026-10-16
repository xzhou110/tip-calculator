// Test data only (imported by *.test.ts, never by the app): api-contract.md § Golden Cases, the Split
// table and the Parse table's comma rows (amended 2026-10-16, R-5).
import type { FieldTexts, SplitKind } from '../types';

/** parseBill with commas: thousands groups of exactly three digits are valid (value in cents). */
export const GOLDEN_BILL_GROUPED: readonly (readonly [string, number])[] = [
  ['$1,234.56', 123456],
  ['1,000.5', 100050],
  ['$12,345,678.90', 1234567890],
];

/** parseBill with a comma that is not a thousands group: invalid malformed, never a 100x bill. */
export const GOLDEN_BILL_BAD_COMMAS: readonly string[] = ['86,40', '1,00', '12,345,67', ',5', '1,,000', '1234,567'];

export interface GoldenSplit {
  readonly fields: FieldTexts;
  readonly tipCents: number;
  readonly totalCents: number;
  readonly shareCents: number;
  readonly collectedCents: number;
  readonly overageCents: number;
  readonly kind: SplitKind;
  /** The status line as one sentence (lead + strong + tail). */
  readonly status: string;
  /** The bold part of a rounded-up status line, '' otherwise. */
  readonly strong: string;
}

const X = '×';
const CENT = '¢';

export const GOLDEN_SPLITS: readonly GoldenSplit[] = [
  { fields: { bill: '86.40', tip: '20', people: '4' }, tipCents: 1728, totalCents: 10368, shareCents: 2592, collectedCents: 10368, overageCents: 0, kind: 'even', status: `Splits evenly: 4 ${X} $25.92 = $103.68.`, strong: '' },
  { fields: { bill: '86.40', tip: '20', people: '2' }, tipCents: 1728, totalCents: 10368, shareCents: 5184, collectedCents: 10368, overageCents: 0, kind: 'even', status: `Splits evenly: 2 ${X} $51.84 = $103.68.`, strong: '' },
  { fields: { bill: '86.40', tip: '20', people: '3' }, tipCents: 1728, totalCents: 10368, shareCents: 3456, collectedCents: 10368, overageCents: 0, kind: 'even', status: `Splits evenly: 3 ${X} $34.56 = $103.68.`, strong: '' },
  { fields: { bill: '100', tip: '18', people: '3' }, tipCents: 1800, totalCents: 11800, shareCents: 3934, collectedCents: 11802, overageCents: 2, kind: 'roundedUp', status: `Rounded up to the cent: 3 ${X} $39.34 = $118.02, 2${CENT} over the Total.`, strong: `2${CENT} over the Total` },
  { fields: { bill: '50', tip: '20', people: '1' }, tipCents: 1000, totalCents: 6000, shareCents: 6000, collectedCents: 6000, overageCents: 0, kind: 'one', status: 'One person pays the full Total.', strong: '' },
  { fields: { bill: '0', tip: '20', people: '2' }, tipCents: 0, totalCents: 0, shareCents: 0, collectedCents: 0, overageCents: 0, kind: 'even', status: `Splits evenly: 2 ${X} $0.00 = $0.00.`, strong: '' },
  { fields: { bill: '120.25', tip: '0', people: '150' }, tipCents: 0, totalCents: 12025, shareCents: 81, collectedCents: 12150, overageCents: 125, kind: 'roundedUp', status: `Rounded up to the cent: 150 ${X} $0.81 = $121.50, $1.25 over the Total.`, strong: '$1.25 over the Total' },
  { fields: { bill: '0.01', tip: '0', people: '3' }, tipCents: 0, totalCents: 1, shareCents: 1, collectedCents: 3, overageCents: 2, kind: 'roundedUp', status: `Rounded up to the cent: 3 ${X} $0.01 = $0.03, 2${CENT} over the Total.`, strong: `2${CENT} over the Total` },
  { fields: { bill: '0.25', tip: '10', people: '2' }, tipCents: 3, totalCents: 28, shareCents: 14, collectedCents: 28, overageCents: 0, kind: 'even', status: `Splits evenly: 2 ${X} $0.14 = $0.28.`, strong: '' },
  { fields: { bill: '0.10', tip: '15', people: '1' }, tipCents: 2, totalCents: 12, shareCents: 12, collectedCents: 12, overageCents: 0, kind: 'one', status: 'One person pays the full Total.', strong: '' },
  { fields: { bill: '10.05', tip: '15', people: '1' }, tipCents: 151, totalCents: 1156, shareCents: 1156, collectedCents: 1156, overageCents: 0, kind: 'one', status: 'One person pays the full Total.', strong: '' },
  { fields: { bill: '10.00', tip: '17.5', people: '2' }, tipCents: 175, totalCents: 1175, shareCents: 588, collectedCents: 1176, overageCents: 1, kind: 'roundedUp', status: `Rounded up to the cent: 2 ${X} $5.88 = $11.76, 1${CENT} over the Total.`, strong: `1${CENT} over the Total` },
];
