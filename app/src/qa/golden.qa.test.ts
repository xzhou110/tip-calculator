// QA-owned acceptance tests (AC1, AC2, AC3, AC4, AC5, AC6, AC9, AC10). Independent of the engineer's suites:
// every expectation comes from PRD.md and api-contract.md (Golden Cases), or from a BigInt reference.
import { describe, expect, it } from 'vitest';
import { MAX_BILL_CENTS, MAX_PEOPLE, MAX_TIP_BP, TIP_PICKS_BP } from '../constants';
import {
  computeSplit, evaluate, parseBill, parsePeople, parseTip, pressedPick, stepPeople, stepTip,
} from '../lib/calc';
import { formatBillText, formatCount, formatMoney, formatOverage, formatPercentText } from '../lib/format';
import { announcement, fieldMessages, statusLine } from '../lib/messages';
import { readStoredTheme, resolveTheme, writeStoredTheme } from '../lib/theme';
import { buildShareUrl, parseHash, serializeHash } from '../lib/urlState';

const X = '×';
const C = '¢';
const APOS = '’';

describe('Golden Cases: split table (AC2, AC5)', () => {
  const rows: Array<[string, string, string, number, number, number, number, number, string, string]> = [
    ['86.40', '20', '4', 1728, 10368, 2592, 10368, 0, 'even', `Splits evenly: 4 ${X} $25.92 = $103.68.`],
    ['86.40', '20', '2', 1728, 10368, 5184, 10368, 0, 'even', `Splits evenly: 2 ${X} $51.84 = $103.68.`],
    ['86.40', '20', '3', 1728, 10368, 3456, 10368, 0, 'even', `Splits evenly: 3 ${X} $34.56 = $103.68.`],
    ['100', '18', '3', 1800, 11800, 3934, 11802, 2, 'roundedUp', `Rounded up to the cent: 3 ${X} $39.34 = $118.02, 2${C} over the Total.`],
    ['50', '20', '1', 1000, 6000, 6000, 6000, 0, 'one', 'One person pays the full Total.'],
    ['0', '20', '2', 0, 0, 0, 0, 0, 'even', `Splits evenly: 2 ${X} $0.00 = $0.00.`],
    ['120.25', '0', '150', 0, 12025, 81, 12150, 125, 'roundedUp', `Rounded up to the cent: 150 ${X} $0.81 = $121.50, $1.25 over the Total.`],
    ['0.01', '0', '3', 0, 1, 1, 3, 2, 'roundedUp', `Rounded up to the cent: 3 ${X} $0.01 = $0.03, 2${C} over the Total.`],
    ['0.25', '10', '2', 3, 28, 14, 28, 0, 'even', `Splits evenly: 2 ${X} $0.14 = $0.28.`],
    ['0.10', '15', '1', 2, 12, 12, 12, 0, 'one', 'One person pays the full Total.'],
    ['10.05', '15', '1', 151, 1156, 1156, 1156, 0, 'one', 'One person pays the full Total.'],
    ['10.00', '17.5', '2', 175, 1175, 588, 1176, 1, 'roundedUp', `Rounded up to the cent: 2 ${X} $5.88 = $11.76, 1${C} over the Total.`],
  ];
  it.each(rows)('bill %s tip %s people %s', (bill, tip, people, tipC, total, share, coll, over, kind, status) => {
    const e = evaluate({ bill, tip, people });
    expect(e.status).toBe('ready');
    if (e.status !== 'ready') return;
    expect(e.result).toEqual({ tipCents: tipC, totalCents: total, shareCents: share, collectedCents: coll, overageCents: over, kind });
    const s = statusLine(e);
    expect(s.lead + s.strong + s.tail).toBe(status);
    expect(s.tone).toBe(kind === 'roundedUp' ? 'ink' : 'muted');
  });
});

describe('AC5: the difference is never silent', () => {
  it('whenever shares x people differ from the total, the status line and announcement name the exact amount', () => {
    let checked = 0;
    for (let people = 1; people <= 50; people++) {
      for (let total = 0; total <= 400; total++) {
        const e = evaluate({ bill: formatBillText(total), tip: '0', people: String(people) });
        if (e.status !== 'ready') throw new Error('not ready');
        const diff = e.result.shareCents * people - e.result.totalCents;
        const s = statusLine(e);
        const line = s.lead + s.strong + s.tail;
        const ann = announcement(e) ?? '';
        if (diff !== 0) {
          expect(line).toContain(`${formatOverage(diff)} over the Total`);
          expect(ann).toContain(`${formatOverage(diff)} over the Total`);
          expect(s.strong).toBe(`${formatOverage(diff)} over the Total`);
        } else {
          expect(line).not.toContain('over the Total');
          expect(ann).not.toContain('over the Total');
        }
        checked++;
      }
    }
    expect(checked).toBe(50 * 401);
  });
});

