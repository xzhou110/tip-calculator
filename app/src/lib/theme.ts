// Theme resolution and storage (api-contract.md § Storage Contract). Pure: storage is passed in.
// The same rule runs in index.html's no-flash script before first paint.
import { THEME_STORAGE_KEY } from '../constants';
import type { Theme, ThemeStorage } from '../types';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** A stored 'light' or 'dark' wins; anything else follows the system setting. */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return systemPrefersDark ? 'dark' : 'light';
}

/** null for missing storage, an absent key, any other value, or a getItem that throws. */
export function readStoredTheme(storage: ThemeStorage | null): Theme | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Writes the choice; a thrown setItem (quota, blocked storage) is swallowed. */
export function writeStoredTheme(storage: ThemeStorage | null, theme: Theme): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Blocked or full storage: the toggle still switches the page for this session.
  }
}
