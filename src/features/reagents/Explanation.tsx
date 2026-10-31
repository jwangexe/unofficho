import { ROLE_LABELS, type Reagent } from '@/data/schemas';

function Strength({ r }: { r: Reagent }) {
  const s = r.strength;
  if (!s) return null;
  const parts = [
    s.pKaH !== undefined && `pKₐ of conjugate acid ≈ ${s.pKaH}`,
    s.pKa !== undefined && `pKₐ ≈ ${s.pKa}`,
    s.E0 !== undefined && `E° = ${s.E0 > 0 ? '+' : ''}${s.E0.toFixed(2)} V`,
  ].filter(Boolean);
  return (
    <p className="text-sm">
      <span className="text-muted">Strength: </span>
      {parts.join(' · ')}
      {s.note && <span className="text-muted"> ({s.note})</span>}
    </p>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone?: 'warn' }) {
  return (
    <div>
      <h3 className={`mb-1 text-xs font-semibold uppercase tracking-wide ${tone === 'warn' ? 'text-warn' : 'text-muted'}`}>{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

/** What the reagent is, does and does not do. */
export function ReagentExplanation({ r }: { r: Reagent }) {
  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4" aria-label="Explanation">
      <p className="text-sm">
        <span className="text-muted">Roles: </span>
        {r.roles.map((x) => (x === r.primaryRole ? `${ROLE_LABELS[x]} (main)` : ROLE_LABELS[x])).join(', ')}
        {r.alsoAccept?.length ? (
          <span className="text-muted"> · also defensible: {r.alsoAccept.map((x) => ROLE_LABELS[x]).join(', ')}</span>
        ) : null}
      </p>
      {r.context && (
        <p className="rounded-xl border border-warn/40 px-3 py-2 text-sm">
          <span className="font-semibold text-warn">Depends on conditions. </span>
          {r.context}
        </p>
      )}
      <Strength r={r} />
      <List title="Typical uses" items={r.typicalUses} />
      <List title="Selectivity: what it does and does not do" items={r.chemoselectivity} />
      <List title="Common trap" items={r.pitfalls} tone="warn" />
    </section>
  );
}