describe('Property grid and bounds (AC2, AC10)', () => {
  it('invariants over people 1..50 x totals 0..2000', { timeout: 60000 }, () => {
    for (let people = 1; people <= 50; people++) {
      for (let total = 0; total <= 2000; total++) {
        const r = computeSplit({ billCents: total, tipBasisPoints: 0, people });
        expect(r.totalCents).toBe(total);
        expect(r.collectedCents).toBe(r.shareCents * people);
        expect(r.overageCents).toBeGreaterThanOrEqual(0);
        expect(r.overageCents).toBeLessThanOrEqual(people - 1);
        expect(r.shareCents * people).toBeGreaterThanOrEqual(r.totalCents);
        for (const v of Object.values(r)) if (typeof v === 'number') expect(Number.isSafeInteger(v)).toBe(true);
      }
    }
  });
  it('matches a BigInt reference at random and boundary inputs', () => {
    const bills = [0, 1, 5, 99, 100, 12345, 99999999999, 99999999998, 50000000000];
    const tips = [0, 1, 50, 1500, 1750, 2000, 9999, 10000];
    const people = [1, 2, 3, 7, 150, 99999, 999999999999999, 999999999999998];
    let seed = 12345;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    for (let i = 0; i < 3000; i++) { bills.push(rnd(MAX_BILL_CENTS)); tips.push(rnd(10001)); people.push(1 + rnd(1000000)); }
    let n = 0;
    for (const b of bills) for (const t of tips.slice(0, 40)) for (const p of people.slice(0, 40)) {
      const r = computeSplit({ billCents: b, tipBasisPoints: t, people: p });
      const B = BigInt(b), T = BigInt(t), P = BigInt(p);
      const tip = (B * T + 5000n) / 10000n;
      const total = B + tip;
      const share = (total + P - 1n) / P;
      if (BigInt(r.tipCents) !== tip || BigInt(r.totalCents) !== total || BigInt(r.shareCents) !== share ||
        BigInt(r.collectedCents) !== share * P || BigInt(r.overageCents) !== share * P - total) {
        throw new Error(`mismatch for ${b} ${t} ${p}: ${JSON.stringify(r)}`);
      }
      n++;
    }
    expect(n).toBeGreaterThan(100000);
  });
  it('max bill x max tip x max people throws nothing and stays safe', () => {
    const r = computeSplit({ billCents: MAX_BILL_CENTS, tipBasisPoints: MAX_TIP_BP, people: MAX_PEOPLE });
    for (const v of Object.values(r)) if (typeof v === 'number') expect(Number.isSafeInteger(v)).toBe(true);
    expect(r.totalCents).toBe(MAX_BILL_CENTS * 2);
    expect(r.shareCents).toBe(1);
    const e = evaluate({ bill: '999999999.99', tip: '100', people: '999999999999999' });
    expect(e.status).toBe('ready');
    const s = statusLine(e);
    expect(s.lead + s.strong + s.tail).not.toMatch(/NaN|Infinity|undefined|e\+/);
  });
  it('RangeError preconditions', () => {
    const ok = { billCents: 100, tipBasisPoints: 2000, people: 2 };
    for (const bad of [
      { ...ok, people: 0 }, { ...ok, billCents: -1 }, { ...ok, billCents: 1.5 }, { ...ok, tipBasisPoints: 10001 },
      { ...ok, people: NaN }, { ...ok, billCents: Infinity }, { ...ok, tipBasisPoints: -1 },
      { ...ok, billCents: MAX_BILL_CENTS + 1 }, { ...ok, people: MAX_PEOPLE + 1 }, { ...ok, people: 2.5 },
    ]) expect(() => computeSplit(bad)).toThrow(RangeError);
  });
});

