import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'theme';

function apply(val) {
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export default function useTheme() {
  const [dark, setDarkState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY) === 'dark';
    apply(saved);
    return saved;
  });

  const setDark = useCallback((next) => {
    const val = typeof next === 'function' ? next(dark) : next;
    localStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
    apply(val);
    setDarkState(val);
  }, [dark]);

  return [dark, setDark];
}
