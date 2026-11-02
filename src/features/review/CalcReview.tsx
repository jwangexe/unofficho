import { useMemo, useState } from 'react';
import { calcTemplateById } from '@/data/templates';
import { describeNode } from '@/engine/approach';
import { formatQuantity } from '@/engine/quantity';
import { instantiate } from '@/engine/template';
import { getUnit } from '@/engine/units';
import { Tex } from '@/ui/Tex';
import { ReviewActions } from './ReviewActions';
import { compareAnswer, parseAnswer, sampleAnswers, spreadDecades, type Comparison, type QueueItem } from './reviewLogic';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

const box = 'rounded-2xl bg-surface p-4';
const h = 'mb-2 text-xs font-semibold tracking-wide text-muted uppercase';

/**
 * Solve blind: question and givens only, enter your answer, then reveal the reference, the
 * step chain with intermediate values, the explanation and every misconception, plus the
 * parameter ranges and 20 sampled answers.
 */
export function CalcReview({ item, onDone }: { item: QueueItem; onDone: (message: string, outcome: 'reviewed' | 'noted') => void }) {
  const t = calcTemplateById.get(item.id)!;
  const [seed, setSeed] = useState(randomSeed);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ cmp: Comparison | null; assumed: boolean } | null>(null);
  const [error, setError] = useState('');

  const inst = useMemo(() => instantiate(t, seed), [t, seed]);
  const samples = useMemo(() => sampleAnswers(t, 20, 1000 + (seed % 1000)), [t, seed]);

  const another = () => {
    setSeed(randomSeed());
    setTyped('');
    setResult(null);
    setError('');
  };

  if (!inst.ok) {
    return (
      <div className={box}>
        <p className="text-bad">This template failed to generate an instance (seed {seed}): {inst.error.message}</p>
        <ReviewActions item={item} onDone={onDone} extra={<AnotherButton onClick={another} />} />
      </div>
    );
  }
  const i = inst.value;
  const reference = formatQuantity(i.expected, 4);
  const unitSym = getUnit(t.answer.unit).symbol;

  const check = () => {
    const parsed = parseAnswer(typed, t.answer.unit, i.expected.kind);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError('');
    setResult({ cmp: compareAnswer(t, i, parsed.q), assumed: parsed.assumedUnit });
  };
  const revealed = result !== null;

  return (
    <div className="space-y-3">
      <section className={box} aria-label="Question">
        <p className="text-xs text-muted">
          {t.id} · difficulty {t.difficulty} · seed {seed}
        </p>
        <p className="mt-2 text-[17px] leading-relaxed">{i.text}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Givens">
          {i.givens.map((g) => (
            <li key={g.key} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
              <span className="font-semibold">{g.label}</span> = {formatQuantity(g.q, g.sig)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Find <span className="font-semibold text-text">{t.answer.label}</span>
          {unitSym && ` (${unitSym})`}.
        </p>
      </section>

      {!revealed && (
        <section className={box} aria-label="Your answer">
          <label className="block text-sm">
            <span className="text-muted">Your answer (number and unit, e.g. 1.2e-3 mol dm^-3; no unit means {unitSym || 'dimensionless'})</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && typed.trim() && check()}
              inputMode="text"
              autoComplete="off"
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 font-mono text-base text-text"
            />
          </label>
          {error && (
            <p className="mt-1 text-sm text-bad" role="alert">
              {error}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={check} disabled={!typed.trim()} className="min-h-11 flex-1 rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40">
              Check and reveal
            </button>
            <button type="button" onClick={() => setResult({ cmp: null, assumed: false })} className="min-h-11 rounded-xl bg-surface-2 px-3 text-sm">
              Reveal without answering
            </button>
          </div>
        </section>
      )}

      {revealed && (
        <>
          <section className={`${box} ${result.cmp && !result.cmp.agrees ? 'ring-2 ring-bad' : ''}`} aria-label="Comparison" role="status">
            <p className="text-sm text-muted">Reference answer</p>
            <p className="text-2xl font-semibold">{reference}</p>
            {result.cmp === null ? (
              <p className="mt-1 text-sm text-muted">No answer entered.</p>
            ) : result.cmp.agrees ? (
              <p className="mt-1 font-semibold text-good">✓ Your answer ({typed}) agrees within the app’s tolerance.</p>
            ) : (
              <p className="mt-1 font-semibold text-bad">
                ✗ Your answer ({typed}){' '}
                {!result.cmp.dimOk
                  ? 'has different units (wrong kind of quantity)'
                  : typeof t.tolerance === 'object'
                    ? `differs by ${(result.cmp.absDiff ?? 0).toPrecision(3)}${unitSym ? ` ${unitSym}` : ''}`
                    : `differs by ${((result.cmp.relDiff ?? 0) * 100).toPrecision(3)}%`}
                . Check which of you is right.
              </p>
            )}
            {result.assumed && <p className="text-xs text-muted">No unit typed: {unitSym || 'dimensionless'} assumed.</p>}
            <p className="mt-1 text-xs text-muted">
              Tolerance: {typeof t.tolerance === 'object' ? `±${t.tolerance.abs} absolute` : `${((t.tolerance ?? 0.01) * 100).toFixed(1)}% relative`}
            </p>
          </section>

          <section className={box} aria-label="Reference steps">
            <h3 className={h}>Reference steps</h3>
            <ol className="space-y-2">
              {t.reference.map((n, k) => {
                const d = describeNode(t, n);
                const v = i.referenceValues[n.id];
                return (
                  <li key={n.id} className="rounded-xl bg-surface-2 p-3 text-sm">
                    <p>
                      {k + 1}. {d.caption}
                    </p>
                    {d.latex && (
                      <div className="overflow-x-auto overflow-y-hidden py-1">
                        <Tex>{d.latex}</Tex>
                      </div>
                    )}
                    {v && <p className="font-semibold">= {formatQuantity(v, 4)}</p>}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={box} aria-label="Explanation">
            <h3 className={h}>Explanation</h3>
            <p className="leading-relaxed">{t.explanation}</p>
            {t.wordings.length > 1 && (
              <>
                <h3 className={`${h} mt-3`}>All wordings</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {t.wordings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {(t.misconceptions?.length ?? 0) > 0 && (
            <section className={box} aria-label="Misconceptions">
              <h3 className={h}>Misconceptions ({t.misconceptions!.length})</h3>
              <ul className="space-y-2 text-sm">
                {t.misconceptions!.map((m) => {
                  const v = i.misconceptionValues.find((x) => x.message === m.message);
                  return (
                    <li key={m.message} className="rounded-xl bg-surface-2 p-3">
                      <p>{m.message}</p>
                      <p className="text-muted">{v ? `This route gives ${formatQuantity(v.q, 4)}` : 'Gives the same value as the reference for this instance (not shown to students).'}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <section className={box} aria-label="Parameter ranges">
        <h3 className={h}>Parameter ranges</h3>
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(t.params).map(([k, p]) => (
              <tr key={k} className="border-b border-border/60 last:border-0">
                <td className="py-1 pr-2 font-mono">{k}</td>
                <td className="py-1">
                  {p.choices ? `one of ${p.choices.join(', ')}` : `${p.min} – ${p.max}`} {getUnit(p.unit).symbol}
                  {p.log && ' (log-uniform)'}
                  {p.displayUnits && ` · shown in ${p.displayUnits.map((u) => getUnit(u).symbol).join(' / ')}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className={`${h} mt-3`}>20 sampled answers</h3>
        <p className="mb-2 text-xs text-muted">
          Spread: {spreadDecades(samples)?.toFixed(1) ?? '–'} orders of magnitude. {samples.filter((s) => s.flags.length).length} flagged.
        </p>
        <ul className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
          {samples.map((s) => (
            <li key={s.seed} title={s.flags.join('; ')} className={`rounded-lg px-2 py-1 tabular-nums ${s.flags.length ? 'bg-bad/15 text-bad' : 'bg-surface-2'}`}>
              {s.value === null ? 'failed' : `${s.value.toPrecision(3)} ${unitSym}`}
              {s.flags.length > 0 && <span className="block text-xs">{s.flags.join('; ')}</span>}
            </li>
          ))}
        </ul>
      </section>

      <ReviewActions
        item={item}
        onDone={onDone}
        instance={{ seed, question: i.text, ...(typed && { myAnswer: typed }), reference, ...(result?.cmp && { agreed: result.cmp.agrees }) }}
        extra={<AnotherButton onClick={another} />}
      />
    </div>
  );
}

function AnotherButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 rounded-xl bg-surface-2 px-3 text-sm font-medium">
      Another instance
    </button>
  );
}
