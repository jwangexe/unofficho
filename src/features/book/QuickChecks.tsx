import { useState } from 'react';
import { quickCheckItemId, type BookPage } from '@/data/book';
import type { QuickCheck } from '@/data/schemas';
import { db } from '@/storage/db';
import { Tex } from '@/ui/Tex';

/** Text from YAML with optional inline $…$ maths. */
export function RichText({ children }: { children: string }) {
  const parts = children.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((s, i) => (s.startsWith('$') && s.endsWith('$') && s.length > 2 ? <Tex key={i}>{s.slice(1, -1)}</Tex> : s))}
    </>
  );
}

function record(page: BookPage, q: QuickCheck, score: number) {
  void db.attempts.add({
    itemId: quickCheckItemId(page.id, q.id),
    section: 'book',
    topic: `${page.chapter}/${page.section}`,
    ts: Date.now(),
    score,
    mode: 'quick-check',
  });
}

function Mcq({ page, q }: { page: BookPage; q: Extract<QuickCheck, { type: 'mcq' }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const pick = (i: number) => {
    if (done) return;
    setPicked(i);
    record(page, q, i === q.answer ? 1 : 0);
  };
  return (
    <>
      <div className="mt-3 grid gap-2" role="group" aria-label="Options">
        {q.options.map((o, i) => {
          const state = !done ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'other';
          const cls = {
            idle: 'border-border bg-surface-2',
            right: 'border-good bg-good/10',
            wrong: 'border-bad bg-bad/10',
            other: 'border-border bg-surface-2 opacity-60',
          }[state];
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              aria-disabled={done}
              className={`min-h-12 rounded-xl border px-3 py-2 text-left text-[0.95rem] ${cls}`}
            >
              <RichText>{o}</RichText>
              {state === 'right' && <span className="sr-only"> (correct answer)</span>}
              {state === 'wrong' && <span className="sr-only"> (your answer, incorrect)</span>}
            </button>
          );
        })}
      </div>
      {done && (
        <p className="mt-3 text-sm leading-relaxed" aria-live="polite">
          <span className={`font-semibold ${picked === q.answer ? 'text-good' : 'text-bad'}`}>
            {picked === q.answer ? 'Correct. ' : 'Not quite. '}
          </span>
          <RichText>{q.explanation}</RichText>
        </p>
      )}
    </>
  );
}

function Reveal({ page, q }: { page: BookPage; q: Extract<QuickCheck, { type: 'reveal' }> }) {
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState<number | null>(null);
  const grade = (score: number) => {
    if (graded !== null) return;
    setGraded(score);
    record(page, q, score);
  };
  if (!shown) {
    return (
      <button type="button" onClick={() => setShown(true)} className="mt-3 min-h-12 w-full rounded-xl bg-surface-2 font-medium">
        Think, then show answer
      </button>
    );
  }
  return (
    <>
      <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[0.95rem] leading-relaxed">
        <RichText>{q.answer}</RichText>
      </p>
      {graded === null ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => grade(0)} className="min-h-12 rounded-xl border border-bad/60 font-medium">
            Missed it
          </button>
          <button type="button" onClick={() => grade(1)} className="min-h-12 rounded-xl border border-good/60 font-medium">
            Got it
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          Recorded as {graded ? 'got it' : 'missed'}.
        </p>
      )}
    </>
  );
}

export function QuickChecks({ page }: { page: BookPage }) {
  if (!page.quickChecks.length) return null;
  return (
    <section aria-labelledby="qc-heading" className="mt-8">
      <h2 id="qc-heading" className="mb-2 text-lg font-semibold">
        Quick check
      </h2>
      <ol className="space-y-3">
        {page.quickChecks.map((q, i) => (
          <li key={q.id} className="rounded-2xl bg-surface p-4">
            <p className="text-xs text-muted">
              {i + 1} of {page.quickChecks.length}
            </p>
            <p className="mt-1 leading-relaxed">
              <RichText>{q.prompt}</RichText>
            </p>
            {q.type === 'mcq' ? <Mcq page={page} q={q} /> : <Reveal page={page} q={q} />}
          </li>
        ))}
      </ol>
    </section>
  );
}
