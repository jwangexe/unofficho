import { elementarySteps, kTex, type Mechanism } from '@/engine/mechanism';
import { Tex } from '@/ui/Tex';

function sideTex(mech: Mechanism, side: Record<string, number>) {
  return Object.entries(side)
    .map(([sp, n]) => `${n > 1 ? n : ''}\\mathrm{${mech.species[sp] ?? sp}}`)
    .join(' + ');
}

/** The mechanism as numbered elementary steps, with rate constants on the arrows. */
export function MechanismScheme({ mech }: { mech: Mechanism }) {
  const forward = elementarySteps(mech).filter((e) => !e.reverse);
  return (
    <ol className="space-y-1" aria-label="Elementary steps">
      {forward.map((e) => {
        const s = mech.steps[e.from]!;
        const arrow = s.back ? `\\xrightleftharpoons[${kTex(s.back)}]{${kTex(s.k)}}` : `\\xrightarrow{${kTex(s.k)}}`;
        return (
          <li key={e.from} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-muted">Step {e.from + 1}</span>
            <span className="min-w-0 overflow-x-auto overflow-y-hidden">
              <Tex>{`${sideTex(mech, e.reactants)} ${arrow} ${sideTex(mech, e.products)}`}</Tex>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
