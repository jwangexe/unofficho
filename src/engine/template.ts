/**
 * Parameterised question templates. A template draws chemically realistic parameters,
 * optionally derives consistent data through hidden setup steps, rounds every given to the
 * precision shown on its chip, and computes the expected answer by running the reference
 * graph on those rounded givens, so the answer always matches the numbers on screen.
 */
import { evaluateGraph, type GraphNode, type Ref } from './graph';
import { convert, displayValue, fromSI, qty, type QKind, type Quantity } from './quantity';
import { formatQuantity } from './quantity';
import { fail, ok, type Result } from './result';
import { getUnit } from './units';
import type { LevelId } from '@/data/levels/types';

export interface ParamSpec {
  unit: string;
  kind?: QKind;
  min?: number;
  max?: number;
  /** Draw uniformly in log space (for K, k, Ka…). */
  log?: boolean;
  /** Pick one of these values instead of a range. */
  choices?: number[];
  /** Significant figures (default 3) — or fixed decimals, which wins if set. */
  sig?: number;
  decimals?: number;
  /** Randomly show the value in one of these units (rounded in that unit). */
  displayUnits?: string[];
}

export interface GivenSpec {
  key: string;
  label: string;
  from: Ref;
  unit?: string;
  sig?: number;
  decimals?: number;
  displayUnits?: string[];
}

export type Tolerance = number | { abs: number };

export interface Misconception {
  /** Graph run on the same givens (and constants), reproducing a typical wrong route. */
  reference: GraphNode[];
  answer: string;
  message: string;
}

export interface CalcTemplate {
  id: string;
  topic: string;
  title: string;
  difficulty: 1 | 2 | 3;
  params: Record<string, ParamSpec>;
  setup?: GraphNode[];
  given: GivenSpec[];
  /** Reject an instance (redraw) unless this holds; receives SI values keyed by given key and 'answer'. */
  constraint?: (v: Record<string, number>) => boolean;
  reference: GraphNode[];
  answer: { node: string; label: string; unit: string };
  /** Relative tolerance (default 0.01) or an absolute one, e.g. { abs: 0.02 } for pH. */
  tolerance?: Tolerance;
  misconceptions?: Misconception[];
  /** Question text variants; {key} is replaced by the formatted given. */
  wordings: string[];
  /** Number-free statement of the situation, for approach mode. Defaults to the title. */
  approachText?: string;
  explanation: string;
  reviewed: boolean;
  todoVerify?: string[];
  /** Levels this item belongs to (see src/data/levels). */
  levels: LevelId[];
  /** Difficulty at particular levels, when it differs from `difficulty`. */
  difficultyByLevel?: Partial<Record<LevelId, 1 | 2 | 3>>;
  /** Private note of what inspired the item (never shown). */
  sourceNote?: string;
  /** Set on the parts of a case study (see caseStudy.ts): the shared stem shown above this part. */
  caseStudy?: CaseStudyRef;
}

export interface CaseStudyRef {
  id: string;
  title: string;
  /** The stem; {key} placeholders are filled from the givens like a wording. */
  intro: string;
  /** 1-based position of this part, and how many parts the case has. */
  part: number;
  parts: number;
}

export interface GivenChip {
  key: string;
  label: string;
  q: Quantity;
  sig: number;
}

export interface CalcInstance {
  key: string;
  templateId: string;
  seed: number;
  text: string;
  givens: GivenChip[];
  expected: Quantity;
  /** Value of every reference node, for path comparison. */
  referenceValues: Record<string, Quantity>;
  /** Values the template's misconceptions would produce. */
  misconceptionValues: { message: string; q: Quantity }[];
  /** Case-study parts: the stem with this instance's numbers. */
  intro?: string;
}

/** Small, fast, seedable PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

export const roundSig = (x: number, sig: number) => (x === 0 ? 0 : Number(x.toPrecision(sig)));
export const roundDecimals = (x: number, d: number) => Number(x.toFixed(d));

/** Significant figures needed to show `x` with `d` decimals (at least 1). */
export const sigForDecimals = (x: number, d: number) =>
  Math.max(1, (x === 0 ? 1 : Math.floor(Math.log10(Math.abs(x))) + 1) + d);

