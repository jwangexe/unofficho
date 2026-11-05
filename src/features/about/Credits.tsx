import { REVIEWERS } from '@/data/credits';
import { TITLES } from '@/app/seo';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

export default function Credits() {
  useDocumentTitle(TITLES.credits);
  return (
    <Page title="Credits">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        The people who have checked UnoffIChO's content for accuracy. Every question and Book page starts out marked "unreviewed"; the label
        comes off once a reviewer has checked it. To review a topic you know well, send a suggestion from the speech-bubble button at the
        top.
      </p>
      {REVIEWERS.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-muted">Reviewers will be listed here.</p>
      ) : (
        <ul className="space-y-2">
          {REVIEWERS.map((r) => (
            <li key={r.name} className="rounded-xl bg-surface p-3">
              <span className="font-semibold">{r.name}</span>
              {r.reviewed && <span className="block text-sm text-muted">{r.reviewed}</span>}
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
