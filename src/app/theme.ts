import { create } from 'zustand';

export type Theme = 'dark' | 'light';
const KEY = 'unofficho.theme';

function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0f1117' : '#f6f7f9');
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: readTheme(),
  toggle: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    set({ theme });
  },
}));
