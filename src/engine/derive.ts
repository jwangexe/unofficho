/**
 * "Derive it yourself": the steps a student works through, and how each is checked.
 *
 * 1. Equations: for each approximated intermediate, give every elementary step's rate term a
 *    coefficient (−2…+2): d[X]/dt = 0 for steady state, forward − backward = 0 for a
 *    pre-equilibrium. Checked term by term.
 * 2. Mass balance (catalysts): write the free species in terms of the total.
 * 3. Solve by substitution: pick an intermediate, sort term chips into the numerator and
 *    denominator of its solution. The app then substitutes it into the remaining equations.
 * 4. The rate law (chosen from options, since it may need simplifying or a square root).
 */
import { add, asMonomial, byPowerOf, mul, neg, polyTex, pow, rat, rDiv, scale, simplify, sub, sym, type Poly, type Rational, type Term } from './algebra';
import {
  conc,
  elementarySteps,
  netRate,
  preEquilibriumSpecies,
  rateOf,
  speciesMath,
  substitutePower,
  symbolOrder,
  symbolTex,
  type Choice,
  type Mechanism,
  type Solution,
} from './mechanism';

export interface EquationTarget {
  /** The intermediate this equation determines. */
  species: string;
  kind: 'ss' | 'pe';
  /** For a pre-equilibrium, its index in `mech.steps`. */
  step?: number;
  /** Correct coefficient for each elementary step's rate term. */
  coefficients: number[];
}

/** Rate term of each elementary step, as shown on the chips. */
export function stepTerms(mech: Mechanism): { tex: string; poly: Poly; label: string }[] {
  const tex = symbolTex(mech);
  const order = symbolOrder(mech);
  return elementarySteps(mech).map((e) => ({
    tex: polyTex(rateOf(e), tex, order),
    poly: rateOf(e),
    label: `step ${e.from + 1}${mech.steps[e.from]!.back ? (e.reverse ? ' backward' : ' forward') : ''}`,
  }));
}

/** The equations a choice of approximations calls for, one per approximated intermediate. */
export function equationTargets(mech: Mechanism, choice: Choice): EquationTarget[] {
  const elem = elementarySteps(mech);
  return [
    ...choice.ss.map((sp) => ({
      species: sp,
      kind: 'ss' as const,
      coefficients: elem.map((e) => (e.products[sp] ?? 0) - (e.reactants[sp] ?? 0)),
    })),
    ...choice.pe.map((i) => ({
      species: preEquilibriumSpecies(mech, i, choice.ss)!,
      kind: 'pe' as const,
      step: i,
      coefficients: elem.map((e) => (e.from === i ? (e.reverse ? -1 : 1) : 0)),
    })),
  ];
}

export interface TermIssue {
  index: number;
  message: string;
}

/** Compare a student's coefficients with the target; a pre-equilibrium may be written either way round. */
export function checkEquation(mech: Mechanism, target: EquationTarget, given: readonly number[]): TermIssue[] {
  const want = target.coefficients;
  if (target.kind === 'pe' && given.every((c, i) => c === -want[i]!)) return [];
  const terms = stepTerms(mech);
  const sp = speciesMath(mech, target.species);
  const issues: TermIssue[] = [];
  want.forEach((w, i) => {
    const g = given[i] ?? 0;
    if (g === w) return;
    const what = terms[i]!.label;
    let message: string;
    if (target.kind === 'pe') {
      message = w === 0 ? `Only step ${target.step! + 1} belongs in this pre-equilibrium.` : 'Forward rate on one side, backward rate on the other: one is +, the other −.';
    } else if (w === 0) message = `${capital(what)} neither forms nor uses ${sp}.`;
    else if (g === 0) message = `${capital(what)} ${w > 0 ? 'forms' : 'uses up'} ${sp}: it belongs in the equation.`;
    else if (Math.sign(g) !== Math.sign(w)) message = `${capital(what)} ${w > 0 ? 'forms' : 'uses up'} ${sp}, so its term is ${w > 0 ? 'positive' : 'negative'}.`;
    else message = `${capital(what)} ${w > 0 ? 'forms' : 'uses up'} ${Math.abs(w)} ${sp} per event: its coefficient is ${Math.abs(w)}.`;
    issues.push({ index: i, message });
  });
  return issues;
}

const capital = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** Mass balance: free = total − Σ others. Returns the species list to give coefficients to, and the answer. */
export function massBalanceTarget(mech: Mechanism) {
  if (!mech.conserve) return null;
  const { total, free, species } = mech.conserve;
  const parts = [total, ...species.filter((s) => s !== free).map(conc)];
  return { free: conc(free), parts, coefficients: parts.map((_, i) => (i === 0 ? 1 : -1)) };
}

/** Working state: equations left to solve, after the mass balance and the substitutions made so far. */
export interface WorkState {
  equations: Map<string, Poly>;
  solved: { species: string; solution: Solution }[];
  rate: Rational;
  /** Denominators introduced along the way, offered to simplify() as candidate factors. */
  dens: Poly[];
}

