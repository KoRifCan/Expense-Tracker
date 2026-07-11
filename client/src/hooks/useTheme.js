import { useState } from 'react';

const THEME_KEY = 'theme';

export default function useTheme() {
  const [dark, setDarkState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY) === 'dark';
    if (saved) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return saved;
  });

  const setDark = (next) => {
    const val = typeof next === 'function' ? next(dark) : next;
    localStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setDarkState(val);
  };

  return [dark, setDark];
}
