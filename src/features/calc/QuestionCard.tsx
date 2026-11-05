import { useEffect, useMemo, useRef, useState } from 'react';
import { checkAnswer } from '@/engine/check';
import { getUnit } from '@/engine/units';
import type { CalcInstance, CalcTemplate } from '@/engine/template';
import { itemId } from '@/storage/progress';
import { answer } from '../answer';
import { FlagButton } from '@/ui/FlagButton';
import { Tex } from '@/ui/Tex';
import { ARITH } from './ArithPanel';
import { ChipButton } from './ChipButton';
import type { ComputeOutput } from './FormulaPanel';
import { OperationSheet, WorkPanel, type SheetMode } from './OperationSheet';
import { PickContext, type PickRouter } from './pick';
import { RouteList } from './RouteList';
import { ResultPanel } from './ResultPanel';
import { DerivationLinks } from '../book/DerivationLink';
import { templateFormulas } from '@/data/templates';
import { partLetter } from '@/engine/caseStudy';
import { useCalcStore, type Chip } from './store';
import { HINT_TEXT, useOnboarding } from './onboarding';
import { useLevelStore } from '../level/store';
import { Rad } from '@/ui/Rad';
import { tableQuantities } from '@/engine/table';

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

/** Height of the pinned chip strip: a 44 px chip, 8 px padding above and below, and a 1 px border. */
const STRIP_HEIGHT = 61;

const barBtn = 'min-h-12 rounded-xl px-4 font-medium active:opacity-70 disabled:opacity-40';

