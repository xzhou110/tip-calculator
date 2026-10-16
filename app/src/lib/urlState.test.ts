import { describe, expect, it } from 'vitest';
import type { FieldName, FieldTexts } from '../types';
import { parseBill, parsePeople, parseTip } from './calc';
import { buildShareUrl, parseHash, serializeHash } from './urlState';

describe('serializeHash', () => {
  it.each([
    [{ bill: '86.4', tip: '20', people: '4' }, 'bill=86.40&tip=20&people=4'],
    [{ bill: '', tip: '20', people: '2' }, 'tip=20&people=2'],
    [{ bill: '$1,234.5', tip: '17.50', people: '04' }, 'bill=1234.50&tip=17.5&people=4'],
    [{ bill: 'abc', tip: '', people: '0' }, ''],
    [{ bill: '0', tip: '0', people: '1' }, 'bill=0&tip=0&people=1'],
  ])('%j -> %j', (fields, out) => {
    expect(serializeHash(fields)).toBe(out);
  });
});

describe('parseHash', () => {
  const DEFAULTS = { bill: '', tip: '20', people: '2' };

  it.each([
    ['', DEFAULTS],
    ['#', DEFAULTS],
    ['#bill=86.40&tip=20&people=4', { bill: '86.40', tip: '20', people: '4' }],
    ['bill=86.4&tip=17.50&people=04', { bill: '86.40', tip: '17.5', people: '4' }],
    ['#bill=abc&tip=500&people=0', DEFAULTS],
    ['#bill=0', { bill: '0', tip: '20', people: '2' }],
    ['#tip=18', { bill: '', tip: '18', people: '2' }],
    ['#bill=%24100&x=1', { bill: '100', tip: '20', people: '2' }],
    ['#bill=1e3&bill=50', DEFAULTS],
    ['#%E0%A4%A', DEFAULTS],
    ['#people=&tip=', DEFAULTS],
    ['#tip=101&people=3', { bill: '', tip: '20', people: '3' }],
    ['#bill=-5&tip=-1&people=-2', DEFAULTS],
    ['#bill=%E0%A4%A&tip=%%%&people=%ZZ', DEFAULTS],
  ])('%j', (hash, out) => {
    expect(parseHash(hash)).toEqual(out);
  });

  it('never throws, whatever the hash holds', () => {
    for (const hash of ['#%', '#%%', '#&&&=', '#=', '#bill', '#\ud800', '#bill=\u0000', `#${'a'.repeat(5000)}`]) {
      expect(() => parseHash(hash)).not.toThrow();
    }
  });

  it('returns a fresh object each time (callers may hold it as state)', () => {
    const a = parseHash('');
    const b = parseHash('');
    expect(a).not.toBe(b);
  });
});

describe('buildShareUrl', () => {
  it('replaces the fragment and keeps the path and query', () => {
    expect(
      buildShareUrl('https://xzhou110.github.io/tip-calculator/?t=1#bill=1', { bill: '86.40', tip: '20', people: '4' }),
    ).toBe('https://xzhou110.github.io/tip-calculator/?t=1#bill=86.40&tip=20&people=4');
  });

  it('adds a fragment when there was none', () => {
    expect(buildShareUrl('https://xzhou110.github.io/tip-calculator/', { bill: '', tip: '20', people: '2' })).toBe(
      'https://xzhou110.github.io/tip-calculator/#tip=20&people=2',
    );
  });

  it('drops the fragment entirely when no field is valid', () => {
    expect(buildShareUrl('http://localhost:5173/#bill=5', { bill: 'x', tip: '', people: '0' })).toBe(
      'http://localhost:5173/',
    );
  });
});

describe('round trip', () => {
  const samples: FieldTexts[] = [
    { bill: '86.4', tip: '20', people: '4' },
    { bill: '$1,234.5', tip: '17.50', people: '04' },
    { bill: '0', tip: '0', people: '1' },
    { bill: '.5', tip: '17.25%', people: '999999999999999' },
    { bill: '999999999.99', tip: '100.00', people: '150' },
    { bill: 'abc', tip: ' 18 ', people: '0' },
    { bill: '', tip: '', people: '' },
    { bill: '86.', tip: '0.05', people: '2' },
  ];

  function value(name: FieldName, raw: string): number | null {
    const p = name === 'bill' ? parseBill(raw) : name === 'tip' ? parseTip(raw) : parsePeople(raw);
    return p.status === 'valid' ? p.value : null;
  }

  it.each(samples)('%j keeps every valid value', (f) => {
    const back = parseHash(serializeHash(f));
    for (const name of ['bill', 'tip', 'people'] as const) {
      const before = value(name, f[name]);
      if (before !== null) expect(value(name, back[name])).toBe(before);
    }
  });
});
