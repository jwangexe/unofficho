import { formatQuantity } from '@/engine/quantity';
import type { Chip } from './store';

const styles: Record<Chip['source'], string> = {
  given: 'bg-surface-2 border-border',
  step: 'bg-surface-2 border-accent/60',
  const: 'bg-transparent border-border border-dashed',
};

/** A quantity chip: symbol, value and unit. */
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
  const label = `${chip.label} = ${text}${chip.source === 'step' ? ' (your result)' : chip.source === 'const' ? ' (constant)' : ''}`;
  const className = `inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:opacity-40 ${styles[chip.source]} ${
    selected ? 'ring-2 ring-accent' : ''
  }`;
  const content = (
    <>
      <span className="font-semibold">{chip.label}</span>
      <span className="truncate text-muted">= {text}</span>
    </>
  );
  // Display-only chips (e.g. inside a filled slot, which is itself a button) must not be buttons.
  if (!onClick) {
    return (
      <span className={className} aria-label={label}>
        {content}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={label} className={className}>
      {content}
    </button>
  );
}