export function QuestionCard({
  inst,
  template: t,
  mode = 'feed',
  exam = false,
  examSeconds,
  active = true,
  onNext,
  onSheetChange,
}: {
  inst: CalcInstance;
  template: CalcTemplate;
  mode?: string;
  /** Exam mode: strict units, no explanation before answering, timer shown. */
  exam?: boolean;
  /** Exam mode: the target time per question at the student's level. */
  examSeconds?: number;
  active?: boolean;
  onNext: () => void;
  onSheetChange: (open: boolean) => void;
}) {
  const card = useCalcStore((s) => s.cards[inst.key]);
  const { addStep, undo, setResult, markRecorded, reveal, setTable } = useCalcStore.getState();
  const [selected, setSelected] = useState<string | null>(null);
  const onboarding = useOnboarding();
  // Rad's hints: on the card in view, never while the level picker is up.
  const levelChosen = useLevelStore((s) => s.level !== null);
  const showHints = onboarding.hints && active && levelChosen && !exam;
  const [sheet, setSheetState] = useState<SheetMode | null>(null);
  const elapsed = useCardTimer(exam && active, !!card?.result);
  const elapsedAtSubmit = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const working = sheet !== null && sheet.kind !== 'pick';
  // A panel opens under the question: scroll it up to just below the pinned strip, so the chips and the panel are both on screen.
  useEffect(() => {
    if (!working) return;
    const id = setTimeout(() => panelRef.current?.scrollIntoView?.({ block: 'start' }), 50);
    return () => clearTimeout(id);
  }, [working]);
  // Once the chips scroll out of view, a one-row copy floats over the top of the card. It sits on top rather than in the
  // page, so showing it never moves anything: a bar that resized in place made the scroll jump and the bar flicker. It
  // appears once what is left of the chips would sit under it, so no chip shows twice.
  const chipsRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const block = chipsRef.current;
    if (!block || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPinned(!!e!.rootBounds && e!.boundingClientRect.bottom <= e!.rootBounds.top), {
      root: block.closest('.overflow-y-auto'),
      rootMargin: `-${STRIP_HEIGHT}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    io.observe(block);
    return () => io.disconnect();
  }, [card === undefined]);
  // A new result goes at the end of the strip: slide it along to show it.
  const stripRef = useRef<HTMLDivElement>(null);
  const results = card?.chips.filter((c) => c.source === 'step').length ?? 0;
  useEffect(() => {
    stripRef.current?.scrollTo?.({ left: stripRef.current.scrollWidth, behavior: 'smooth' });
  }, [results, pinned]);
  // An open panel waiting for a chip takes taps on the question's chips; the latest one to ask wins.
  const pickers = useRef<{ id: symbol; pick: (chip: Chip) => void }[]>([]);
  const [picking, setPicking] = useState(false);
  const router = useMemo<PickRouter>(
    () => ({
      add: (id, pick) => {
        pickers.current.push({ id, pick });
        setPicking(true);
      },
      remove: (id) => {
        pickers.current = pickers.current.filter((p) => p.id !== id);
        setPicking(pickers.current.length > 0);
      },
    }),
    [],
  );

  if (!card) return null;

  const setSheet = (m: SheetMode | null) => {
    setSheetState(m);
    onSheetChange(m !== null);
  };

  const tapChip = (chip: Chip) => {
    const picker = pickers.current.at(-1);
    if (picker) picker.pick(chip);
    else {
      setSelected(selected === chip.id ? null : chip.id);
      onboarding.reach('operate');
    }
  };

  const selectedChip = card.chips.find((c) => c.id === selected);
  const computed = card.chips.filter((c) => c.source === 'step');

  const onCompute = (out: ComputeOutput) => {
    addStep(inst.key, out.step, out.chip);
    onboarding.markFirstOp();
    onboarding.reach('submit');
    // A table stays open: several of its values may be wanted.
    if (sheet?.kind !== 'table') setSheet(null);
    setSelected(null);
  };

  const submit = () => {
    if (!selectedChip) return;
    const result = checkAnswer(t, inst, selectedChip.q, [...computed.map((c) => c.q), ...tableQuantities(card.table)]);
    setResult(inst.key, result);
    setSelected(null);
    if (onboarding.hints) onboarding.finishHints();
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

  // Givens, then your results after a divider: shown in the question and in the pinned strip.
  const chipButtons = (
    <>
      {card.chips
        .filter((c) => c.source === 'given')
        .map((c) => (
          <ChipButton key={c.id} chip={c} selected={selected === c.id} onClick={() => tapChip(c)} />
        ))}
      {computed.length > 0 && <span aria-hidden className="w-px self-stretch bg-border" />}
      {computed.map((c) => (
        <ChipButton key={c.id} chip={c} selected={selected === c.id} onClick={() => tapChip(c)} />
      ))}
    </>
  );

  const convertDef = ARITH.find((d) => d.op === 'convert')!;

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={t.title}>
      <header className="flex items-center gap-2 px-4 pt-2">
        <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs text-muted">{TOPIC_TAG[t.topic] ?? t.topic}</span>
        {!t.reviewed && (
          <span className="text-xs text-muted" title="Not yet checked for accuracy">
            unreviewed
          </span>
        )}
        <span className="flex-1" />
        {exam ? (
          <span
            className={`tabular-nums text-sm ${examSeconds && elapsed > examSeconds * 1000 && !card.result ? 'text-warn' : 'text-muted'}`}
            aria-label={examSeconds ? `Time on this question, target ${mmss(examSeconds * 1000)}` : 'Time on this question'}
            role="timer"
          >
            ⏱ {mmss(card.result ? (elapsedAtSubmit.current ?? elapsed) : elapsed)}
            {examSeconds ? ` / ${mmss(examSeconds * 1000)}` : ''}
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

      <div className="relative flex min-h-0 flex-1 flex-col">
        {pinned && (
          <div
            ref={stripRef}
            className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto border-b border-border bg-bg px-4 py-2 [scrollbar-width:none] [&>*]:shrink-0"
            aria-label="Pinned chips"
          >
            {chipButtons}
          </div>
        )}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
          {inst.intro && t.caseStudy && (
            // The stem: open on the first part, folded away (but a tap from re-reading) on later ones.
            <details open={t.caseStudy.part === 1} className="group rounded-xl border border-border bg-surface p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-accent [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  Case study: {t.caseStudy.title} · part ({partLetter(t.caseStudy.part)}) of {t.caseStudy.parts}
                </span>
                <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed">{inst.intro}</p>
            </details>
          )}
          <p className="text-[17px] leading-relaxed" data-tour="question">
            {inst.text}
          </p>
          <p className="text-sm text-muted">
            Find <span className="font-semibold text-text">{t.answer.label}</span>
            {getUnit(t.answer.unit).symbol && <> ({getUnit(t.answer.unit).symbol})</>}.{' '}
            {picking
              ? 'Tap a chip to put it in the slot below.'
              : exam
                ? 'Exam mode: units are not converted for you.'
                : onboarding.firstOpDone
                  ? ''
                  : 'Tap a chip to select it, or start an operation.'}
          </p>

          <div ref={chipsRef} className="flex flex-wrap gap-2" aria-label="Givens and results" data-tour="givens">
            {chipButtons}
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
                    <ChipButton chip={chip} selected={selected === chip.id} onClick={() => tapChip(chip)} />
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

          {working && (
            <div ref={panelRef} className="scroll-mt-16">
              <PickContext.Provider value={router}>
                <WorkPanel
                  mode={sheet}
                  setMode={setSheet}
                  onClose={() => setSheet(null)}
                  chips={card.chips}
                  levels={t.levels}
                  strictUnits={exam}
                  table={card.table}
                  onTableChange={(table) => setTable(inst.key, table)}
                  onCompute={onCompute}
                />
              </PickContext.Provider>
            </div>
          )}

          {card.result && <ResultPanel result={card.result} template={t} inst={inst} />}

          {card.revealed && !card.result && (
            <section className="rounded-2xl bg-surface p-4" aria-label="Explanation">
              <p className="mb-3 text-sm leading-relaxed">{t.explanation}</p>
              <RouteList template={t} inst={inst} />
            </section>
          )}

          {/* After answering (or asking for the explanation): where the formulas used come from. */}
          {(card.result || card.revealed) && <DerivationLinks formulas={templateFormulas(t)} />}
        </div>
      </div>

      {showHints && !card.result && (
        <aside aria-label="Tip from Rad" aria-live="polite" className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2">
          <Rad pose="pointing" size={44} className="shrink-0" />
          <p className="min-w-0 flex-1 text-sm leading-snug">
            <span className="block text-xs font-semibold text-accent">{HINT_TEXT[onboarding.stage].title}</span>
            {HINT_TEXT[onboarding.stage].text}
          </p>
          <button type="button" onClick={onboarding.finishHints} aria-label="Hide tips" className="grid size-11 shrink-0 place-items-center text-muted">
            ✕
          </button>
        </aside>
      )}
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
            <button
              type="button"
              className={`${barBtn} bg-surface-2`}
              onClick={() =>
                setSheet({
                  kind: 'arith',
                  def: convertDef,
                  initial: selectedChip,
                })
              }
            >
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

      <OperationSheet mode={sheet} setMode={setSheet} onClose={() => setSheet(null)} topic={t.topic} levels={t.levels} table={card.table} />
    </article>
  );
}
