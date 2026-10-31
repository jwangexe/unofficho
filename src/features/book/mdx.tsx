/**
 * Components available inside book MDX pages, plus styling for plain Markdown elements.
 *
 *   <Smiles smiles="CC(=O)C" label="Acetone" />
 *   <Scheme from="O=CCC" to="OCCC" over="NaBH₄" under="MeOH, 0 °C" reagent="nabh4" />
 *   <Callout type="trap">…</Callout>        type: trap | tip | note
 *   <R id="dibal-h" />  or  <R id="dibal-h">DIBAL</R>   (opens the reagent card)
 *   <F id="nernst" />                                    (opens the formula)
 *
 * Maths is ordinary Markdown: $…$ inline, $$…$$ on its own lines (KaTeX at build time).
 */
import type { MDXComponents } from 'mdx/types';
import { useState, type ReactNode } from 'react';
import { reagentById } from '@/data';
import { formulaById } from '@/engine/formulas';
import { ReagentExplanation } from '@/features/reagents/Explanation';
import { ReagentIdentity } from '@/features/reagents/ReagentHeader';
import { Sheet } from '@/ui/Sheet';
import { Structure } from '@/ui/Structure';
import { Tex } from '@/ui/Tex';

const CALLOUTS = {
  trap: { title: 'Common trap', cls: 'border-warn/50 bg-warn/5', head: 'text-warn' },
  tip: { title: 'Olympiad tip', cls: 'border-accent/50 bg-accent/5', head: 'text-accent' },
  note: { title: 'Note', cls: 'border-border bg-surface', head: 'text-muted' },
} as const;

export function Callout({ type = 'note', title, children }: { type?: keyof typeof CALLOUTS; title?: string; children: ReactNode }) {
  const c = CALLOUTS[type];
  return (
    <aside className={`my-4 rounded-xl border px-4 py-3 ${c.cls}`}>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${c.head}`}>{title ?? c.title}</p>
      <div className="text-[0.95rem] leading-relaxed [&>p]:my-1.5">{children}</div>
    </aside>
  );
}

export function Smiles({ smiles, label, caption, width = 240, height = 150 }: { smiles: string; label: string; caption?: string; width?: number; height?: number }) {
  return (
    <figure className="my-4 rounded-xl bg-surface p-2">
      <Structure smiles={smiles} label={label} width={width} height={height} />
      <figcaption className="text-center text-xs text-muted">{caption ?? label}</figcaption>
    </figure>
  );
}

/** Reactant → (reagent over arrow, conditions under) → product. */
export function Scheme({
  from,
  to,
  fromLabel,
  toLabel,
  over,
  under,
  reagent,
}: {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  over?: string;
  under?: string;
  reagent?: string;
}) {
  const overText = over ?? (reagent ? reagentById.get(reagent)?.formula : undefined);
  return (
    <figure className="my-4 rounded-xl bg-surface p-2" aria-label={`${fromLabel ?? 'Reactant'} to ${toLabel ?? 'product'} with ${overText ?? 'reagent'}`}>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <Structure smiles={from} label={fromLabel ?? 'Reactant'} width={150} height={120} />
        </div>
        <div className="flex w-20 shrink-0 flex-col items-center text-center text-[11px] leading-tight">
          <span className="min-h-4">{reagent ? <R id={reagent}>{overText}</R> : overText}</span>
          <svg width="72" height="12" viewBox="0 0 72 12" aria-hidden className="my-1 text-text">
            <path d="M2 6h64M60 1l7 5-7 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-h-4 text-muted">{under}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Structure smiles={to} label={toLabel ?? 'Product'} width={150} height={120} />
        </div>
      </div>
      {(fromLabel || toLabel) && (
        <figcaption className="flex text-xs text-muted">
          <span className="flex-1 text-center">{fromLabel}</span>
          <span className="w-20" />
          <span className="flex-1 text-center">{toLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}

const linkCls = 'cursor-pointer rounded px-0.5 text-accent underline decoration-accent/40 decoration-dotted underline-offset-4';

/** Inline link to a reagent card. */
export function R({ id, children }: { id: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const r = reagentById.get(id);
  if (!r) return <span className="text-bad">[unknown reagent {id}]</span>;
  return (
    <>
      <button type="button" className={linkCls} onClick={() => setOpen(true)}>
        {children ?? r.name}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Reagent">
        <div className="space-y-3 pb-2">
          <ReagentIdentity r={r} compact />
          <ReagentExplanation r={r} />
        </div>
      </Sheet>
    </>
  );
}

/** Inline link to a formula from the Calculations engine. */
export function F({ id, children }: { id: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const f = formulaById.get(id);
  if (!f) return <span className="text-bad">[unknown formula {id}]</span>;
  return (
    <>
      <button type="button" className={linkCls} onClick={() => setOpen(true)}>
        {children ?? f.name}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={f.name}>
        <FormulaCard id={id} />
      </Sheet>
    </>
  );
}

export function FormulaCard({ id }: { id: string }) {
  const f = formulaById.get(id)!;
  return (
    <div className="space-y-3 pb-2">
      <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-surface-2 px-3 py-4 text-center">
        <Tex display>{f.latex}</Tex>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {f.vars.map((v) => (
          <div key={v.sym} className="contents">
            <dt className="text-right">
              <Tex>{v.latex}</Tex>
            </dt>
            <dd className="text-muted">{v.name}</dd>
          </div>
        ))}
      </dl>
      {f.notes && <p className="text-sm text-muted">{f.notes}</p>}
    </div>
  );
}

/** Plain Markdown elements, styled for a phone-width reading column. */
export const mdxComponents: MDXComponents = {
  h2: (p) => <h2 className="mt-6 mb-2 text-lg font-semibold" {...p} />,
  h3: (p) => <h3 className="mt-4 mb-1 font-semibold" {...p} />,
  p: (p) => <p className="my-3 leading-relaxed" {...p} />,
  ul: (p) => <ul className="my-3 list-disc space-y-1.5 pl-5 leading-relaxed" {...p} />,
  ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-5 leading-relaxed" {...p} />,
  strong: (p) => <strong className="font-semibold" {...p} />,
  a: (p) => <a className="text-accent underline underline-offset-4" {...p} />,
  table: (p) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p) => <th className="border-b border-border px-2 py-1.5 text-left font-semibold" {...p} />,
  td: (p) => <td className="border-b border-border/60 px-2 py-1.5 align-top" {...p} />,
  Callout,
  Smiles,
  Scheme,
  R,
  F,
};
