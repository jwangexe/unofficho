import { useState } from 'react';
import { formulaInScope, levelRank, LEVELS, type LevelId } from '@/data/levels';
import { FORMULAS, formulaById } from '@/engine/formulas';
import { Sheet } from '@/ui/Sheet';
import { Tex } from '@/ui/Tex';
import { ARITH, ArithPanel, type ArithDef } from './ArithPanel';
import { FormulaPanel, type ComputeOutput } from './FormulaPanel';
import { TablePanel } from './TablePanel';
import type { CalcTable } from '@/engine/table';
import type { Chip } from './store';
import { useLevelPrefs, useLevelStore } from '../level/store';

export type SheetMode = { kind: 'pick' } | { kind: 'formula'; id: string } | { kind: 'arith'; def: ArithDef; initial?: Chip } | { kind: 'table' };

const TOPIC_NAMES: Record<string, string> = {
  stoich: 'Stoichiometry',
  thermo: 'Thermodynamics',
  kinetics: 'Kinetics',
  equilibrium: 'Equilibrium & acids',
  electro: 'Electrochemistry',
  other: 'Spectroscopy & other',
};

/** The level whose formulas the sheet lists: the student's, or the question's own when it is above it (opened from a link). */
function sheetLevel(level: LevelId, itemLevels: readonly LevelId[]): LevelId {
  if (itemLevels.length === 0 || itemLevels.some((l) => levelRank(l) <= levelRank(level))) return level;
  return [...itemLevels].sort((a, b) => levelRank(a) - levelRank(b))[0]!;
}

/** The formulas to offer for a question: those within the level, or all of them when the setting is on. */
function useVisibleFormulas(levels: readonly LevelId[]) {
  const scope = sheetLevel(useLevelPrefs().level, levels);
  const allFormulas = useLevelStore((s) => s.allFormulas);
  const setAllFormulas = useLevelStore((s) => s.setAllFormulas);
  const visible = allFormulas ? FORMULAS : FORMULAS.filter((f) => formulaInScope(scope, f.id));
  const hidden = FORMULAS.filter((f) => !formulaInScope(scope, f.id)).length;
  return { scope, allFormulas, setAllFormulas, visible, hidden };
}

