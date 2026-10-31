/**
 * Answer checking, route comparison and error diagnosis for calculation questions.
 */
import { D, eqDim, isDimensionless } from './dims';
import { evaluateGraph, type Ref } from './graph';
import type { Quantity } from './quantity';
import { getUnit } from './units';
import { relClose, type CalcInstance, type CalcTemplate, type Tolerance } from './template';

export interface CheckResult {
  correct: boolean;
  dimOk: boolean;
  expected: Quantity;
  submitted: Quantity;
  diagnoses: string[];
  /** Reference steps whose value you also computed (any order, any route). */
  matched: string[];
  missed: string[];
}

export function withinTolerance(submitted: number, expected: number, tol: Tolerance = 0.01): boolean {
  if (typeof tol === 'number') return relClose(submitted, expected, tol);
  return Math.abs(submitted - expected) <= tol.abs;
}

const unitName = (q: Quantity) => getUnit(q.unit).symbol || 'no units';

/**
 * Compare the user's computed chips with the reference graph by value, not by order:
 * a reference step counts as reached if any computed chip has the same dimension and value.
 */
export function compareRoute(inst: CalcInstance, computed: readonly Quantity[]) {
  const matched: string[] = [];
  const missed: string[] = [];
  for (const [id, ref] of Object.entries(inst.referenceValues)) {
    const hit = computed.some((q) => eqDim(q.dim, ref.dim) && relClose(q.value, ref.value, 1e-3));
    (hit ? matched : missed).push(id);
  }
  return { matched, missed };
}

interface Perturbation {
  apply: (q: Quantity) => Quantity;
  message: (label: string) => string;
  applies: (q: Quantity) => boolean;
}

const isTemp = (q: Quantity) => eqDim(q.dim, D.temperature);
const isTimeLike = (q: Quantity) => eqDim(q.dim, D.time) || eqDim(q.dim, D.frequency);

const PERTURBATIONS: Perturbation[] = [
  {
    applies: (q) => isTemp(q) && q.kind !== 'delta-temp',
    apply: (q) => ({ ...q, value: q.value - 273.15 }),
    message: (l) => `${l} looks like it was used in °C. Temperatures in these formulas must be in kelvin`,
  },
  {
    applies: (q) => !isTemp(q) && !isDimensionless(q.dim),
    apply: (q) => ({ ...q, value: q.value * 1000 }),
    message: (l) => `${l} is out by a factor of 1000: check the unit prefix (kJ vs J, kPa vs Pa, dm³ vs cm³)`,
  },
  {
    applies: (q) => !isTemp(q) && !isDimensionless(q.dim),
    apply: (q) => ({ ...q, value: q.value / 1000 }),
    message: (l) => `${l} is out by a factor of 1000: check the unit prefix (kJ vs J, kPa vs Pa, dm³ vs cm³)`,
  },
  {
    applies: isTimeLike,
    apply: (q) => ({ ...q, value: eqDim(q.dim, D.time) ? q.value / 60 : q.value * 60 }),
    message: (l) => `${l} seems to have been used in minutes instead of seconds (or vice versa)`,
  },
  {
    applies: (q) => !isTemp(q) && q.value !== 0,
    apply: (q) => ({ ...q, value: -q.value }),
    message: (l) => `${l} seems to have been used with the wrong sign`,
  },
];

const RATIOS: { r: number; message: string }[] = [
  { r: -1, message: 'Right size, wrong sign. Check the sign convention.' },
  { r: 1000, message: 'Out by a factor of 1000: J vs kJ (or another unit prefix)?' },
  { r: 1 / 1000, message: 'Out by a factor of 1000: J vs kJ (or another unit prefix)?' },
  { r: Math.LN10, message: 'Out by ln 10 ≈ 2.303: ln and log₁₀ mixed up?' },
  { r: 1 / Math.LN10, message: 'Out by ln 10 ≈ 2.303: ln and log₁₀ mixed up?' },
  ...[2, 3, 4, 6].flatMap((k) => [
    { r: k, message: `Out by a factor of ${k}: check stoichiometric coefficients or the number of electrons.` },
    { r: 1 / k, message: `Out by a factor of ${k}: check stoichiometric coefficients or the number of electrons.` },
  ]),
];

/** Explain a wrong answer, most specific first. */
export function diagnose(t: CalcTemplate, inst: CalcInstance, submitted: Quantity): string[] {
  if (!eqDim(submitted.dim, inst.expected.dim)) {
    return [`Your answer has units of ${unitName(submitted)}, but the question asks for ${unitName(inst.expected)}.`];
  }
  const tol = t.tolerance ?? 0.01;
  const near = (v: number) => withinTolerance(v, submitted.value, typeof tol === 'number' ? Math.max(tol, 0.01) : tol);

  const out = new Set<string>();
  for (const m of inst.misconceptionValues) if (near(m.q.value)) out.add(m.message);
  if (out.size) return [...out];

  const genv: Record<Ref, Quantity> = Object.fromEntries(inst.givens.map((g) => [`g.${g.key}`, g.q]));
  for (const g of inst.givens) {
    for (const p of PERTURBATIONS) {
      if (!p.applies(g.q)) continue;
      const res = evaluateGraph(t.reference, { ...genv, [`g.${g.key}`]: p.apply(g.q) });
      const v = res.ok ? res.value[`n.${t.answer.node}`]?.value : undefined;
      if (v !== undefined && !withinTolerance(v, inst.expected.value, tol) && near(v)) out.add(p.message(g.label));
    }
  }
  if (out.size) return [...out];

  if (typeof tol === 'number' && inst.expected.value !== 0) {
    const ratio = submitted.value / inst.expected.value;
    const hit = RATIOS.find((x) => relClose(ratio, x.r, 0.02));
    if (hit) return [hit.message];
  }
  return ['No common slip detected. Compare your steps with the reference route.'];
}

export function checkAnswer(
  t: CalcTemplate,
  inst: CalcInstance,
  submitted: Quantity,
  computed: readonly Quantity[],
): CheckResult {
  const dimOk = eqDim(submitted.dim, inst.expected.dim);
  const correct = dimOk && withinTolerance(submitted.value, inst.expected.value, t.tolerance);
  return {
    correct,
    dimOk,
    expected: inst.expected,
    submitted,
    diagnoses: correct ? [] : diagnose(t, inst, submitted),
    ...compareRoute(inst, computed),
  };
}
