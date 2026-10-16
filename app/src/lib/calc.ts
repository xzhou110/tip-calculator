// The pure calculation module (AC10; api-contract.md, lib/calc.ts). No DOM, no React, no I/O.
// Money is integer cents and the tip is integer basis points; integer division is (n - n % d) / d.
import { FIELD_ORDER, MAX_BILL_CENTS, MAX_PEOPLE, MAX_TIP_BP, TIP_PICKS_BP } from '../constants';
import type {
  BasisPoints,
  BillParse,
  Evaluation,
  FieldTexts,
  ParsedFields,
  PeopleParse,
  SplitInputs,
  SplitResult,
  TipParse,
} from '../types';
import { formatPercentText } from './format';

/** ASCII digits with an optional decimal point: "86", "86.", "86.40", ".5"; never ".", "", "1e3", "+5". */
const NUMBER = /^(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/;
const DIGITS = /^[0-9]+$/;
const WHITESPACE = /\s/g;

function stripLeadingZeros(s: string): string {
  return s.replace(/^0+/, '');
}

/** Splits a NUMBER at its point; the whole part loses its leading zeros. Either part may be "". */
function splitNumber(s: string): { whole: string; frac: string } {
  const dot = s.indexOf('.');
  const whole = dot === -1 ? s : s.slice(0, dot);
  const frac = dot === -1 ? '' : s.slice(dot + 1);
  return { whole: stripLeadingZeros(whole), frac };
}

/** whole and up to two fraction digits as an integer count of hundredths. */
function toHundredths(whole: string, frac: string): number {
  return Number(whole || '0') * 100 + Number(frac.padEnd(2, '0'));
}

function isNumberOrBare(r: string): boolean {
  return r === '' || r === '.' || NUMBER.test(r);
}

export function parseBill(raw: string): BillParse {
  let s = String(raw).replace(WHITESPACE, '').replace(/,/g, '');
  if (s.startsWith('$')) s = s.slice(1);
  if (s === '' || s === '.') return { status: 'empty' };
  if (s.startsWith('-')) {
    let r = s.slice(1);
    if (r.startsWith('$')) r = r.slice(1);
    return { status: 'invalid', problem: isNumberOrBare(r) ? 'negative' : 'malformed' };
  }
  if (!NUMBER.test(s)) return { status: 'invalid', problem: 'malformed' };
  const { whole, frac } = splitNumber(s);
  if (whole.length > 9) return { status: 'invalid', problem: 'tooLarge' };
  if (frac.length > 2) return { status: 'invalid', problem: 'tooManyDecimals' };
  return { status: 'valid', value: toHundredths(whole, frac) };
}

export function parseTip(raw: string): TipParse {
  let s = String(raw).replace(WHITESPACE, '');
  if (s.endsWith('%')) s = s.slice(0, -1);
  if (s === '' || s === '.') return { status: 'empty' };
  if (s.startsWith('-')) {
    return { status: 'invalid', problem: isNumberOrBare(s.slice(1)) ? 'outOfRange' : 'malformed' };
  }
  if (!NUMBER.test(s)) return { status: 'invalid', problem: 'malformed' };
  const { whole, frac } = splitNumber(s);
  const wholeValue = Number(whole || '0');
  if (whole.length > 3 || wholeValue > 100 || (wholeValue === 100 && /[1-9]/.test(frac))) {
    return { status: 'invalid', problem: 'outOfRange' };
  }
  if (frac.length > 2) return { status: 'invalid', problem: 'tooManyDecimals' };
  return { status: 'valid', value: toHundredths(whole, frac) };
}

export function parsePeople(raw: string): PeopleParse {
  const s = String(raw).replace(WHITESPACE, '');
  if (s === '') return { status: 'empty' };
  if (!DIGITS.test(s)) return { status: 'invalid', problem: 'notWhole' };
  const digits = stripLeadingZeros(s);
  if (digits === '') return { status: 'invalid', problem: 'notWhole' };
  if (digits.length > 15) return { status: 'invalid', problem: 'tooLarge' };
  return { status: 'valid', value: Number(digits) };
}

function isIntegerIn(n: number, min: number, max: number): boolean {
  return Number.isSafeInteger(n) && n >= min && n <= max;
}

/** Throws RangeError only on out-of-contract arguments (a programming error; evaluate never triggers it). */
export function computeSplit(inputs: SplitInputs): SplitResult {
  const { billCents, tipBasisPoints, people } = inputs;
  if (
    !isIntegerIn(billCents, 0, MAX_BILL_CENTS) ||
    !isIntegerIn(tipBasisPoints, 0, MAX_TIP_BP) ||
    !isIntegerIn(people, 1, MAX_PEOPLE)
  ) {
    throw new RangeError('computeSplit: arguments outside the contract bounds');
  }
  const n = billCents * tipBasisPoints + 5000;
  const tipCents = (n - (n % 10000)) / 10000; // half up to the cent
  const totalCents = billCents + tipCents;
  const r = totalCents % people;
  const shareCents = (totalCents - r) / people + (r > 0 ? 1 : 0); // rounded UP to the cent
  const overageCents = r > 0 ? people - r : 0; // 0 .. people-1
  const collectedCents = totalCents + overageCents; // equals shareCents * people
  const kind = people === 1 ? 'one' : overageCents === 0 ? 'even' : 'roundedUp';
  return { tipCents, totalCents, shareCents, collectedCents, overageCents, kind };
}

export function evaluate(fields: FieldTexts): Evaluation {
  const parsed: ParsedFields = {
    bill: parseBill(fields.bill),
    tip: parseTip(fields.tip),
    people: parsePeople(fields.people),
  };
  const invalid = FIELD_ORDER.filter((name) => parsed[name].status === 'invalid');
  const empty = FIELD_ORDER.filter((name) => parsed[name].status === 'empty');
  const { bill, tip, people } = parsed;
  if (bill.status === 'valid' && tip.status === 'valid' && people.status === 'valid') {
    const inputs: SplitInputs = { billCents: bill.value, tipBasisPoints: tip.value, people: people.value };
    return { status: 'ready', parsed, inputs, result: computeSplit(inputs) };
  }
  return { status: 'incomplete', parsed, invalid, empty };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** ArrowUp / ArrowDown in the Tip field: one whole percent, clamped to 0..100; empty or invalid counts as 0. */
export function stepTip(raw: string, delta: 1 | -1): string {
  const tip = parseTip(raw);
  const base = tip.status === 'valid' ? tip.value : 0;
  return formatPercentText(clamp(base + delta * 100, 0, MAX_TIP_BP));
}

/** The − and + buttons and arrow keys: one person, clamped to 1..MAX_PEOPLE; empty or invalid counts as 1. */
export function stepPeople(raw: string, delta: 1 | -1): string {
  const people = parsePeople(raw);
  const base = people.status === 'valid' ? people.value : 1;
  return String(clamp(base + delta, 1, MAX_PEOPLE));
}

/** The quick pick equal to a valid tip, or null. */
export function pressedPick(tip: TipParse): BasisPoints | null {
  if (tip.status !== 'valid') return null;
  return TIP_PICKS_BP.find((bp) => bp === tip.value) ?? null;
}
