import type { Theme } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  theme: Theme;
  onChooseTheme: (theme: Theme) => void;
}

export function Header({ theme, onChooseTheme }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="title">Tip Calculator</h1>
      <ThemeToggle theme={theme} onChoose={onChooseTheme} />
    </header>
  );
}
