import { describe, expect, it } from 'vitest';
import type { FieldTexts } from '../types';
import { evaluate, parseBill, parsePeople, parseTip } from './calc';
import { GOLDEN_SPLITS } from './goldenCases.testdata';
import {
  announcement,
  billMessage,
  CLIPBOARD_FAILED_MESSAGE,
  fieldMessages,
  LINK_COPIED_ANNOUNCEMENT,
  peopleMessage,
  statusLine,
  tipMessage,
} from './messages';

// Escapes on purpose: they prove the exact code points (’ U+2019, × U+00D7, ¢ U+00A2) in the source.
const APOS = '’';
const X = '×';
const CENT = '¢';

describe('field messages', () => {
  it.each([
    ['86.40', 'none', ''],
    ['0', 'none', ''],
    ['', 'prompt', 'Enter the bill before tip, like 86.40'],
    ['$', 'prompt', 'Enter the bill before tip, like 86.40'],
    ['86.4o', 'error', 'Enter a number, like 86.40'],
    ['-', 'error', `The bill can${APOS}t be negative`],
    ['-5', 'error', `The bill can${APOS}t be negative`],
    ['86.405', 'error', 'Use dollars and cents, like 86.40'],
    ['1000000000', 'error', 'Enter a bill under $1 billion'],
  ])('Bill %j: %s %j', (raw, tone, text) => {
    expect(billMessage(parseBill(raw))).toEqual({ tone, text });
  });

  it.each([
    ['20', 'helper', 'Tap a pick or type any percent from 0 to 100.'],
    ['0', 'helper', 'Tap a pick or type any percent from 0 to 100.'],
    ['', 'prompt', 'Enter a tip, like 20'],
    ['abc', 'error', 'Enter a tip from 0 to 100'],
    ['101', 'error', 'Enter a tip from 0 to 100'],
    ['-1', 'error', 'Enter a tip from 0 to 100'],
    ['17.555', 'error', 'Use up to two decimals, like 17.5'],
  ])('Tip %j: %s %j', (raw, tone, text) => {
    expect(tipMessage(parseTip(raw))).toEqual({ tone, text });
  });

  it.each([
    ['4', 'none', ''],
    ['', 'prompt', 'Enter the number of people, like 4'],
    ['0', 'error', 'Enter a whole number, 1 or more'],
    ['2.5', 'error', 'Enter a whole number, 1 or more'],
    ['two', 'error', 'Enter a whole number, 1 or more'],
    ['1000000000000000', 'error', 'Enter a smaller number of people'],
  ])('People %j: %s %j', (raw, tone, text) => {
    expect(peopleMessage(parsePeople(raw))).toEqual({ tone, text });
  });

  it('fieldMessages maps all three fields', () => {
    const e = evaluate({ bill: '', tip: '20', people: '0' });
    expect(fieldMessages(e.parsed)).toEqual({
      bill: { tone: 'prompt', text: 'Enter the bill before tip, like 86.40' },
      tip: { tone: 'helper', text: 'Tap a pick or type any percent from 0 to 100.' },
      people: { tone: 'error', text: 'Enter a whole number, 1 or more' },
    });
  });

  it('a link that fell back to defaults shows no error on any field', () => {
    const messages = fieldMessages(evaluate({ bill: '', tip: '20', people: '2' }).parsed);
    expect(Object.values(messages).map((m) => m.tone)).not.toContain('error');
  });
});

function sentence(fields: FieldTexts): string {
  const line = statusLine(evaluate(fields));
  return line.lead + line.strong + line.tail;
}

describe('statusLine: invalid fields take priority and name only the invalid ones', () => {
  it.each([
    [{ bill: 'x', tip: '20', people: '2' }, 'Check the Bill to see the split.'],
    [{ bill: '1', tip: 'x', people: '2' }, 'Check the Tip to see the split.'],
    [{ bill: '1', tip: '20', people: '0' }, 'Check People to see the split.'],
    [{ bill: 'x', tip: 'x', people: '2' }, 'Check Bill and Tip to see the split.'],
    [{ bill: 'x', tip: '20', people: '0' }, 'Check Bill and People to see the split.'],
    [{ bill: '1', tip: 'x', people: '0' }, 'Check Tip and People to see the split.'],
    [{ bill: 'x', tip: 'x', people: '0' }, 'Check Bill, Tip and People to see the split.'],
    [{ bill: 'x', tip: '', people: '' }, 'Check the Bill to see the split.'],
    [{ bill: 'abc', tip: '', people: '0' }, 'Check Bill and People to see the split.'],
  ])('%j', (fields, text) => {
    const line = statusLine(evaluate(fields));
    expect(line).toEqual({ kind: 'invalid', tone: 'muted', lead: text, strong: '', tail: '' });
  });
});

