import type { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onChoose: (theme: Theme) => void;
}

const SEGMENTS: readonly { theme: Theme; label: string }[] = [
  { theme: 'light', label: 'Light' },
  { theme: 'dark', label: 'Dark' },
];

/** The labelled Light | Dark segmented control; pressing the pressed segment does nothing. */
export function ThemeToggle({ theme, onChoose }: ThemeToggleProps) {
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {SEGMENTS.map((segment) => (
        <button
          key={segment.theme}
          type="button"
          aria-pressed={theme === segment.theme}
          onClick={() => onChoose(segment.theme)}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
