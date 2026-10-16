// Light | Dark with the system as the default (AC7; api-contract.md § Storage Contract).
// index.html's no-flash script has already set <html data-theme> before first paint.
import { useCallback, useEffect, useState } from 'react';
import { readStoredTheme, resolveTheme, writeStoredTheme } from '../lib/theme';
import type { Theme, ThemeStorage } from '../types';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** localStorage, or null where reading it throws (blocked storage, some private modes). */
function browserStorage(): ThemeStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function darkQuery(): MediaQueryList | null {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
  } catch {
    return null;
  }
}

function initialTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  if (applied === 'light' || applied === 'dark') return applied;
  return resolveTheme(readStoredTheme(browserStorage()), darkQuery()?.matches ?? false);
}

export function useTheme(): { theme: Theme; choose: (t: Theme) => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  // Once the user picks, the page stops following the system (for this session even if storage is blocked).
  const [chosen, setChosen] = useState(() => readStoredTheme(browserStorage()) !== null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // While no choice is stored, follow a live system change; this writes nothing.
  useEffect(() => {
    if (chosen) return undefined;
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [chosen]);

  const choose = useCallback(
    (next: Theme) => {
      if (next === theme) return; // pressing the pressed segment does nothing and writes nothing
      writeStoredTheme(browserStorage(), next);
      setChosen(true);
      setTheme(next);
    },
    [theme],
  );

  return { theme, choose };
}
