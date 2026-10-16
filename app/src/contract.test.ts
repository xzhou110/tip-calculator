// FROZEN CONTRACT GUARD (api-contract.md). Do not edit in a build lane.
// Keeps index.html and constants.ts in sync, and proves the input bounds keep the math exact.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FIELDS,
  FIELD_ORDER,
  MAX_BILL_CENTS,
  MAX_PEOPLE,
  MAX_TIP_BP,
  THEME_STORAGE_KEY,
  TIP_PICKS_BP,
} from './constants';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('frozen contract', () => {
  it('the no-flash script in index.html reads the same theme key as the app', () => {
    expect(indexHtml).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });

  it('index.html carries the title marker the live check asserts', () => {
    expect(indexHtml).toContain('<title>Tip Calculator</title>');
  });

  it('index.html carries the build-commit placeholder that vite.config.ts stamps', () => {
    expect(indexHtml).toContain('<meta name="build-commit" content="__BUILD_COMMIT__" />');
  });

  it('defaults, quick picks and field order match the contract', () => {
    expect(DEFAULT_FIELDS).toEqual({ bill: '', tip: '20', people: '2' });
    expect(TIP_PICKS_BP).toEqual([1500, 1800, 2000, 2500]);
    expect(FIELD_ORDER).toEqual(['bill', 'tip', 'people']);
  });

  it('the input bounds keep every intermediate value an exact integer', () => {
    expect(Number.isSafeInteger(MAX_BILL_CENTS * MAX_TIP_BP + 5000)).toBe(true);
    expect(Number.isSafeInteger(2 * MAX_BILL_CENTS + MAX_PEOPLE)).toBe(true);
  });
});
