import { useTheme } from '@/app/theme';
import { LevelSettings } from '@/features/level/LevelChip';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

export default function Settings() {
  useDocumentTitle('Settings');
  const { theme, toggle } = useTheme();
  return (
    <Page title="Settings">
      <section aria-labelledby="settings-level" className="mb-6">
        <h2 id="settings-level" className="mb-1 font-semibold">
          Level
        </h2>
        <p className="mb-3 text-sm text-muted">
          Questions, reagents and Book pages are chosen to match. Your progress on each item is kept whichever level you pick.
        </p>
        <LevelSettings />
      </section>
      <section aria-labelledby="settings-look">
        <h2 id="settings-look" className="mb-3 font-semibold">
          Appearance
        </h2>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-3">
          <span className="flex-1 font-medium">Dark mode</span>
          <input type="checkbox" role="switch" checked={theme === 'dark'} onChange={toggle} className="size-5 shrink-0 accent-accent" />
        </label>
      </section>
    </Page>
  );
}