describe('Parse tables (AC4, AC6)', () => {
  it('parseBill', () => {
    for (const s of ['', '  ', '$', '.', '$.']) expect(parseBill(s)).toEqual({ status: 'empty' });
    for (const s of ['86.40', '86.4', ' 86.40 ', '$86.40']) expect(parseBill(s)).toEqual({ status: 'valid', value: 8640 });
    const pairs: Array<[string, number]> = [['86.', 8600], ['.5', 50], ['$1,234.56', 123456], ['0', 0], ['0.00', 0], ['007', 700], ['000000000086.40', 8640], ['999999999.99', 99999999999]];
    for (const [s, v] of pairs) expect(parseBill(s)).toEqual({ status: 'valid', value: v });
    expect(parseBill('1000000000')).toEqual({ status: 'invalid', problem: 'tooLarge' });
    for (const s of ['86.4o', '8.6.4', 'abc', '1e3', '+5', '$$5', '-abc']) expect(parseBill(s)).toEqual({ status: 'invalid', problem: 'malformed' });
    for (const s of ['-5', '-', '-$5', '$-5', '-.']) expect(parseBill(s)).toEqual({ status: 'invalid', problem: 'negative' });
    for (const s of ['86.405', '86.400']) expect(parseBill(s)).toEqual({ status: 'invalid', problem: 'tooManyDecimals' });
  });
  it('parseTip', () => {
    for (const s of ['', '.', '%', ' ']) expect(parseTip(s)).toEqual({ status: 'empty' });
    const ok: Array<[string, number]> = [['20', 2000], ['20%', 2000], [' 18 ', 1800], ['020', 2000], ['17.5', 1750], ['17.25', 1725], ['0', 0], ['100', 10000], ['100.00', 10000]];
    for (const [s, v] of ok) expect(parseTip(s)).toEqual({ status: 'valid', value: v });
    for (const s of ['101', '100.01', '500', '1000', '-1', '-', '500.555']) expect(parseTip(s)).toEqual({ status: 'invalid', problem: 'outOfRange' });
    for (const s of ['17.555', '100.000']) expect(parseTip(s)).toEqual({ status: 'invalid', problem: 'tooManyDecimals' });
    for (const s of ['abc', '2o', '1,5', '-abc']) expect(parseTip(s)).toEqual({ status: 'invalid', problem: 'malformed' });
  });
  it('parsePeople (AC4: 15-digit limit)', () => {
    for (const s of ['', '   ']) expect(parsePeople(s)).toEqual({ status: 'empty' });
    const ok: Array<[string, number]> = [['4', 4], ['04', 4], [' 4 ', 4], ['1', 1], ['999999999999999', 999999999999999]];
    for (const [s, v] of ok) expect(parsePeople(s)).toEqual({ status: 'valid', value: v });
    for (const s of ['0', '00', '-2', '2.5', '4.0', 'two', '.', '-', '1,000']) expect(parsePeople(s)).toEqual({ status: 'invalid', problem: 'notWhole' });
    expect(parsePeople('1000000000000000')).toEqual({ status: 'invalid', problem: 'tooLarge' });
    expect(parsePeople('9007199254740993')).toEqual({ status: 'invalid', problem: 'tooLarge' });
  });
});