/** Choosing an operation. The operation itself opens under the question (WorkPanel), not in this sheet. */
export function OperationSheet({
  mode,
  setMode,
  onClose,
  topic,
  levels,
  table,
}: {
  mode: SheetMode | null;
  setMode: (m: SheetMode) => void;
  onClose: () => void;
  topic: string;
  /** The question's levels, so a question above the student's level still lists its formulas. */
  levels: readonly LevelId[];
  table: CalcTable | undefined;
}) {
  const [tab, setTab] = useState<'formulas' | 'maths' | 'table'>('formulas');
  const [showAll, setShowAll] = useState(false);
  // Formulas beyond the level are hidden unless "Show all formulas" is on.
  const { scope, allFormulas, setAllFormulas, visible, hidden } = useVisibleFormulas(levels);

  // Stoichiometry (n = m/M, c = n/V…) is pinned first for every question; then the question's topic.
  const PINNED = 'stoich';
  const pinnedFormulas = visible.filter((f) => f.topic === PINNED);
  const topicFormulas = topic === PINNED ? [] : visible.filter((f) => f.topic === topic);
  const otherTopics = [...new Set(visible.map((f) => f.topic))].filter((t) => t !== topic && t !== PINNED);

  /** Compact tile for the pinned basics: the equation first, its name underneath. */
  const formulaTile = (id: string) => {
    const f = formulaById.get(id)!;
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => setMode({ kind: 'formula', id })}
          aria-label={f.name}
          className="flex min-h-16 w-full flex-col items-start justify-center gap-0.5 rounded-xl bg-surface-2 px-3 py-2 text-left"
        >
          <span className="max-w-full overflow-hidden">
            <Tex>{f.latex}</Tex>
          </span>
          <span className="text-xs leading-tight text-muted">{f.name}</span>
        </button>
      </li>
    );
  };

  const formulaButton = (id: string) => {
    const f = formulaById.get(id)!;
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => setMode({ kind: 'formula', id })}
          className="flex min-h-14 w-full flex-col items-start gap-1 rounded-xl bg-surface-2 px-3 py-2 text-left"
        >
          <span className="text-sm">{f.name}</span>
          <span className="max-w-full overflow-hidden text-sm text-muted">
            <Tex>{f.latex}</Tex>
          </span>
        </button>
      </li>
    );
  };

  return (
    <Sheet open={mode?.kind === 'pick'} onClose={onClose} title="Choose an operation">
      {mode?.kind === 'pick' && (
        <>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
            {(['formulas', 'maths', 'table'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 rounded-lg text-sm capitalize ${tab === t ? 'bg-surface font-semibold' : 'text-muted'}`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === 'table' ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">
                Work on several values at once: put the masses of each element (or each titre) in a row, then apply a formula or a
                step to make the next row, such as mass → moles → ÷ smallest. Send any value back as a chip.
              </p>
              <button
                type="button"
                onClick={() => setMode({ kind: 'table' })}
                className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink"
              >
                {table ? `Continue the table (${table.rows.length} ${table.rows.length === 1 ? 'row' : 'rows'})` : 'Start a table'}
              </button>
            </div>
          ) : tab === 'formulas' ? (
            <>
              <h3 className="mb-2 text-xs font-semibold text-muted">{TOPIC_NAMES[PINNED]}</h3>
              <ul className="grid grid-cols-2 gap-2" aria-label={TOPIC_NAMES[PINNED]}>
                {pinnedFormulas.map((f) => formulaTile(f.id))}
              </ul>
              {topicFormulas.length > 0 && (
                <>
                  <h3 className="mt-4 mb-2 text-xs font-semibold text-muted">{TOPIC_NAMES[topic] ?? topic}</h3>
                  <ul className="space-y-2">{topicFormulas.map((f) => formulaButton(f.id))}</ul>
                </>
              )}
              <button type="button" onClick={() => setShowAll((x) => !x)} aria-expanded={showAll} className="mt-3 min-h-11 text-sm text-muted">
                {showAll ? '▾' : '▸'} Other topics
              </button>
              {showAll &&
                otherTopics.map((t) => (
                  <div key={t} className="mt-2">
                    <h3 className="mb-2 text-xs font-semibold text-muted">{TOPIC_NAMES[t] ?? t}</h3>
                    <ul className="space-y-2">{visible.filter((f) => f.topic === t).map((f) => formulaButton(f.id))}</ul>
                  </div>
                ))}
              {hidden > 0 && (
                <p className="mt-4 rounded-xl border border-border p-3 text-sm text-muted">
                  {allFormulas
                    ? `Showing every formula, including ${hidden} beyond ${LEVELS[scope].name}. `
                    : `${hidden} formulas beyond ${LEVELS[scope].name} are hidden. `}
                  <button type="button" onClick={() => void setAllFormulas(!allFormulas)} className="text-accent underline underline-offset-4">
                    {allFormulas ? `Show only ${LEVELS[scope].name}` : 'Show all formulas'}
                  </button>
                </p>
              )}
            </>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {ARITH.map((d) => (
                <li key={d.op}>
                  <button
                    type="button"
                    onClick={() => setMode({ kind: 'arith', def: d })}
                    aria-label={d.name}
                    className="flex min-h-16 w-full flex-col items-center justify-center rounded-xl bg-surface-2 px-1"
                  >
                    <span className="text-lg">{d.symbol}</span>
                    <span className="text-xs leading-tight text-muted">{d.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Sheet>
  );
}

/** The chosen operation, open under the question so the question stays in view while it is filled in. */
export function WorkPanel({
  mode,
  setMode,
  onClose,
  chips,
  levels,
  strictUnits,
  table,
  onTableChange,
  onCompute,
}: {
  mode: Exclude<SheetMode, { kind: 'pick' }>;
  setMode: (m: SheetMode) => void;
  onClose: () => void;
  chips: Chip[];
  levels: readonly LevelId[];
  strictUnits?: boolean;
  table: CalcTable | undefined;
  onTableChange: (table: CalcTable | undefined) => void;
  onCompute: (out: ComputeOutput) => void;
}) {
  const { visible } = useVisibleFormulas(levels);
  const title = mode.kind === 'formula' ? formulaById.get(mode.id)!.name : mode.kind === 'arith' ? mode.def.name : 'Table';

  return (
    <section aria-label={title} className="rounded-2xl border border-accent/40 bg-surface p-3">
      <div className="mb-2 flex items-center">
        <button type="button" onClick={() => setMode({ kind: 'pick' })} className="mr-1 min-h-11 px-1 text-muted" aria-label="Back to operations">
          ‹
        </button>
        <h2 className="min-w-0 flex-1 truncate font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="min-h-11 min-w-11 text-muted" aria-label="Close">
          ✕
        </button>
      </div>
      {mode.kind === 'formula' && (
        <FormulaPanel key={mode.id} formula={formulaById.get(mode.id)!} chips={chips} strictUnits={strictUnits} onCompute={onCompute} />
      )}
      {mode.kind === 'table' && (
        <TablePanel table={table} onChange={onTableChange} chips={chips} formulas={visible.filter((f) => !f.species)} onCompute={onCompute} />
      )}
      {mode.kind === 'arith' && (
        <ArithPanel
          key={mode.def.op + (mode.initial?.id ?? '')}
          def={mode.def}
          chips={chips}
          initial={mode.initial}
          strictUnits={strictUnits}
          onCompute={onCompute}
        />
      )}
    </section>
  );
}
