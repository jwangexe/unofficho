import { useState } from 'react';
import { LEVELS, type LevelId } from '@/data/levels';
import { Sheet } from '@/ui/Sheet';
import { LevelCards, LevelLadder } from './LevelPicker';
import { useLevelPrefs, useLevelStore } from './store';

/** The "Include easier levels" switch. */
export function EasierToggle() {
  const on = useLevelStore((s) => s.includeEasier);
  const set = useLevelStore((s) => s.setIncludeEasier);
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Include easier levels</span>
        <span className="block text-sm text-muted">Mix in a few warm-up items from the levels below yours.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => void set(e.target.checked)}
        className="size-5 shrink-0 accent-accent"
      />
    </label>
  );
}

/** The "Show all formulas" switch: formulas beyond the level are hidden by default. */
export function AllFormulasToggle() {
  const on = useLevelStore((s) => s.allFormulas);
  const set = useLevelStore((s) => s.setAllFormulas);
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Show all formulas</span>
        <span className="block text-sm text-muted">List every formula in Calculations, not only the ones at your level.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => void set(e.target.checked)}
        className="size-5 shrink-0 accent-accent"
      />
    </label>
  );
}

/** Level cards and the warm-up switch, saved as soon as they change. */
export function LevelSettings() {
  const { level } = useLevelPrefs();
  const setLevel = useLevelStore((s) => s.setLevel);
  return (
    <div className="space-y-3">
      <LevelCards selected={level} onSelect={(l) => void setLevel(l)} />
      <EasierToggle />
    </div>
  );
}

/** Names short enough for a chip beside the mode buttons on a 320 px screen. */
const SHORT: Record<LevelId, string> = { alevel: 'A-Level', c3l6: 'C3L6', ukcho1: 'UKChO R1', ukcho2: 'UKChO R2', icho: 'IChO' };

/** A small chip at the top of a section showing the level; tapping it opens the switcher. */
export function LevelChip({ className = '' }: { className?: string }) {
  const { level } = useLevelPrefs();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Level: ${LEVELS[level].name}, change level`}
        className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted ${className}`}
      >
        <LevelLadder level={level} />
        <span className="whitespace-nowrap">{SHORT[level]}</span>
        <span aria-hidden>▾</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your level">
        <LevelSettings />
      </Sheet>
    </>
  );
}