describe('Adversarial inputs (AC4, AC6): no throw, no NaN, no Infinity, no negative', () => {
  const nasty = [
    '-0', '+0', '1e3', '1E3', '١٢', '१२', '１２', 'Infinity', '-Infinity', 'NaN', '0x10', '0b1', '1_000',
    '1'.repeat(100000), '9'.repeat(5000) + '.99', '.'.repeat(1000), '-'.repeat(1000), '$'.repeat(100), '%%', '1%%', ' ', '\t', '\n', '\u0000',
    '0.0.0', '..5', '5..', '--5', '- 5', '1 000', '1,0,0', '😀', '<script>', "'; DROP", 'null', 'undefined', '[object Object]', '2e-1', '.e1',
  ];
  it('evaluate over every nasty string in every field never throws and never leaks bad numbers', () => {
    for (const a of nasty) for (const b of nasty.slice(0, 12)) for (const c of ['2', '', 'x', ...nasty.slice(0, 8)]) {
      const fieldSets = [{ bill: a, tip: b, people: c }, { bill: b, tip: c, people: a }, { bill: c, tip: a, people: b }];
      for (const f of fieldSets) {
        const e = evaluate(f);
        const msgs = fieldMessages(e.parsed);
        const s = statusLine(e);
        const ann = announcement(e) ?? '';
        const all = [s.lead, s.strong, s.tail, ann, msgs.bill.text, msgs.tip.text, msgs.people.text].join('|');
        expect(all).not.toMatch(/NaN|Infinity|undefined|null|\$-|-\$/);
        if (e.status === 'ready') {
          for (const v of Object.values(e.result)) if (typeof v === 'number') expect(Number.isSafeInteger(v) && v >= 0).toBe(true);
          expect(formatMoney(e.result.shareCents)).toMatch(/^\$[\d,]+\.\d\d$/);
        } else {
          expect(e.invalid.length + e.empty.length).toBeGreaterThan(0);
        }
      }
    }
  });
  it('specific classifications', () => {
    expect(parseBill('-0')).toEqual({ status: 'invalid', problem: 'negative' });
    expect(parseTip('-0').status).toBe('invalid');
    expect(parsePeople('-0')).toEqual({ status: 'invalid', problem: 'notWhole' });
    for (const s of ['1e3', '١٢', 'Infinity', 'NaN', '0x10']) {
      expect(parseBill(s)).toEqual({ status: 'invalid', problem: 'malformed' });
      expect(parseTip(s)).toEqual({ status: 'invalid', problem: 'malformed' });
      expect(parsePeople(s)).toEqual({ status: 'invalid', problem: 'notWhole' });
    }
    expect(parseBill('1'.repeat(100000))).toEqual({ status: 'invalid', problem: 'tooLarge' });
    expect(parsePeople('1'.repeat(100000))).toEqual({ status: 'invalid', problem: 'tooLarge' });
    expect(parseTip('1'.repeat(100000))).toEqual({ status: 'invalid', problem: 'outOfRange' });
  });
  it('non-string input does not crash the parsers', () => {
    for (const v of [undefined, null, 5, {}, []] as unknown as string[]) {
      expect(() => parseBill(v)).not.toThrow();
      expect(() => parseTip(v)).not.toThrow();
      expect(() => parsePeople(v)).not.toThrow();
    }
  });
  it('zero people never produces a result (division by zero)', () => {
    for (const p of ['0', '00', '0000']) expect(evaluate({ bill: '100', tip: '20', people: p }).status).toBe('incomplete');
  });
});

describe('AC1: empty state shows no result, never $0.00 or NaN', () => {
  it('defaults (empty bill) are incomplete and the prompts are plain', () => {
    const e = evaluate({ bill: '', tip: '20', people: '2' });
    expect(e.status).toBe('incomplete');
    expect(statusLine(e).lead).toBe(`Enter the bill to see each person${APOS}s share.`);
    expect(announcement(e)).toBeNull();
    expect(fieldMessages(e.parsed).bill.text).toBe('Enter the bill before tip, like 86.40');
  });
  it('a zero bill is a real $0.00 result (documented contract), not a placeholder', () => {
    expect(evaluate({ bill: '0', tip: '20', people: '2' }).status).toBe('ready');
  });
});

describe('Evaluate incomplete table and messages', () => {
  it('rows', () => {
    const rows: Array<[[string, string, string], string[], string[], string]> = [
      [['', '20', '2'], [], ['bill'], `Enter the bill to see each person${APOS}s share.`],
      [['86.4o', '20', '2'], ['bill'], [], 'Check the Bill to see the split.'],
      [['86.40', '', '2'], [], ['tip'], 'Enter a tip to see the split.'],
      [['', '', ''], [], ['bill', 'tip', 'people'], 'Fill in Bill, Tip and People to see the split.'],
      [['abc', '', '0'], ['bill', 'people'], ['tip'], 'Check Bill and People to see the split.'],
    ];
    for (const [[bill, tip, people], inv, emp, line] of rows) {
      const e = evaluate({ bill, tip, people });
      if (e.status !== 'incomplete') throw new Error('expected incomplete');
      expect([...e.invalid]).toEqual(inv);
      expect([...e.empty]).toEqual(emp);
      expect(statusLine(e).lead).toBe(line);
    }
  });
  it('field error copy by field (AC6)', () => {
    const m = (b: string, t: string, p: string) => fieldMessages(evaluate({ bill: b, tip: t, people: p }).parsed);
    expect(m('-5', '20', '2').bill).toEqual({ tone: 'error', text: `The bill can${APOS}t be negative` });
    expect(m('abc', '20', '2').bill.text).toBe('Enter a number, like 86.40');
    expect(m('5', '-1', '2').tip).toEqual({ tone: 'error', text: 'Enter a tip from 0 to 100' });
    expect(m('5', '101', '2').tip.text).toBe('Enter a tip from 0 to 100');
    expect(m('5', '20', '0').people).toEqual({ tone: 'error', text: 'Enter a whole number, 1 or more' });
    expect(m('5', '20', 'x').people.tone).toBe('error');
  });
  it('AC4: the over-15-digit refusal is a plain message', () => {
    const msg = fieldMessages(evaluate({ bill: '5', tip: '20', people: '1000000000000000' }).parsed).people;
    expect(msg.tone).toBe('error');
    expect(msg.text.length).toBeGreaterThan(0);
  });
  // Expected-failure marker: documents a FINDING. If the copy is ever fixed this test starts "failing" and must be flipped.
  it('AC4 (fixed 2026-10-16, flipped by the orchestrator): the over-15-digit refusal states its technical reason (PRD: "a technical limit with its reason")', () => {
    const msg = fieldMessages(evaluate({ bill: '5', tip: '20', people: '1000000000000000' }).parsed).people;
    // Fixed 2026-10-16 (D-007): the text now reads "Enter a smaller number of people, up to 15 digits"; before the fix it named no reason.
    expect(msg.text).toMatch(/exact|precision|digit|accurate|reliabl|too many/i);
  });
});

