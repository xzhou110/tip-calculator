import { describe, expect, it } from 'vitest';
import { MAX_BILL_CENTS, MAX_PEOPLE, MAX_TIP_BP } from '../constants';
import type { Evaluation, FieldTexts, SplitInputs } from '../types';
import {
  computeSplit,
  evaluate,
  parseBill,
  parsePeople,
  parseTip,
  pressedPick,
  stepPeople,
  stepTip,
} from './calc';
import { GOLDEN_SPLITS } from './goldenCases.testdata';

describe('parseBill', () => {
  it.each(['', '  ', '$', '.', '$.'])('%j is empty', (raw) => {
    expect(parseBill(raw)).toEqual({ status: 'empty' });
  });

  it.each(['86.40', '86.4', ' 86.40 ', '$86.40'])('%j is valid 8640', (raw) => {
    expect(parseBill(raw)).toEqual({ status: 'valid', value: 8640 });
  });

  it.each([
    ['86.', 8600],
    ['.5', 50],
    ['$1,234.56', 123456],
    ['0', 0],
    ['0.00', 0],
    ['007', 700],
    ['000000000086.40', 8640],
    ['999999999.99', 99999999999],
    [' 86.40\t', 8640],
  ])('%j is valid %i', (raw, value) => {
    expect(parseBill(raw)).toEqual({ status: 'valid', value });
  });

  it('1000000000 is too large', () => {
    expect(parseBill('1000000000')).toEqual({ status: 'invalid', problem: 'tooLarge' });
  });

  it.each(['86.4o', '8.6.4', 'abc', '1e3', '+5', '$$5', '-abc'])('%j is malformed', (raw) => {
    expect(parseBill(raw)).toEqual({ status: 'invalid', problem: 'malformed' });
  });

  it.each(['-5', '-', '-$5', '$-5', '-.'])('%j is negative', (raw) => {
    expect(parseBill(raw)).toEqual({ status: 'invalid', problem: 'negative' });
  });

  it.each(['86.405', '86.400'])('%j has too many decimals', (raw) => {
    expect(parseBill(raw)).toEqual({ status: 'invalid', problem: 'tooManyDecimals' });
  });
});

describe('parseTip', () => {
  it.each(['', '.', '%', ' '])('%j is empty', (raw) => {
    expect(parseTip(raw)).toEqual({ status: 'empty' });
  });

  it.each([
    ['20', 2000],
    ['20%', 2000],
    [' 18 ', 1800],
    ['020', 2000],
    ['17.5', 1750],
    ['17.25', 1725],
    ['0', 0],
    ['100', 10000],
    ['100.00', 10000],
  ])('%j is valid %i', (raw, value) => {
    expect(parseTip(raw)).toEqual({ status: 'valid', value });
  });

  it.each(['101', '100.01', '500', '1000', '-1', '-', '500.555'])('%j is out of range', (raw) => {
    expect(parseTip(raw)).toEqual({ status: 'invalid', problem: 'outOfRange' });
  });

  it.each(['17.555', '100.000'])('%j has too many decimals', (raw) => {
    expect(parseTip(raw)).toEqual({ status: 'invalid', problem: 'tooManyDecimals' });
  });

  it.each(['abc', '2o', '1,5', '-abc'])('%j is malformed', (raw) => {
    expect(parseTip(raw)).toEqual({ status: 'invalid', problem: 'malformed' });
  });
});

describe('parsePeople', () => {
  it.each(['', '   '])('%j is empty', (raw) => {
    expect(parsePeople(raw)).toEqual({ status: 'empty' });
  });

  it.each([
    ['4', 4],
    ['04', 4],
    [' 4 ', 4],
    ['1', 1],
    ['999999999999999', 999999999999999],
  ])('%j is valid %i', (raw, value) => {
    expect(parsePeople(raw)).toEqual({ status: 'valid', value });
  });

  it.each(['0', '00', '-2', '2.5', '4.0', 'two', '.', '-', '1,000'])('%j is not whole', (raw) => {
    expect(parsePeople(raw)).toEqual({ status: 'invalid', problem: 'notWhole' });
  });

  it('16 digits are too large', () => {
    expect(parsePeople('1000000000000000')).toEqual({ status: 'invalid', problem: 'tooLarge' });
  });
});

