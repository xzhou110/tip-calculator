import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '../constants';
import type { ThemeStorage } from '../types';
import { readStoredTheme, resolveTheme, writeStoredTheme } from './theme';

function fakeStorage(initial: Record<string, string> = {}): ThemeStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

const throwing: ThemeStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('resolveTheme', () => {
  it.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    [null, true, 'dark'],
    [null, false, 'light'],
    ['blue', false, 'light'],
    ['blue', true, 'dark'],
    ['Dark', false, 'light'],
  ] as const)('resolveTheme(%j, %s) is %s', (stored, systemDark, out) => {
    expect(resolveTheme(stored, systemDark)).toBe(out);
  });
});

describe('readStoredTheme', () => {
  it('is null without storage, without the key, for another value, or when getItem throws', () => {
    expect(readStoredTheme(null)).toBeNull();
    expect(readStoredTheme(fakeStorage())).toBeNull();
    expect(readStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBeNull();
    expect(readStoredTheme(throwing)).toBeNull();
  });

  it('reads the namespaced key only, never the template key appTheme', () => {
    expect(readStoredTheme(fakeStorage({ appTheme: 'dark' }))).toBeNull();
    expect(readStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
    expect(readStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });
});

describe('writeStoredTheme', () => {
  it('writes the choice under the namespaced key', () => {
    const storage = fakeStorage();
    writeStoredTheme(storage, 'dark');
    expect(storage.data).toEqual({ [THEME_STORAGE_KEY]: 'dark' });
    expect(readStoredTheme(storage)).toBe('dark');
  });

  it('is silent when storage is missing or setItem throws', () => {
    expect(() => writeStoredTheme(null, 'dark')).not.toThrow();
    expect(() => writeStoredTheme(throwing, 'light')).not.toThrow();
  });
});
