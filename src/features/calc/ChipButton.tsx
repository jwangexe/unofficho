import { formatQuantity } from '@/engine/quantity';
import type { Chip } from './store';

const styles: Record<Chip['source'], string> = {
  given: 'bg-surface border-border',
  // Your results: a green tint, so they stand apart from the givens.
  step: 'bg-accent/10 border-accent/50',
  const: 'bg-transparent border-border border-dashed',
};

/** Superscripts take a whole monospace cell each ("mol⁻ ¹"): set them in the body font so units stay tight. */
function MonoValue({ text }: { text: string }) {
  return text.split(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="font-sans">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** A quantity chip, like a periodic-table tile: the symbol in bold, the value and unit in small monospace under it. */
export function ChipButton({
  chip,
  onClick,
  selected = false,
  disabled = false,
}: {
  chip: Chip;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const text = formatQuantity(chip.q, chip.sig);
  const note = chip.source === 'step' ? ' (your result)' : chip.source === 'const' ? ' (constant)' : '';
  // Exactly 44 px tall (two lines plus padding), which the pinned strip's height assumes.
  const className = `inline-flex h-11 max-w-full flex-col items-start justify-center rounded-md border px-2.5 text-left leading-tight transition-colors disabled:opacity-40 ${styles[chip.source]} ${
    selected ? 'ring-2 ring-accent' : ''
  }`;
  const content = (
    <>
      <span className="max-w-full truncate text-sm font-bold">{chip.label}</span>
      {/* The name read aloud is the text itself, "t½ = 58 min (your result)", so it always matches what is shown. */}
      <span className="sr-only"> = </span>
      <span className="max-w-full truncate font-mono text-xs text-muted">
        <MonoValue text={text} />
      </span>
      {note && <span className="sr-only">{note}</span>}
    </>
  );
  // Display-only chips (e.g. inside a filled slot, which is itself a button) must not be buttons.
  if (!onClick) {
    return (
      <span className={className}>
        {content}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} className={className}>
      {content}
    </button>
  );
}
