import { create } from 'zustand';

export type Theme = 'dark' | 'light';
const KEY = 'unofficho.theme';
const SYSTEM_DARK = '(prefers-color-scheme: dark)';

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

const system = (): Theme => (typeof matchMedia !== 'undefined' && matchMedia(SYSTEM_DARK).matches ? 'dark' : 'light');

/** The student's choice once they have made one; until then, the system's. */
const readTheme = (): Theme => saved() ?? system();

function paint(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1e2b26' : '#faf8f3');
}

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: readTheme(),
  toggle: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    paint(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Storage unavailable (private mode); the choice just won't persist.
    }
    set({ theme });
  },
}));

// No choice yet: follow the system if it switches (e.g. at sunset).
if (typeof matchMedia !== 'undefined') {
  matchMedia(SYSTEM_DARK).addEventListener?.('change', () => {
    if (saved()) return;
    const theme = system();
    paint(theme);
    useTheme.setState({ theme });
  });
}