describe('AC3 picks, steps, formatting', () => {
  it('quick picks are 15, 18, 20, 25 and the custom field accepts 0..100', () => {
    expect([...TIP_PICKS_BP]).toEqual([1500, 1800, 2000, 2500]);
    expect(parseTip('0').status).toBe('valid');
    expect(parseTip('100').status).toBe('valid');
    expect(parseTip('100.5').status).toBe('invalid');
    expect(parseTip('-0.01').status).toBe('invalid');
  });
  it('pressedPick', () => {
    expect(pressedPick(parseTip('20'))).toBe(2000);
    expect(pressedPick(parseTip('20.0'))).toBe(2000);
    expect(pressedPick(parseTip('22'))).toBeNull();
    expect(pressedPick(parseTip(''))).toBeNull();
    expect(pressedPick(parseTip('abc'))).toBeNull();
  });
  it('stepTip and stepPeople', () => {
    const t: Array<[string, 1 | -1, string]> = [['20', 1, '21'], ['17.5', 1, '18.5'], ['99.5', 1, '100'], ['100', 1, '100'], ['0', -1, '0'], ['0.5', -1, '0'], ['', 1, '1'], ['abc', -1, '0']];
    for (const [r, d, o] of t) expect(stepTip(r, d)).toBe(o);
    const p: Array<[string, 1 | -1, string]> = [['2', 1, '3'], ['1', -1, '1'], ['', 1, '2'], ['', -1, '1'], ['0', 1, '2'], ['999999999999999', 1, '999999999999999']];
    for (const [r, d, o] of p) expect(stepPeople(r, d)).toBe(o);
  });
  it('format', () => {
    expect([2592, 0, 123456, 99999999999].map(formatMoney)).toEqual(['$25.92', '$0.00', '$1,234.56', '$999,999,999.99']);
    expect([2, 99, 100, 125].map(formatOverage)).toEqual([`2${C}`, `99${C}`, '$1.00', '$1.25']);
    expect([formatCount(4), formatCount(1500)]).toEqual(['4', '1,500']);
    expect([8640, 10000, 5, 0, 123456].map(formatBillText)).toEqual(['86.40', '100', '0.05', '0', '1234.56']);
    expect([2000, 1750, 1725, 5, 10000].map(formatPercentText)).toEqual(['20', '17.5', '17.25', '0.05', '100']);
  });
  it('formatMoney is exact to the cent against integer math for 0..250000, extremes and a random sample', () => {
    const exact = (c: number) => { const w = (c - (c % 100)) / 100; return `$${w.toLocaleString('en-US')}.${String(c % 100).padStart(2, '0')}`; };
    for (let c = 0; c <= 250000; c++) if (formatMoney(c) !== exact(c)) throw new Error(`formatMoney(${c}) = ${formatMoney(c)} expected ${exact(c)}`);
    for (const c of [MAX_BILL_CENTS, MAX_BILL_CENTS * 2, MAX_BILL_CENTS * 2 - 1, 1999999999, 10000000001, 99999999995, 199999999997]) {
      expect(formatMoney(c)).toBe(exact(c));
    }
    let seed = 7;
    for (let i = 0; i < 200000; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const c = (seed * 93) % (MAX_BILL_CENTS * 2);
      if (formatMoney(c) !== exact(c)) throw new Error(`formatMoney(${c}) = ${formatMoney(c)} expected ${exact(c)}`);
    }
  });
});

