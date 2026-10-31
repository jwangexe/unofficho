import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/ui/Logo';
import { InfoIcon, MoonIcon, SunIcon } from '@/ui/icons';
import { TabBar } from './TabBar';
import { useTheme } from './theme';

export function Layout() {
  const { theme, toggle } = useTheme();
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)]">
        <Link to="/" className="py-3 text-lg">
          <Logo />
        </Link>
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid size-11 place-items-center text-muted"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link to="/about" aria-label="About" className="grid size-11 place-items-center text-muted">
            <InfoIcon />
          </Link>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
    </div>
  );
}
