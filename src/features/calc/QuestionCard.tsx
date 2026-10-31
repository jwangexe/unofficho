import { useEffect, useRef, useState } from 'react';
import { checkAnswer } from '@/engine/check';
import { getUnit } from '@/engine/units';
import type { CalcInstance, CalcTemplate } from '@/engine/template';
import { itemId } from '@/storage/progress';
import { answer } from '../answer';
import { DISCLAIMER } from '@/app/brand';
import { FlagButton } from '@/ui/FlagButton';
import { Tex } from '@/ui/Tex';
import { ARITH } from './ArithPanel';
import { ChipButton } from './ChipButton';
import type { ComputeOutput } from './FormulaPanel';
import { OperationSheet, type SheetMode } from './OperationSheet';
import { RouteList } from './RouteList';
import { ResultPanel } from './ResultPanel';
import { useCalcStore } from './store';

import { TOPIC_TAG } from './topics';

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Elapsed time since the card first became active; stops once answered. */
function useCardTimer(active: boolean, stopped: boolean) {
  const start = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  if (active && start.current === null) start.current = Date.now();
  useEffect(() => {
    if (!active || stopped) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, stopped]);
  return start.current === null ? 0 : Math.max(0, now - start.current);
}

const barBtn = 'min-h-12 rounded-xl px-4 font-medium active:opacity-70 disabled:opacity-40';