/** Round a quantity in a display unit, returning the rounded quantity and its s.f. */
function roundIn(q: Quantity, unit: string, sig?: number, decimals?: number): { q: Quantity; sig: number } {
  const disp = fromSI(q.value, unit, q.kind);
  let rounded: number;
  let s: number;
  if (decimals !== undefined) {
    rounded = roundDecimals(disp, decimals);
    s = sigForDecimals(rounded, decimals);
  } else {
    s = sig ?? 3;
    rounded = roundSig(disp, s);
  }
  return { q: qty(rounded, unit, q.kind), sig: s };
}

function drawParam(r: () => number, p: ParamSpec): { q: Quantity; sig: number } {
  let x: number;
  if (p.choices) x = pick(r, p.choices);
  else if (p.log) x = Math.exp(Math.log(p.min!) + r() * (Math.log(p.max!) - Math.log(p.min!)));
  else x = p.min! + r() * (p.max! - p.min!);
  const base = qty(x, p.unit, p.kind);
  const unit = p.displayUnits ? pick(r, p.displayUnits) : p.unit;
  return roundIn(base, unit, p.sig, p.decimals);
}

function fillText(text: string, givens: GivenChip[]): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => {
    const g = givens.find((x) => x.key === key);
    return g ? formatQuantity(g.q, g.sig) : m;
  });
}

export function relClose(a: number, b: number, rel: number) {
  return Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
}

export function instantiate(t: CalcTemplate, seed: number): Result<CalcInstance> {
  let lastError = 'constraint never satisfied';
  for (let attempt = 0; attempt < 60; attempt++) {
    const r = rng(seed * 7919 + attempt);
    const env: Record<Ref, Quantity> = {};
    const paramSig: Record<string, number> = {};
    for (const [k, spec] of Object.entries(t.params)) {
      const d = drawParam(r, spec);
      env[`p.${k}`] = d.q;
      paramSig[k] = d.sig;
    }

    const setup = evaluateGraph(t.setup ?? [], env);
    if (!setup.ok) {
      lastError = setup.error.message;
      continue;
    }

    const givens: GivenChip[] = [];
    for (const g of t.given) {
      const src = setup.value[g.from];
      if (!src) return fail('missing', `Template ${t.id}: unresolved ${g.from}`);
      let chip: { q: Quantity; sig: number };
      if (g.from.startsWith('p.') && !g.unit && !g.displayUnits && g.sig === undefined && g.decimals === undefined) {
        chip = { q: src, sig: paramSig[g.from.slice(2)] ?? 3 };
      } else {
        const unit = g.displayUnits ? pick(r, g.displayUnits) : (g.unit ?? src.unit);
        chip = roundIn(src, unit, g.sig, g.decimals);
      }
      givens.push({ key: g.key, label: g.label, ...chip });
    }

    const genv: Record<Ref, Quantity> = Object.fromEntries(givens.map((g) => [`g.${g.key}`, g.q]));
    const ref = evaluateGraph(t.reference, genv);
    if (!ref.ok) {
      lastError = ref.error.message;
      continue;
    }
    const raw = ref.value[`n.${t.answer.node}`]!;
    const conv = convert(raw, t.answer.unit);
    if (!conv.ok) return fail('dimension', `Template ${t.id}: answer unit mismatch`);
    const expected = conv.value;
    if (!Number.isFinite(displayValue(expected))) continue;

    if (t.constraint) {
      const v = Object.fromEntries(givens.map((g) => [g.key, g.q.value]));
      if (!t.constraint({ ...v, answer: expected.value })) continue;
    }

    const referenceValues: Record<string, Quantity> = {};
    for (const n of t.reference) referenceValues[n.id] = ref.value[`n.${n.id}`]!;

    const misconceptionValues: CalcInstance['misconceptionValues'] = [];
    for (const m of t.misconceptions ?? []) {
      const res = evaluateGraph(m.reference, genv);
      const q = res.ok ? res.value[`n.${m.answer}`] : undefined;
      // A misconception that happens to give the right answer for this instance is not useful.
      if (q && !relClose(q.value, expected.value, 0.02)) misconceptionValues.push({ message: m.message, q });
    }

    return ok({
      key: `${t.id}#${seed}`,
      templateId: t.id,
      seed,
      text: fillText(pick(r, t.wordings), givens),
      givens,
      expected,
      referenceValues,
      misconceptionValues,
      ...(t.caseStudy && { intro: fillText(t.caseStudy.intro, givens) }),
    });
  }
  return fail('no-solution', `Template ${t.id}: could not generate an instance (${lastError})`);
}

/** Exposed for the UI: the unit symbol of the asked quantity. */
export const answerUnitSymbol = (t: CalcTemplate) => getUnit(t.answer.unit).symbol;
