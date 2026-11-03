import { lazy, Suspense, useState } from 'react';
import { derivationFor } from '@/data/book/derivations';
import { formulaById } from '@/engine/formulas';
import { Sheet } from '@/ui/Sheet';

const DerivationContent = lazy(() => import('./DerivationContent'));

/**
 * "Where does this come from?": for a formula with a derivation in the Book, a link that opens
 * that page in a sheet, so a question in a feed is not lost. Renders nothing otherwise.
 */
export function DerivationLink({ formula, className = '' }: { formula: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = derivationFor(formula);
  if (!ref) return null;
  const name = formulaById.get(formula)?.name ?? formula;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-left text-sm text-accent underline underline-offset-4 ${className}`}>
        Derivation: {name}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={ref.title}>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <DerivationContent pageId={ref.pageId} />
        </Suspense>
      </Sheet>
    </>
  );
}

/** Derivation links for every formula in a list that has one. */
export function DerivationLinks({ formulas }: { formulas: readonly string[] }) {
  const linked = formulas.filter((f) => derivationFor(f));
  if (linked.length === 0) return null;
  return (
    <div className="flex flex-col items-start gap-1">
      {linked.map((f) => (
        <DerivationLink key={f} formula={f} />
      ))}
    </div>
  );
}