describe('statusLine: empty fields', () => {
  it.each([
    [{ bill: '', tip: '20', people: '2' }, `Enter the bill to see each person${APOS}s share.`],
    [{ bill: '1', tip: '', people: '2' }, 'Enter a tip to see the split.'],
    [{ bill: '1', tip: '20', people: '' }, 'Enter the number of people to see the split.'],
    [{ bill: '', tip: '', people: '2' }, 'Fill in Bill and Tip to see the split.'],
    [{ bill: '', tip: '20', people: '' }, 'Fill in Bill and People to see the split.'],
    [{ bill: '1', tip: '', people: '' }, 'Fill in Tip and People to see the split.'],
    [{ bill: '', tip: '', people: '' }, 'Fill in Bill, Tip and People to see the split.'],
  ])('%j', (fields, text) => {
    const line = statusLine(evaluate(fields));
    expect(line).toEqual({ kind: 'empty', tone: 'muted', lead: text, strong: '', tail: '' });
  });
});

describe('statusLine: the golden splits', () => {
  it.each(GOLDEN_SPLITS.map((g) => [g.status, g] as const))('%s', (_label, g) => {
    const line = statusLine(evaluate(g.fields));
    expect(line.lead + line.strong + line.tail).toBe(g.status);
    expect(line.kind).toBe(g.kind);
    expect(line.strong).toBe(g.strong);
    expect(line.tone).toBe(g.kind === 'roundedUp' ? 'ink' : 'muted');
    if (g.kind === 'roundedUp') expect(line.tail).toBe('.');
    else expect(line.strong + line.tail).toBe('');
  });

  it('splits the rounded-up sentence into lead, strong and tail', () => {
    expect(statusLine(evaluate({ bill: '100', tip: '18', people: '3' }))).toEqual({
      kind: 'roundedUp',
      tone: 'ink',
      lead: `Rounded up to the cent: 3 ${X} $39.34 = $118.02, `,
      strong: `2${CENT} over the Total`,
      tail: '.',
    });
  });

  it('groups a large head count', () => {
    expect(sentence({ bill: '1500', tip: '0', people: '1500' })).toBe(`Splits evenly: 1,500 ${X} $1.00 = $1,500.00.`);
  });
});

describe('announcement', () => {
  it('is null unless the split is ready', () => {
    expect(announcement(evaluate({ bill: '', tip: '20', people: '2' }))).toBeNull();
    expect(announcement(evaluate({ bill: 'x', tip: '20', people: '2' }))).toBeNull();
  });

  it.each([
    [{ bill: '86.40', tip: '20', people: '4' }, 'Each person pays $25.92. Total $103.68.'],
    [{ bill: '50', tip: '20', people: '1' }, 'Each person pays $60.00. Total $60.00.'],
    [
      { bill: '100', tip: '18', people: '3' },
      `Each person pays $39.34. Total $118.00. Rounded up to the cent, 2${CENT} over the Total.`,
    ],
    [
      { bill: '120.25', tip: '0', people: '150' },
      'Each person pays $0.81. Total $120.25. Rounded up to the cent, $1.25 over the Total.',
    ],
  ])('%j', (fields, text) => {
    expect(announcement(evaluate(fields))).toBe(text);
  });
});

describe('clipboard strings', () => {
  it('match the contract exactly', () => {
    expect(CLIPBOARD_FAILED_MESSAGE).toBe(`Couldn${APOS}t copy. Copy the link from the address bar.`);
    expect(LINK_COPIED_ANNOUNCEMENT).toBe('Link copied.');
  });
});
