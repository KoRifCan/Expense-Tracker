import { useState } from 'react';

const THEME_KEY = 'theme';
const TRANSITION_CLASS = 'theme-transitioning';

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

  const setDark = (next) => {
    const val = typeof next === 'function' ? next(dark) : next;
    const html = document.documentElement;

    html.classList.add(TRANSITION_CLASS);

    requestAnimationFrame(() => {
      localStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
      apply(val);
      setDarkState(val);

      setTimeout(() => {
        html.classList.remove(TRANSITION_CLASS);
      }, 200);
    });
  };

  return [dark, setDark];
}
