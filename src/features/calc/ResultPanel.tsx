import type { CheckResult } from '@/engine/check';
import { formatQuantity } from '@/engine/quantity';
import type { CalcInstance, CalcTemplate } from '@/engine/template';
import { RouteList } from './RouteList';

export function ResultPanel({ result, template, inst }: { result: CheckResult; template: CalcTemplate; inst: CalcInstance }) {
  const { correct } = result;
  return (
    <div role="status" className={`rounded-2xl border p-4 ${correct ? 'border-good/50' : 'border-bad/50'}`}>
      <p className={`mb-2 text-lg font-semibold ${correct ? 'text-good' : 'text-bad'}`}>{correct ? '✓ Correct' : '✗ Not quite'}</p>
      <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Expected</dt>
        <dd>
          {template.answer.label} = {formatQuantity(result.expected, 3)}
        </dd>
        <dt className="text-muted">Yours</dt>
        <dd>{formatQuantity(result.submitted, 4)}</dd>
      </dl>
      {result.diagnoses.length > 0 && (
        <ul className="mb-3 space-y-1 text-sm">
          {result.diagnoses.map((d) => (
            <li key={d} className="rounded-lg bg-surface-2 px-3 py-2">
              {d}
            </li>
          ))}
        </ul>
      )}
      <p className="mb-2 text-xs text-muted">
        Reference route: you reached {result.matched.length} of {result.matched.length + result.missed.length} steps (any order or
        equivalent route counts)
      </p>
      <RouteList template={template} inst={inst} matched={result.matched} />
    </div>
  );
}
