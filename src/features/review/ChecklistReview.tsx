import { useEffect, useRef, useState, type ReactNode } from 'react';
import { reactItems, reagentById } from '@/data';
import { bookPageById } from '@/data/book';
import { mechanismById } from '@/data/mechanisms';
import { ROLE_LABELS } from '@/data/schemas';
import { formulaById } from '@/engine/formulas';
import { derive, describeChoice, symbolTex, type Mechanism } from '@/engine/mechanism';
import { getUnit } from '@/engine/units';
import { RichText } from '@/features/book/QuickChecks';
import { mdxComponents } from '@/features/book/mdx';
import { MechanismScheme } from '@/features/mechanisms/MechanismScheme';
import { ReagentIdentity } from '@/features/reagents/ReagentHeader';
import { Structure } from '@/ui/Structure';
import { Tex } from '@/ui/Tex';
import { ReviewActions } from './ReviewActions';
import type { QueueItem } from './reviewLogic';

interface Check {
  key: string;
  /** What to check, shown next to the tick box. */
  label: ReactNode;
  /** Optional: scroll to this element of the rendered page. */
  el?: HTMLElement;
}

const box = 'rounded-2xl bg-surface p-4';

/** A list of claims to tick off one by one. */
function Checklist({ checks, checked, toggle }: { checks: Check[]; checked: Set<string>; toggle: (k: string) => void }) {
  return (
    <ul className="space-y-1.5" aria-label="Checklist">
      {checks.map((c, i) => (
        <li key={c.key}>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 ${checked.has(c.key) ? 'bg-good/10' : 'bg-surface-2'}`}>
            <input type="checkbox" checked={checked.has(c.key)} onChange={() => toggle(c.key)} className="mt-1 size-4 shrink-0 accent-[var(--good)]" />
            <span className="min-w-0 flex-1 text-sm leading-relaxed">
              <span className="mr-1 text-xs text-muted">{i + 1}.</span>
              {c.label}
            </span>
            {c.el && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  c.el!.scrollIntoView({ block: 'center' });
                  c.el!.animate([{ outline: '3px solid var(--accent)' }, { outline: '3px solid transparent' }], { duration: 1500 });
                }}
                className="shrink-0 text-xs text-accent underline underline-offset-2"
              >
                show
              </button>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}

const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-Z0-9$(])/).filter(Boolean);
const todo = (items: string[] | undefined): Check[] =>
  (items ?? []).map((t, i) => ({ key: `todo-${i}`, label: <span className="text-warn">TODO(verify): {t}</span> }));

function reagentChecks(item: QueueItem): { view: ReactNode; checks: Check[] } {
  const r = reagentById.get(item.id)!;
  const s = r.strength;
  return {
    view: <ReagentIdentity r={r} />,
    checks: [
      { key: 'identity', label: `Name, formula and aliases: ${r.name}, ${r.formula}${r.aliases.length ? ` (${r.aliases.join(', ')})` : ''}${r.smiles ? '; structure drawn above' : ''}` },
      { key: 'roles', label: `Roles: ${r.roles.map((x) => (x === r.primaryRole ? `${ROLE_LABELS[x]} (main)` : ROLE_LABELS[x])).join(', ')}` },
      ...(r.alsoAccept?.length ? [{ key: 'also', label: `Also accepted (neither right nor wrong): ${r.alsoAccept.map((x) => ROLE_LABELS[x]).join(', ')}` }] : []),
      ...(r.context ? [{ key: 'context', label: `Depends on conditions: ${r.context}` }] : []),
      ...(s ? [{ key: 'strength', label: `Strength: ${[s.pKaH !== undefined && `pKaH ≈ ${s.pKaH}`, s.pKa !== undefined && `pKa ≈ ${s.pKa}`, s.E0 !== undefined && `E° = ${s.E0} V`, s.note].filter(Boolean).join(' · ')}` }] : []),
      ...r.typicalUses.map((u, i) => ({ key: `use-${i}`, label: `Use: ${u}` })),
      ...r.chemoselectivity.map((u, i) => ({ key: `sel-${i}`, label: `Selectivity: ${u}` })),
      ...r.pitfalls.map((u, i) => ({ key: `pit-${i}`, label: `Pitfall: ${u}` })),
      ...todo(r.todoVerify),
    ],
  };
}

function reactChecks(item: QueueItem): { view: ReactNode; checks: Check[] } {
  const x = reactItems.find((r) => r.id === item.id)!;
  const reagent = reagentById.get(x.reagentId);
  return {
    view: (
      <div className="text-center">
        <Structure smiles={x.substrate.smiles} label={x.substrate.name} width={260} height={130} />
        <p className="font-semibold">{x.substrate.name}</p>
        <p className="text-sm">
          + {reagent?.name} ({reagent?.formula}) · {x.conditions}
        </p>
      </div>
    ),
    checks: [
      { key: 'substrate', label: `Substrate structure matches its name: ${x.substrate.name}` },
      ...x.groups.map((g, i) => ({ key: `g-${i}`, label: `${g.name}: ${g.reacts ? 'reacts' : 'is untouched'}` })),
      ...x.products.map((p, i) => ({
        key: `p-${i}`,
        label: (
          <span className="flex items-center gap-2">
            <Structure smiles={p.smiles} label={p.label} width={120} height={70} className="!mx-0 shrink-0" />
            <span>
              {p.label}: <span className={p.correct ? 'font-semibold text-good' : 'text-muted'}>{p.correct ? 'the correct product' : 'a distractor (must be wrong)'}</span>
            </span>
          </span>
        ),
      })),
      ...sentences(x.explanation).map((t, i) => ({ key: `e-${i}`, label: `Explanation: ${t}` })),
      ...todo(x.todoVerify),
    ],
  };
}

function mechanismChecks(item: QueueItem): { view: ReactNode; checks: Check[] } {
  const m: Mechanism = mechanismById.get(item.id)!;
  const lhs = `${m.rate.sign === -1 ? '-' : ''}\\frac{\\mathrm{d}${symbolTex(m)(`[${m.rate.species}]`)}}{\\mathrm{d}t}`;
  const derived = m.challenges.flatMap((c, ci) => {
    const r = derive(m, c);
    if (!r.ok) return [{ key: `c-${ci}`, label: <span className="text-bad">Challenge {ci + 1} fails to derive: {r.error}</span> }];
    return [
      {
        key: `c-${ci}`,
        label: (
          <span>
            <RichText>{`With ${describeChoice(m, c)}:`}</RichText>
            <span className="block overflow-x-auto py-1">
              <Tex>{`${lhs} = ${r.rateTex}`}</Tex>
            </span>
          </span>
        ),
      },
      ...r.limits.map((l, li) => ({
        key: `c-${ci}-l-${li}`,
        label: (
          <span>
            Limit when <Tex>{l.when}</Tex>: <Tex>{`${lhs} \\approx ${l.tex}`}</Tex>
          </span>
        ),
      })),
    ];
  });
  return {
    view: (
      <div>
        <p className="mb-2 text-sm text-muted">{m.blurb}</p>
        <MechanismScheme mech={m} />
      </div>
    ),
    checks: [
      { key: 'steps', label: 'The steps are elementary, balanced, and a sensible mechanism for this reaction' },
      { key: 'intermediates', label: `Intermediates that may be put in steady state: ${m.intermediates.join(', ')}${m.conserve ? `; mass balance on ${m.conserve.species.join(' + ')}` : ''}` },
      ...derived,
      ...sentences(m.explanation).map((t, i) => ({ key: `e-${i}`, label: <RichText>{`Explanation: ${t}`}</RichText> })),
      ...todo(m.todoVerify),
    ],
  };
}

function formulaChecks(item: QueueItem): { view: ReactNode; checks: Check[] } {
  const f = formulaById.get(item.id)!;
  return {
    view: (
      <div className="overflow-x-auto py-2 text-center">
        <Tex display>{f.latex}</Tex>
      </div>
    ),
    checks: [
      ...f.vars.map((v) => ({
        key: `v-${v.sym}`,
        label: (
          <span>
            <Tex>{v.latex}</Tex>: {v.name} · default unit {getUnit(v.unit).symbol || 'none'}
            {v.sign && v.sign !== 'positive' ? ` · ${v.sign}` : ''}
          </span>
        ),
      })),
      ...Object.entries(f.rearranged).map(([k, tex]) => ({
        key: `r-${k}`,
        label: (
          <span className="block overflow-x-auto">
            <Tex>{tex}</Tex>
          </span>
        ),
      })),
      ...(f.notes ? [{ key: 'notes', label: `Notes: ${f.notes}` }] : []),
      ...todo(f.todoVerify),
    ],
  };
}

/**
 * A rendered block as text with its maths turned back into $…$ (from KaTeX's TeX annotation),
 * shortened without cutting an equation in half. Rendered with RichText.
 */
function blockText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll<HTMLElement>('.katex').forEach((k) => {
    const tex = k.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim();
    k.replaceWith(tex ? ` $${tex.replace(/\$/g, '')}$ ` : '');
  });
  clone.querySelectorAll('svg').forEach((n) => n.remove());
  let t = clone.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (t.length > 220) {
    t = t.slice(0, 217);
    // An odd number of $ means the cut fell inside an equation: end before it.
    if ((t.match(/\$/g)?.length ?? 0) % 2) t = t.slice(0, t.lastIndexOf('$'));
    t = `${t.trimEnd()}…`;
  }
  return t;
}

/** A Book page: rendered in full; every paragraph, list item, equation, figure and table row becomes a check. */
function BookReview({ item, onDone }: { item: QueueItem; onDone: (message: string, outcome: 'reviewed' | 'noted') => void }) {
  const page = bookPageById.get(item.id)!;
  const article = useRef<HTMLElement>(null);
  const [blocks, setBlocks] = useState<Check[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Let KaTeX and structures render first.
    const t = setTimeout(() => {
      const root = article.current;
      if (!root) return;
      const all = [...root.querySelectorAll<HTMLElement>('p, li, figure, .katex-display, tr, aside')];
      // Keep outermost blocks only (a callout's paragraphs are checked as the callout).
      const top = all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
      setBlocks(
        top.map((el, i) => {
          const text = blockText(el);
          return { key: `b-${i}`, label: text ? <RichText>{text}</RichText> : (el.getAttribute('aria-label') ?? '(figure)'), el };
        }),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [item.id]);

  const { Content } = page;
  const quick: Check[] = page.quickChecks.map((q, i) => ({
    key: `q-${i}`,
    label: (
      <span>
        Quick check {i + 1}: <RichText>{q.prompt}</RichText> →{' '}
        <RichText>{q.type === 'mcq' ? `${q.options[q.answer]} (${q.explanation})` : q.answer}</RichText>
        {q.type === 'mcq' && <span className="block text-xs text-muted">Distractors: {q.options.filter((_, j) => j !== q.answer).join(' · ')}</span>}
      </span>
    ),
  }));
  const checks = [...blocks, ...quick, ...todo(page.todoVerify)];
  const toggle = (k: string) => setChecked((s) => (s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k])));

  return (
    <div className="space-y-3">
      <article ref={article} className={`${box} book-prose`}>
        <h2 className="mb-2 text-xl font-semibold">{page.title}</h2>
        <Content components={mdxComponents} />
      </article>
      <section className={box} aria-label="Claims to check">
        <p className="mb-2 text-sm text-muted">Tick each claim once you have checked it ({checked.size}/{checks.length}).</p>
        <Checklist checks={checks} checked={checked} toggle={toggle} />
      </section>
      <ReviewActions item={item} onDone={onDone} checked={`${checked.size}/${checks.length} checked`} />
    </div>
  );
}

/** Reagents, "Will it react?" items, mechanisms, formulas and Book pages: the content plus a checklist. */
export function ChecklistReview({ item, onDone }: { item: QueueItem; onDone: (message: string, outcome: 'reviewed' | 'noted') => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  if (item.kind === 'book') return <BookReview key={item.key} item={item} onDone={onDone} />;
  const { view, checks } =
    item.kind === 'reagent' ? reagentChecks(item) : item.kind === 'react' ? reactChecks(item) : item.kind === 'mechanism' ? mechanismChecks(item) : formulaChecks(item);
  const toggle = (k: string) => setChecked((s) => (s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k])));
  return (
    <div className="space-y-3">
      <section className={box}>{view}</section>
      <section className={box} aria-label="Claims to check">
        <p className="mb-2 text-sm text-muted">Tick each claim once you have checked it ({checked.size}/{checks.length}).</p>
        <Checklist checks={checks} checked={checked} toggle={toggle} />
      </section>
      <ReviewActions item={item} onDone={onDone} checked={`${checked.size}/${checks.length} checked`} />
    </div>
  );
}