export function QuestionCard({
  inst,
  template: t,
  mode = 'feed',
  exam = false,
  active = true,
  onNext,
  onSheetChange,
}: {
  inst: CalcInstance;
  template: CalcTemplate;
  mode?: string;
  /** Exam mode: strict units, no explanation before answering, timer shown. */
  exam?: boolean;
  active?: boolean;
  onNext: () => void;
  onSheetChange: (open: boolean) => void;
}) {
  const card = useCalcStore((s) => s.cards[inst.key]);
  const { addStep, undo, setResult, markRecorded, reveal } = useCalcStore.getState();
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheetState] = useState<SheetMode | null>(null);
  const elapsed = useCardTimer(exam && active, !!card?.result);
  const elapsedAtSubmit = useRef<number | null>(null);

  if (!card) return null;

  const setSheet = (m: SheetMode | null) => {
    setSheetState(m);
    onSheetChange(m !== null);
  };

  const selectedChip = card.chips.find((c) => c.id === selected);
  const computed = card.chips.filter((c) => c.source === 'step');

  const onCompute = (out: ComputeOutput) => {
    addStep(inst.key, out.step, out.chip);
    setSheet(null);
    setSelected(null);
  };

  const submit = () => {
    if (!selectedChip) return;
    const result = checkAnswer(t, inst, selectedChip.q, computed.map((c) => c.q));
    setResult(inst.key, result);
    setSelected(null);
    elapsedAtSubmit.current ??= elapsed;
    if (!card.recorded) {
      markRecorded(inst.key);
      void answer({
        itemId: itemId.calc(t.id),
        section: 'calc',
        topic: t.topic,
        score: result.correct ? 1 : 0,
        mode,
        meta: {
          seed: inst.seed,
          steps: card.steps.length,
          revealed: card.revealed,
          diagnoses: result.diagnoses,
          ...(exam && { timeMs: elapsed }),
        },
      });
    }
  };

  const convertDef = ARITH.find((d) => d.op === 'convert')!;

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={t.title}>
      <header className="flex items-center gap-2 px-4 pt-2">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">{TOPIC_TAG[t.topic] ?? t.topic}</span>
        {!t.reviewed && (
          <span className="text-xs text-muted" title="Not yet checked for accuracy">
            unreviewed
          </span>
        )}
        <span className="flex-1" />
        {exam ? (
          <span className="tabular-nums text-sm text-muted" aria-label="Time on this question" role="timer">
            ⏱ {mmss(card.result ? (elapsedAtSubmit.current ?? elapsed) : elapsed)}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => reveal(inst.key)}
            disabled={card.revealed}
            data-tour="explain"
            className="min-h-11 px-2 text-sm text-muted disabled:opacity-50"
          >
            Explain
          </button>
        )}
        <FlagButton itemId={itemId.calc(t.id)} section="calc" context={`seed ${inst.seed}: ${inst.text}`} />
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <p className="text-[17px] leading-relaxed" data-tour="question">
          {inst.text}
        </p>
        <p className="text-sm text-muted">
          Find <span className="font-semibold text-text">{t.answer.label}</span>
          {getUnit(t.answer.unit).symbol && <> ({getUnit(t.answer.unit).symbol})</>}.{' '}
          {exam ? 'Exam mode: units are not converted for you.' : 'Tap a chip to select it, or start an operation.'}
        </p>

        <div className="flex flex-wrap gap-2" aria-label="Given quantities" data-tour="givens">
          {card.chips
            .filter((c) => c.source === 'given')
            .map((c) => (
              <ChipButton key={c.id} chip={c} selected={selected === c.id} onClick={() => setSelected(selected === c.id ? null : c.id)} />
            ))}
        </div>

        {card.steps.length > 0 && (
          <ol className="space-y-2" aria-label="Your steps">
            {card.steps.map((s) => {
              const chip = card.chips.find((c) => c.id === s.output)!;
              return (
                <li key={s.id} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted">{s.title}</p>
                  {s.latex && (
                    <div className="my-1 overflow-x-auto overflow-y-hidden text-sm">
                      <Tex>{s.latex}</Tex>
                    </div>
                  )}
                  <ChipButton chip={chip} selected={selected === chip.id} onClick={() => setSelected(selected === chip.id ? null : chip.id)} />
                  {s.warnings.map((w) => (
                    <p key={w} className="mt-1 text-xs text-warn">
                      {w}
                    </p>
                  ))}
                </li>
              );
            })}
          </ol>
        )}

        {card.result && <ResultPanel result={card.result} template={t} inst={inst} />}

        {card.revealed && !card.result && (
          <section className="rounded-2xl bg-surface p-4" aria-label="Explanation">
            <p className="mb-3 text-sm leading-relaxed">{t.explanation}</p>
            <RouteList template={t} inst={inst} />
          </section>
        )}

        <p className="pt-4 text-center text-xs leading-snug text-muted">{DISCLAIMER}</p>
      </div>

      <div className="flex gap-2 border-t border-border bg-bg px-4 py-2" data-tour="actions">
        {card.result ? (
          <>
            {!card.result.correct && (
              <button type="button" className={`${barBtn} bg-surface-2`} onClick={() => setResult(inst.key, undefined)}>
                Try again
              </button>
            )}
            <button type="button" className={`${barBtn} flex-1 bg-accent text-accent-ink`} onClick={onNext}>
              Next ↓
            </button>
          </>
        ) : selectedChip ? (
          <>
            <button type="button" className={`${barBtn} flex-1 bg-accent text-accent-ink`} onClick={submit}>
              Submit {selectedChip.label}
            </button>
            <button type="button" className={`${barBtn} bg-surface-2`} onClick={() => setSheet({ kind: 'arith', def: convertDef, initial: selectedChip })}>
              Convert
            </button>
            <button type="button" className={`${barBtn} bg-surface-2`} aria-label="Deselect" onClick={() => setSelected(null)}>
              ✕
            </button>
          </>
        ) : (
          <>
            <button type="button" className={`${barBtn} bg-surface-2`} disabled={card.steps.length === 0} onClick={() => undo(inst.key)}>
              Undo
            </button>
            <button type="button" className={`${barBtn} flex-1 bg-accent text-accent-ink`} onClick={() => setSheet({ kind: 'pick' })}>
              + Operation
            </button>
            <button type="button" className={`${barBtn} bg-surface-2`} onClick={onNext} aria-label="Skip to next question">
              ↓
            </button>
          </>
        )}
      </div>

      <OperationSheet
        mode={sheet}
        setMode={setSheet}
        onClose={() => setSheet(null)}
        chips={card.chips}
        topic={t.topic}
        strictUnits={exam}
        onCompute={onCompute}
      />
    </article>
  );
}
