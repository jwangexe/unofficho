import type { Reagent } from '@/data/schemas';
import { FlagButton } from '@/ui/FlagButton';
import { Structure } from '@/ui/Structure';

export const topicLabel = (t: string) =>
  t
    .split('/')
    .map((x) => x.replace(/-/g, ' '))
    .map((x, i) => (i === 0 ? x[0]!.toUpperCase() + x.slice(1) : x))
    .join(' · ');

export function CardTop({ topic, reviewed, itemId, context }: { topic: string; reviewed: boolean; itemId: string; context?: string }) {
  return (
    <header className="flex items-center gap-2 px-4 pt-2">
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">{topicLabel(topic)}</span>
      {!reviewed && (
        <span className="text-[10px] text-muted/70" title="Not yet checked for accuracy">
          unreviewed
        </span>
      )}
      <span className="flex-1" />
      <FlagButton itemId={itemId} section="reagents" context={context} />
    </header>
  );
}

/** Name, formula, aliases and (where useful) the structure. */
export function ReagentIdentity({ r, compact = false }: { r: Reagent; compact?: boolean }) {
  return (
    <div className="text-center">
      <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold leading-tight`}>{r.name}</h2>
      <p className="mt-1 text-lg">{r.formula}</p>
      {r.aliases.length > 0 && <p className="text-sm text-muted">{r.aliases.join(' · ')}</p>}
      {r.smiles && (
        <div className="mt-2">
          <Structure smiles={r.smiles} label={`Structure of ${r.name}`} width={compact ? 200 : 240} height={compact ? 110 : 140} />
        </div>
      )}
    </div>
  );
}
