import { CHAPTERS } from '@/data/schemas';
import { Page } from '@/ui/Page';
import { Placeholder } from '@/ui/Placeholder';

export default function BookHome() {
  return (
    <Page title="Book">
      <ul className="mb-4 grid grid-cols-2 gap-2">
        {CHAPTERS.map((c) => (
          <li key={c} className="rounded-xl bg-surface p-4 capitalize">
            {c}
          </li>
        ))}
      </ul>
      <Placeholder phase={6} />
    </Page>
  );
}
