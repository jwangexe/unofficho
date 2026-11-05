/**
 * Approach mode: no numbers — choose which operation comes next, from 3–4 options.
 * The reference graph is a DAG, so at each point any step whose inputs are already
 * known counts as correct; steps that need something not yet computed are "not yet".
 */
import { formulaInScope } from '@/data/levels';
import { CONSTANTS } from './constants';
import { formulaById, FORMULAS } from './formulas';
import { isFormulaNode, nodeLabel, type GraphNode, type Ref } from './graph';
import type { CalcTemplate } from './template';

export interface ApproachOption {
  /** Identity for de-duplication: formula + solved variable, or op + inputs. */
  key: string;
  caption: string;
  latex?: string;
  /** Set when this option is a step of the reference solution. */
  nodeId?: string;
}

export type ChoiceVerdict = 'correct' | 'not-yet' | 'not-needed';

const OP_VERB: Record<string, string> = {
  add: 'Add',
  sub: 'Subtract',
  mul: 'Multiply',
  div: 'Divide',
  ln: 'Take ln of',
  log10: 'Take log₁₀ of',
  exp: 'Exponentiate',
  pow10: 'Raise 10 to',
  pow: 'Raise to a power:',
  scale: 'Multiply by a coefficient:',
  sum: 'Weighted sum of',
  convert: 'Convert',
};

function refLabel(t: CalcTemplate, ref: Ref): string {
  if (ref.startsWith('g.')) return t.given.find((g) => `g.${g.key}` === ref)?.label ?? ref;
  if (ref.startsWith('c.')) return CONSTANTS.find((c) => `c.${c.id}` === ref)?.label ?? ref;
  if (ref.startsWith('#')) return ref.slice(1);
  const id = ref.slice(2);
  const n = [...t.reference, ...(t.misconceptions ?? []).flatMap((m) => m.reference)].find((x) => x.id === id);
  return n ? nodeLabel(n) : id;
}

export function nodeKey(n: GraphNode): string {
  return isFormulaNode(n) ? `f:${n.formula}:${n.solveFor}` : `o:${n.op}:${n.inputs.join(',')}`;
}

export function describeNode(t: CalcTemplate, n: GraphNode): ApproachOption {
  if (isFormulaNode(n)) {
    const f = formulaById.get(n.formula)!;
    return { key: nodeKey(n), caption: `${f.name}: solve for ${nodeLabel(n)}`, latex: f.rearranged[n.solveFor] };
  }
  // Bracket compound labels such as "k₋₁ + k₂" so "(k₋₁ + k₂) ÷ k₁" reads correctly.
  const labels = n.inputs.map((r) => {
    const l = refLabel(t, r);
    return n.op !== 'add' && /[+−×÷·]/.test(l) ? `(${l})` : l;
  });
  let detail: string;
  switch (n.op) {
    case 'add': detail = `${labels[0]} + ${labels[1]}`; break;
    case 'sub': detail = `${labels[0]} − ${labels[1]}`; break;
    case 'mul': detail = `${labels[0]} × ${labels[1]}`; break;
    case 'div': detail = `${labels[0]} ÷ ${labels[1]}`; break;
    case 'pow': detail = `(${labels[0]})^${n.exponent}`; break;
    case 'scale': detail = `${n.coef} × ${labels[0]}`; break;
    case 'sum': detail = n.inputs.map((_, i) => `${n.coefs[i]}·${labels[i]}`).join(' + ').replace(/\+ -/g, '− '); break;
    case 'convert': detail = `${labels[0]} to new units`; break;
    default: detail = labels[0] ?? '';
  }
  const result = n.label && n.label.replace(/\s/g, '') !== detail.replace(/\s/g, '') ? ` → ${n.label}` : '';
  return { key: nodeKey(n), caption: `${OP_VERB[n.op]} ${detail}${result}` };
}

const depsOf = (n: GraphNode): string[] =>
  (isFormulaNode(n) ? Object.values(n.inputs) : n.inputs).filter((r) => r.startsWith('n.')).map((r) => r.slice(2));

/** Reference steps whose inputs are all known once `done` steps are complete. */
export function availableSteps(t: CalcTemplate, done: ReadonlySet<string>): GraphNode[] {
  return t.reference.filter((n) => !done.has(n.id) && depsOf(n).every((d) => done.has(d)));
}

export function judgeChoice(t: CalcTemplate, done: ReadonlySet<string>, option: ApproachOption): ChoiceVerdict {
  const available = availableSteps(t, done);
  if (available.some((n) => nodeKey(n) === option.key)) return 'correct';
  if (t.reference.some((n) => !done.has(n.id) && nodeKey(n) === option.key)) return 'not-yet';
  return 'not-needed';
}

/** Reference node matching a chosen option among the available ones. */
export const resolveChoice = (t: CalcTemplate, done: ReadonlySet<string>, option: ApproachOption) =>
  availableSteps(t, done).find((n) => nodeKey(n) === option.key);

function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * 3–4 options for the next step: one available reference step (plus a second if two are
 * available), then distractors in order of usefulness — later reference steps (wrong order),
 * the template's known misconceptions, then other formulas from the same topic.
 */
export function buildOptions(t: CalcTemplate, done: ReadonlySet<string>, r: () => number, count = 4): ApproachOption[] {
  const available = availableSteps(t, done);
  const chosen = new Map<string, ApproachOption>();
  const add = (o: ApproachOption) => {
    if (chosen.size < count && !chosen.has(o.key)) chosen.set(o.key, o);
  };

  for (const n of shuffle(available, r).slice(0, 2)) add({ ...describeNode(t, n), nodeId: n.id });

  const later = t.reference.filter((n) => !done.has(n.id) && !available.includes(n));
  // Steps that only appear in known wrong routes make the most instructive distractors.
  const misconceptionSteps = (t.misconceptions ?? []).flatMap((m) => m.reference);
  const refKeys = new Set(t.reference.map(nodeKey));
  const pool: ApproachOption[] = [
    ...shuffle(later, r).slice(0, 1).map((n) => ({ ...describeNode(t, n), nodeId: n.id })),
    ...shuffle(misconceptionSteps.filter((n) => !refKeys.has(nodeKey(n))), r).map((n) => describeNode(t, n)),
  ];
  for (const o of pool) add(o);

  // Same-topic formulas that are not part of the solution.
  // Formulas within the question's levels come first, so a distractor rarely names something unfamiliar.
  const inScope = (id: string) => t.levels.every((l) => formulaInScope(l, id));
  const topicFormulas = shuffle(
    FORMULAS.filter((f) => f.topic === t.topic && ![...refKeys].some((k) => k.startsWith(`f:${f.id}:`))),
    r,
  ).sort((a, b) => Number(inScope(b.id)) - Number(inScope(a.id)));
  for (const f of topicFormulas) {
    if (chosen.size >= count) break;
    const solvable = f.vars.filter((v) => v.solvable !== false);
    const v = solvable[Math.floor(r() * solvable.length)]!;
    add(describeNode(t, { id: `x-${f.id}`, formula: f.id, solveFor: v.sym, inputs: {} }));
  }
  return shuffle([...chosen.values()], r);
}

/** Problem statement without numbers: what is known and what is asked. */
export function approachPrompt(t: CalcTemplate): { known: string[]; find: string } {
  return { known: t.given.map((g) => g.label), find: t.answer.label };
}
