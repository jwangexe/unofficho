import { CHANGELOG } from '@/data/changelog';
import { TITLES } from '@/app/seo';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function Changelog() {
  useDocumentTitle(TITLES.changelog);
  return (
    <Page title="What's new">
      <ol className="space-y-4">
        {CHANGELOG.map((e, i) => (
          <li key={i} className="border-l-2 border-accent/40 pl-3">
            <time dateTime={e.date} className="text-xs font-semibold text-muted">
              {day(e.date)}
            </time>
            <p className="mt-0.5 leading-relaxed">{e.text}</p>
          </li>
        ))}
      </ol>
    </Page>
  );
}
