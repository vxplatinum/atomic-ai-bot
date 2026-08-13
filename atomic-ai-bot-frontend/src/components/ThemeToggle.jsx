import { useEffect, useState } from 'react';
import lightModeIcon from '../assets/light-mode.png';
import darkModeIcon from '../assets/dark-mode.png';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="inline-flex items-center justify-center rounded-[4px] bg-surface border border-line text-brand hover:bg-line/20 transition-colors flex items-center justify-center w-6 h-6"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <img
        src={isDark ? darkModeIcon : lightModeIcon}
        alt=""
        className="w-4 h-4 object-contain pointer-events-none"
      />
    </button>
  );
}
