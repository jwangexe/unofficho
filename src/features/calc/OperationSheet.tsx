import { useState } from 'react';
import { FORMULAS, formulaById } from '@/engine/formulas';
import { Sheet } from '@/ui/Sheet';
import { Tex } from '@/ui/Tex';
import { ARITH, ArithPanel, type ArithDef } from './ArithPanel';
import { FormulaPanel, type ComputeOutput } from './FormulaPanel';
import type { Chip } from './store';

export type SheetMode = { kind: 'pick' } | { kind: 'formula'; id: string } | { kind: 'arith'; def: ArithDef; initial?: Chip };

const TOPIC_NAMES: Record<string, string> = {
  thermo: 'Thermodynamics',
  kinetics: 'Kinetics',
  equilibrium: 'Equilibrium & acids',
  electro: 'Electrochemistry',
  other: 'Spectroscopy & other',
};

export function OperationSheet({
  mode,
  setMode,
  onClose,
  chips,
  topic,
  strictUnits,
  onCompute,
}: {
  mode: SheetMode | null;
  setMode: (m: SheetMode) => void;
  onClose: () => void;
  chips: Chip[];
  topic: string;
  strictUnits?: boolean;
  onCompute: (out: ComputeOutput) => void;
}) {
  const [tab, setTab] = useState<'formulas' | 'maths'>('formulas');
  const [showAll, setShowAll] = useState(false);

  const title =
    mode?.kind === 'formula' ? formulaById.get(mode.id)!.name : mode?.kind === 'arith' ? mode.def.name : 'Choose an operation';

  const back = mode && mode.kind !== 'pick' && (
    <button type="button" onClick={() => setMode({ kind: 'pick' })} className="mr-1 min-h-11 px-1 text-muted" aria-label="Back to operations">
      ‹
    </button>
  );

  const topicFormulas = FORMULAS.filter((f) => f.topic === topic);
  const otherTopics = [...new Set(FORMULAS.map((f) => f.topic))].filter((t) => t !== topic);

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
    <Sheet
      open={mode !== null}
      onClose={onClose}
      title={
        <span className="flex items-center">
          {back}
          <span className="truncate">{title}</span>
        </span>
      }
    >
      {mode?.kind === 'pick' && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
            {(['formulas', 'maths'] as const).map((t) => (
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
          {tab === 'formulas' ? (
            <>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{TOPIC_NAMES[topic] ?? topic}</h3>
              <ul className="space-y-2">{topicFormulas.map((f) => formulaButton(f.id))}</ul>
              <button type="button" onClick={() => setShowAll((x) => !x)} aria-expanded={showAll} className="mt-3 min-h-11 text-sm text-muted">
                {showAll ? '▾' : '▸'} Other topics
              </button>
              {showAll &&
                otherTopics.map((t) => (
                  <div key={t} className="mt-2">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{TOPIC_NAMES[t] ?? t}</h3>
                    <ul className="space-y-2">{FORMULAS.filter((f) => f.topic === t).map((f) => formulaButton(f.id))}</ul>
                  </div>
                ))}
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
                    <span className="text-[11px] leading-tight text-muted">{d.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {mode?.kind === 'formula' && (
        <FormulaPanel key={mode.id} formula={formulaById.get(mode.id)!} chips={chips} strictUnits={strictUnits} onCompute={onCompute} />
      )}
      {mode?.kind === 'arith' && (
        <ArithPanel
          key={mode.def.op + (mode.initial?.id ?? '')}
          def={mode.def}
          chips={chips}
          initial={mode.initial}
          strictUnits={strictUnits}
          onCompute={onCompute}
        />
      )}
    </Sheet>
  );
}
