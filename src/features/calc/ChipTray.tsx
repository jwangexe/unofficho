import { useState } from 'react';
import { CONSTANTS } from '@/engine/constants';
import { constantQuantity } from '@/engine/graph';
import { ChipButton } from './ChipButton';
import { useChipPicks } from './pick';
import type { Chip } from './store';

export const CONSTANT_CHIPS: Chip[] = CONSTANTS.map((c) => ({
  id: `c.${c.id}`,
  label: c.label,
  q: constantQuantity(c.id),
  sig: 4,
  source: 'const',
}));

/**
 * Chips available to fill a slot: givens, your results, and the constants tray. Inside a
 * question card the givens and results are tapped where they already are, above the panel,
 * so only the constants are listed here.
 */
export function ChipTray({ chips, onPick, hint }: { chips: Chip[]; onPick: (chip: Chip) => void; hint?: string }) {
  const [showConstants, setShowConstants] = useState(false);
  const routed = useChipPicks(onPick);
  const given = chips.filter((c) => c.source === 'given');
  const steps = chips.filter((c) => c.source === 'step');
  return (
    <div>
      {routed ? (
        <p className="mb-1 text-xs text-muted">{hint ? `${hint}. The chips are pinned at the top.` : 'Tap a chip pinned at the top.'}</p>
      ) : (
        <>
          {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
          <div className="flex flex-wrap gap-2">
            {given.map((c) => (
              <ChipButton key={c.id} chip={c} onClick={() => onPick(c)} />
            ))}
            {steps.map((c) => (
              <ChipButton key={c.id} chip={c} onClick={() => onPick(c)} />
            ))}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setShowConstants((x) => !x)}
        aria-expanded={showConstants}
        className="mt-1 min-h-11 text-sm text-muted"
      >
        {showConstants ? '▾' : '▸'} Constants
      </button>
      {showConstants && (
        <div className="flex flex-wrap gap-2">
          {CONSTANT_CHIPS.map((c) => (
            <ChipButton key={c.id} chip={c} onClick={() => onPick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