export function startWork(mech: Mechanism, choice: Choice): WorkState {
  const targets = equationTargets(mech, choice);
  const terms = stepTerms(mech);
  let equations = new Map(targets.map((t) => [conc(t.species), add(...t.coefficients.map((c, i) => scale(terms[i]!.poly, c)))]));
  let rate = rat(scale(netRate(mech, mech.rate.species), mech.rate.sign ?? 1));
  const mb = massBalanceTarget(mech);
  if (mb) {
    const value = rat(sub(sym(mb.parts[0]!), add(...mb.parts.slice(1).map((p) => sym(p)))));
    equations = new Map([...equations].map(([k, e]) => [k, substitutePower(e, mb.free, { power: 1, value }).num]));
    rate = rat(substitutePower(rate.num, mb.free, { power: 1, value }).num);
  }
  return { equations, solved: [], rate, dens: [] };
}

export interface Chip {
  key: string;
  term: Term;
  tex: string;
  place: 'top' | 'bottom' | 'none';
}

export interface SolveStep {
  species: string;
  /** [X]^power = numerator / denominator. */
  power: number;
  truth: Rational;
  chips: Chip[];
}

/** Can this intermediate be solved for now (its equation has exactly two powers of it)? */
export function solveStep(mech: Mechanism, work: WorkState, x: string, rnd: () => number): SolveStep | null {
  const eq = work.equations.get(x);
  if (!eq) return null;
  const groups = byPowerOf(eq, x);
  const powers = [...groups.keys()].sort((a, b) => a - b);
  if (powers.length !== 2) return null;
  const [q, p] = powers as [number, number];
  const order = symbolOrder(mech);
  const truth = simplify(rat(neg(groups.get(q)!), groups.get(p)!), order, work.dens);
  const tex = symbolTex(mech);
  const termTex = (t: Term) => polyTex([t], tex, order);
  const chips: Chip[] = [
    ...truth.num.map((t) => ({ term: t, place: 'top' as const })),
    ...(asMonomial(truth.den) && Object.keys(truth.den[0]!.m).length === 0 && truth.den[0]!.c === 1 ? [] : truth.den.map((t) => ({ term: t, place: 'bottom' as const }))),
  ].map((c, i) => ({ ...c, key: `t${i}`, tex: termTex(c.term) }));

  // Distractors: a term with one concentration dropped (a typical slip), up to two.
  const seen = new Set(chips.map((c) => c.tex));
  for (const c of chips.slice()) {
    if (chips.length >= 8 || chips.filter((x) => x.place === 'none').length >= 2) break;
    const concs = Object.keys(c.term.m).filter((s) => s.startsWith('['));
    if (concs.length === 0 || Object.keys(c.term.m).length < 2) continue;
    const m = { ...c.term.m };
    delete m[concs[concs.length - 1]!];
    const t = { c: Math.abs(c.term.c), m };
    const tx = termTex(t);
    if (!seen.has(tx)) {
      seen.add(tx);
      chips.push({ key: `d${chips.length}`, term: t, tex: tx, place: 'none' });
    }
  }
  const shuffled = chips.map((c) => ({ c, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.c);
  return { species: x, power: p - q, truth, chips: shuffled };
}

/** Check a chip arrangement; returns the chips that are in the wrong place. */
export function checkSolve(step: SolveStep, placed: Record<string, Chip['place']>): Chip[] {
  return step.chips.filter((c) => (placed[c.key] ?? 'none') !== c.place);
}

/** After a correct solve: record it and substitute into the remaining equations and the rate. */
export function applySolve(work: WorkState, step: SolveStep): WorkState {
  // [X]^n = (single term): take the root, so [X] itself can be substituted anywhere.
  const n = asMonomial(step.truth.num);
  const d = asMonomial(step.truth.den);
  const solution: Solution =
    step.power !== 1 && n && d && n.c > 0 && d.c > 0
      ? { power: 1, value: rat(pow(mul(step.truth.num, pow(step.truth.den, -1)), 1 / step.power)) }
      : { power: step.power, value: step.truth };
  const equations = new Map(
    [...work.equations].filter(([k]) => k !== step.species).map(([k, e]) => [k, substitutePower(e, step.species, solution).num] as const),
  );
  return {
    equations,
    solved: [...work.solved, { species: step.species, solution }],
    rate: work.rate,
    dens: asMonomial(step.truth.den) ? work.dens : [...work.dens, step.truth.den],
  };
}

/** Back-substitute every solution into the rate, in the order they were found. */
export function finalRate(mech: Mechanism, work: WorkState): Rational {
  let r = work.rate;
  for (const { species, solution } of work.solved) {
    r = rDiv(substitutePower(r.num, species, solution), substitutePower(r.den, species, solution));
  }
  return simplify(r, symbolOrder(mech), work.dens);
}