describe('AC9: URL state', () => {
  const D = { bill: '', tip: '20', people: '2' };
  it('parseHash table', () => {
    expect(parseHash('')).toEqual(D);
    expect(parseHash('#')).toEqual(D);
    expect(parseHash('#bill=86.40&tip=20&people=4')).toEqual({ bill: '86.40', tip: '20', people: '4' });
    expect(parseHash('bill=86.4&tip=17.50&people=04')).toEqual({ bill: '86.40', tip: '17.5', people: '4' });
    expect(parseHash('#bill=abc&tip=500&people=0')).toEqual(D);
    expect(parseHash('#bill=0')).toEqual({ bill: '0', tip: '20', people: '2' });
    expect(parseHash('#people=1')).toEqual({ bill: '', tip: '20', people: '1' });
    expect(parseHash('#tip=18')).toEqual({ bill: '', tip: '18', people: '2' });
    expect(parseHash('#bill=%24100&x=1')).toEqual({ bill: '100', tip: '20', people: '2' });
    expect(parseHash('#bill=1e3&bill=50')).toEqual(D);
    expect(parseHash('#bill=50&bill=1e3')).toEqual({ bill: '50', tip: '20', people: '2' });
    expect(parseHash('#%E0%A4%A')).toEqual(D);
  });
  it('bad links never throw, yield evaluable fields, and show no error message on load', () => {
    const bad = ['#bill=%', '#bill=%zz&tip=%E0', '#=&=&&&', '#bill', '#bill=&tip=&people=', '#bill[]=5', '#' + '&'.repeat(10000), '#bill=' + '9'.repeat(100000),
      '#tip=NaN&people=Infinity', '#people=1e2', '#people=-3', '#bill=-5', '#tip=١٢', '#bill=5&bill=6&bill=7', '#__proto__=x&constructor=y', '#bill=1&tip=2&people=3&bill=9'];
    for (const h of bad) {
      let f = D;
      expect(() => { f = parseHash(h); }).not.toThrow();
      const e = evaluate(f);
      const msgs = fieldMessages(e.parsed);
      for (const k of ['bill', 'tip', 'people'] as const) expect(msgs[k].tone).not.toBe('error');
    }
  });
  it('serializeHash table and round trip', () => {
    expect(serializeHash({ bill: '86.4', tip: '20', people: '4' })).toBe('bill=86.40&tip=20&people=4');
    expect(serializeHash({ bill: '', tip: '20', people: '2' })).toBe('tip=20&people=2');
    expect(serializeHash({ bill: '$1,234.5', tip: '17.50', people: '04' })).toBe('bill=1234.50&tip=17.5&people=4');
    expect(serializeHash({ bill: 'abc', tip: '', people: '0' })).toBe('');
    for (const f of [{ bill: '86.40', tip: '18', people: '3' }, { bill: '0', tip: '0', people: '1' }, { bill: '999999999.99', tip: '100', people: '999999999999999' }, { bill: '.5', tip: '17.25', people: '07' }]) {
      const back = evaluate(parseHash(serializeHash(f)));
      const orig = evaluate(f);
      expect(back.status).toBe('ready');
      if (back.status === 'ready' && orig.status === 'ready') expect(back.inputs).toEqual(orig.inputs);
    }
  });
  it('buildShareUrl keeps path and query, replaces the fragment', () => {
    expect(buildShareUrl('https://xzhou110.github.io/tip-calculator/?t=1#bill=1', { bill: '86.40', tip: '20', people: '4' })).toBe('https://xzhou110.github.io/tip-calculator/?t=1#bill=86.40&tip=20&people=4');
    expect(buildShareUrl('https://x/y/#old=1', { bill: 'abc', tip: '', people: '0' })).toBe('https://x/y/');
  });
});

describe('Theme storage (AC7, logic only)', () => {
  it('resolve and read', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('blue', false)).toBe('light');
    expect(readStoredTheme(null)).toBeNull();
    expect(readStoredTheme({ getItem: () => { throw new Error('blocked'); }, setItem: () => undefined })).toBeNull();
    expect(readStoredTheme({ getItem: () => 'sepia', setItem: () => undefined })).toBeNull();
  });
  it('write uses the namespaced key, round-trips, and swallows a throwing setItem', () => {
    const m = new Map<string, string>();
    const st = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    writeStoredTheme(st, 'dark');
    expect([...m.keys()]).toEqual(['tip-calculator.theme.v1']);
    expect(readStoredTheme(st)).toBe('dark');
    expect(() => writeStoredTheme({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, 'light')).not.toThrow();
    expect(() => writeStoredTheme(null, 'light')).not.toThrow();
  });
});
