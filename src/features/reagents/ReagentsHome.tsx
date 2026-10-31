import { reagents } from '@/data';
import { ROLE_LABELS } from '@/data/schemas';
import { Page } from '@/ui/Page';
import { Placeholder } from '@/ui/Placeholder';

export default function ReagentsHome() {
  return (
    <Page title="Classify the Reagent">
      <Placeholder phase={5}>
        <p className="mt-2">{reagents.length} reagents loaded:</p>
        <ul className="mt-2 space-y-1">
          {reagents.map((r) => (
            <li key={r.id}>
              <span className="text-text">{r.formula}</span> · {ROLE_LABELS[r.primaryRole]}
            </li>
          ))}
        </ul>
      </Placeholder>
    </Page>
  );
}
