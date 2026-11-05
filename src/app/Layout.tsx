import { Suspense, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Logo } from '@/ui/Logo';
import { GearIcon, InfoIcon, MoonIcon, SunIcon } from '@/ui/icons';
import { LevelPicker } from '@/features/level/LevelPicker';
import { useLevelStore } from '@/features/level/store';
import { SuggestButton, SuggestSheet } from '@/features/feedback/Suggest';
import { TabBar } from './TabBar';
import { useTheme } from './theme';

/** Pages whose content depends on the level: the picker covers them until one is chosen. Others (About, guides, a 404) read fine without. */
const PICKER = /^\/($|calc|reagents|book|progress)/;

export function Layout() {
  const { theme, toggle } = useTheme();
  const { loaded, level, load } = useLevelStore();
  useEffect(() => void load(), [load]);
  const { pathname } = useLocation();
  const picker = loaded && level === null && PICKER.test(pathname);
  // The pages share one scroller: start each new page at its top, not where the last one was left.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo?.(0, 0);
  }, [pathname]);
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
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="py-3 text-lg">
              <Logo />
            </Link>
            {/* A phone has room for "New" beside the four icons, not "What's new". */}
            <Link
              to="/changelog"
              aria-label="What's new"
              className="rounded-md bg-accent/15 px-2 py-1 text-xs font-medium whitespace-nowrap text-accent"
            >
              <span className="hidden min-[400px]:inline">What's new</span>
              <span className="min-[400px]:hidden">New</span>
            </Link>
          </div>
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
        <main ref={mainRef} id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
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
