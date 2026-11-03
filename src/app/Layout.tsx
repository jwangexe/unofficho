import { Suspense, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Logo } from '@/ui/Logo';
import { GearIcon, InfoIcon, MoonIcon, SunIcon } from '@/ui/icons';
import { LevelPicker } from '@/features/level/LevelPicker';
import { useLevelStore } from '@/features/level/store';
import { SuggestButton, SuggestSheet } from '@/features/feedback/Suggest';
import { TabBar } from './TabBar';
import { useTheme } from './theme';

/** Pages that make sense before a level is chosen: no picker over them. */
const NO_PICKER = ['/about', '/inbox', '/review', '/debug', '/settings'];

export function Layout() {
  const { theme, toggle } = useTheme();
  const { loaded, level, load } = useLevelStore();
  useEffect(() => void load(), [load]);
  const { pathname } = useLocation();
  const picker = loaded && level === null && !NO_PICKER.some((p) => pathname.startsWith(p));
  return (
    <>
      <div className="flex h-dvh flex-col" inert={picker}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
        >
          Skip to content
        </a>
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)]">
          <Link to="/" className="py-3 text-lg">
            <Logo />
          </Link>
          <div className="flex items-center">
            <SuggestButton />
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="grid size-11 place-items-center text-muted"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/settings" aria-label="Settings" className="grid size-11 place-items-center text-muted">
              <GearIcon />
            </Link>
            <Link to="/about" aria-label="About" className="grid size-11 place-items-center text-muted">
              <InfoIcon />
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          {/* Hold the screen until the level is known (one IndexedDB read), so feeds start at the right level. */}
          <Suspense fallback={null}>{loaded && <Outlet />}</Suspense>
        </main>
        <TabBar />
        <SuggestSheet />
      </div>
      {picker && <LevelPicker />}
    </>
  );
}
