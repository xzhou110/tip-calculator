import { describe, expect, it } from 'vitest';
import { formatBillText, formatCount, formatMoney, formatOverage, formatPercentText } from './format';

describe('formatMoney', () => {
  it.each([
    [2592, '$25.92'],
    [0, '$0.00'],
    [123456, '$1,234.56'],
    [99999999999, '$999,999,999.99'],
    [5, '$0.05'],
    [100, '$1.00'],
  ])('formatMoney(%i) is %s', (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  it('stays exact to the cent at the largest collected amount the bounds allow', () => {
    // MAX_PEOPLE people each paying 1 cent: 999,999,999,999,999 cents.
    expect(formatMoney(999999999999999)).toBe('$9,999,999,999,999.99');
    expect(formatMoney(199999999998)).toBe('$1,999,999,999.98');
  });
});

describe('formatOverage', () => {
  it.each([
    [2, '2¢'],
    [99, '99¢'],
    [100, '$1.00'],
    [125, '$1.25'],
    [1, '1¢'],
  ])('formatOverage(%i) is %s', (cents, text) => {
    expect(formatOverage(cents)).toBe(text);
  });

  it('uses the cent sign U+00A2', () => {
    expect(formatOverage(2).codePointAt(1)).toBe(0xa2);
  });
});

describe('formatCount', () => {
  it.each([
    [4, '4'],
    [1500, '1,500'],
    [999999999999999, '999,999,999,999,999'],
  ])('formatCount(%i) is %s', (n, text) => {
    expect(formatCount(n)).toBe(text);
  });
});

describe('formatBillText', () => {
  it.each([
    [8640, '86.40'],
    [10000, '100'],
    [5, '0.05'],
    [0, '0'],
    [123456, '1234.56'],
    [50, '0.50'],
    [99999999999, '999999999.99'],
  ])('formatBillText(%i) is %s', (cents, text) => {
    expect(formatBillText(cents)).toBe(text);
  });
});

describe('formatPercentText', () => {
  it.each([
    [2000, '20'],
    [1750, '17.5'],
    [1725, '17.25'],
    [5, '0.05'],
    [10000, '100'],
    [0, '0'],
    [50, '0.5'],
    [1801, '18.01'],
  ])('formatPercentText(%i) is %s', (bp, text) => {
    expect(formatPercentText(bp)).toBe(text);
  });
});
