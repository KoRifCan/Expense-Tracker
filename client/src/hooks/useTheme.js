import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'theme';
const THEME_EVENT = 'themechange';

function getInitial() {
  return localStorage.getItem(THEME_KEY) === 'dark';
}

export default function useTheme() {
  const [dark, setDarkState] = useState(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    const handler = () => setDarkState(getInitial());
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  const setDark = useCallback((next) => {
    const val = typeof next === 'function' ? next(getInitial()) : next;
    localStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', val);
    setDarkState(val);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return [dark, setDark];
}