describe('computeSplit and evaluate: the golden splits', () => {
  it.each(GOLDEN_SPLITS.map((g) => [`${g.fields.bill}, ${g.fields.tip}%, ${g.fields.people}`, g] as const))(
    '%s',
    (_label, g) => {
      const e = evaluate(g.fields);
      expect(e.status).toBe('ready');
      if (e.status !== 'ready') return;
      expect(e.result).toEqual({
        tipCents: g.tipCents,
        totalCents: g.totalCents,
        shareCents: g.shareCents,
        collectedCents: g.collectedCents,
        overageCents: g.overageCents,
        kind: g.kind,
      });
      expect(computeSplit(e.inputs)).toEqual(e.result);
    },
  );
});

describe('computeSplit properties', () => {
  /** Returns the broken invariants for one input ([] when all hold); plain code keeps the grid fast. */
  function brokenInvariants(inputs: SplitInputs): string[] {
    const r = computeSplit(inputs);
    const broken: string[] = [];
    const values = [r.tipCents, r.totalCents, r.shareCents, r.collectedCents, r.overageCents];
    if (!values.every((v) => Number.isSafeInteger(v) && v >= 0)) broken.push('a value is unsafe or negative');
    if (r.totalCents !== inputs.billCents + r.tipCents) broken.push('total !== bill + tip');
    if (r.collectedCents !== r.shareCents * inputs.people) broken.push('collected !== share * people');
    if (r.overageCents > inputs.people - 1) broken.push('overage > people - 1');
    if (r.shareCents * inputs.people < r.totalCents) broken.push('share * people < total');
    if (r.collectedCents - r.totalCents !== r.overageCents) broken.push('overage !== collected - total');
    const kind = inputs.people === 1 ? 'one' : r.overageCents === 0 ? 'even' : 'roundedUp';
    if (r.kind !== kind) broken.push(`kind ${r.kind} !== ${kind}`);
    return broken.map((b) => `${JSON.stringify(inputs)}: ${b}`);
  }

  function assertInvariants(inputs: SplitInputs): void {
    expect(brokenInvariants(inputs)).toEqual([]);
  }

  it('holds over people 1..50 and totals 0..2000 cents', () => {
    const broken: string[] = [];
    for (let people = 1; people <= 50; people += 1) {
      for (let billCents = 0; billCents <= 2000; billCents += 1) {
        broken.push(...brokenInvariants({ billCents, tipBasisPoints: 0, people }));
      }
    }
    expect(broken).toEqual([]);
  });

  it('holds over a grid of tips, including hundredths of a percent', () => {
    const broken: string[] = [];
    for (const tipBasisPoints of [0, 1, 5, 1500, 1725, 1750, 1800, 2000, 2500, 9999, 10000]) {
      for (let billCents = 0; billCents <= 2000; billCents += 7) {
        for (const people of [1, 2, 3, 7, 13, 50]) {
          broken.push(...brokenInvariants({ billCents, tipBasisPoints, people }));
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('rounds the tip half up to the cent', () => {
    expect(computeSplit({ billCents: 25, tipBasisPoints: 1000, people: 1 }).tipCents).toBe(3); // 2.5
    expect(computeSplit({ billCents: 10, tipBasisPoints: 1500, people: 1 }).tipCents).toBe(2); // 1.5
    expect(computeSplit({ billCents: 1005, tipBasisPoints: 1500, people: 1 }).tipCents).toBe(151); // 150.75
    expect(computeSplit({ billCents: 1001, tipBasisPoints: 1500, people: 1 }).tipCents).toBe(150); // 150.15
  });

  it('stays exact at the bounds and never throws there', () => {
    const corners: SplitInputs[] = [
      { billCents: MAX_BILL_CENTS, tipBasisPoints: MAX_TIP_BP, people: MAX_PEOPLE },
      { billCents: MAX_BILL_CENTS, tipBasisPoints: MAX_TIP_BP, people: 1 },
      { billCents: MAX_BILL_CENTS, tipBasisPoints: MAX_TIP_BP, people: 3 },
      { billCents: 0, tipBasisPoints: 0, people: MAX_PEOPLE },
      { billCents: 1, tipBasisPoints: 0, people: MAX_PEOPLE },
    ];
    for (const inputs of corners) {
      expect(() => computeSplit(inputs)).not.toThrow();
      assertInvariants(inputs);
    }
    const top = computeSplit(corners[0]);
    expect(top.tipCents).toBe(MAX_BILL_CENTS);
    expect(top.totalCents).toBe(2 * MAX_BILL_CENTS);
    expect(top.shareCents).toBe(1);
    expect(top.collectedCents).toBe(MAX_PEOPLE);
  });

  it.each([
    ['people 0', { billCents: 100, tipBasisPoints: 2000, people: 0 }],
    ['billCents -1', { billCents: -1, tipBasisPoints: 2000, people: 2 }],
    ['billCents 1.5', { billCents: 1.5, tipBasisPoints: 2000, people: 2 }],
    ['tipBasisPoints 10001', { billCents: 100, tipBasisPoints: 10001, people: 2 }],
    ['people NaN', { billCents: 100, tipBasisPoints: 2000, people: Number.NaN }],
    ['billCents above the bound', { billCents: MAX_BILL_CENTS + 1, tipBasisPoints: 2000, people: 2 }],
    ['people above the bound', { billCents: 100, tipBasisPoints: 2000, people: MAX_PEOPLE + 1 }],
  ])('throws RangeError for %s', (_label, inputs) => {
    expect(() => computeSplit(inputs)).toThrow(RangeError);
  });
});

describe('evaluate: incomplete cases', () => {
  it.each([
    [{ bill: '', tip: '20', people: '2' }, [], ['bill']],
    [{ bill: '86.4o', tip: '20', people: '2' }, ['bill'], []],
    [{ bill: '86.40', tip: '', people: '2' }, [], ['tip']],
    [{ bill: '', tip: '', people: '' }, [], ['bill', 'tip', 'people']],
    [{ bill: 'abc', tip: '', people: '0' }, ['bill', 'people'], ['tip']],
  ] as const)('%j', (fields, invalid, empty) => {
    const e = evaluate(fields);
    expect(e.status).toBe('incomplete');
    if (e.status !== 'incomplete') return;
    expect(e.invalid).toEqual(invalid);
    expect(e.empty).toEqual(empty);
  });

  it('carries the three parses', () => {
    const e = evaluate({ bill: '86.40', tip: '20', people: '4' });
    expect(e.parsed).toEqual({
      bill: { status: 'valid', value: 8640 },
      tip: { status: 'valid', value: 2000 },
      people: { status: 'valid', value: 4 },
    });
  });

  it('never throws and never yields NaN, Infinity or a negative number', () => {
    const samples = [
      '', ' ', '-', '-0', '0', '00', '.', '..', '$', '%', 'NaN', 'Infinity', '-Infinity', '1e308', '9'.repeat(40),
      '999999999.99', '1000000000', '100', '100.01', '-5', '86.4o', '\u0000', '\ud800', '1,000', '0x10', '+1', '1_000',
    ];
    const numbers = (e: Evaluation): number[] =>
      e.status === 'ready'
        ? [...Object.values(e.inputs), e.result.tipCents, e.result.totalCents, e.result.shareCents, e.result.collectedCents, e.result.overageCents]
        : [];
    for (const bill of samples) {
      for (const tip of samples) {
        for (const people of ['', '0', '1', '2', '3', '999999999999999', '1000000000000000', '-1', 'x']) {
          const fields: FieldTexts = { bill, tip, people };
          let e: Evaluation | undefined;
          expect(() => {
            e = evaluate(fields);
          }).not.toThrow();
          for (const n of numbers(e!)) {
            expect(Number.isSafeInteger(n)).toBe(true);
            expect(n).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});

describe('stepTip', () => {
  it.each([
    ['20', 1, '21'],
    ['17.5', 1, '18.5'],
    ['99.5', 1, '100'],
    ['100', 1, '100'],
    ['0', -1, '0'],
    ['0.5', -1, '0'],
    ['', 1, '1'],
    ['abc', -1, '0'],
    ['20', -1, '19'],
    ['17.25', -1, '16.25'],
    ['500', -1, '0'],
  ] as const)('stepTip(%j, %i) is %j', (raw, delta, out) => {
    expect(stepTip(raw, delta)).toBe(out);
  });
});

describe('stepPeople', () => {
  it.each([
    ['2', 1, '3'],
    ['1', -1, '1'],
    ['', 1, '2'],
    ['', -1, '1'],
    ['0', 1, '2'],
    ['999999999999999', 1, '999999999999999'],
    ['04', -1, '3'],
    ['two', 1, '2'],
  ] as const)('stepPeople(%j, %i) is %j', (raw, delta, out) => {
    expect(stepPeople(raw, delta)).toBe(out);
  });
});

describe('pressedPick', () => {
  it.each([
    ['20', 2000],
    ['20.0', 2000],
    ['15', 1500],
    ['18%', 1800],
    ['25', 2500],
    ['22', null],
    ['', null],
    ['abc', null],
    ['17.5', null],
  ] as const)('pressedPick(parseTip(%j)) is %s', (raw, out) => {
    expect(pressedPick(parseTip(raw))).toBe(out);
  });
});
