/**
 * Steady-state and pre-equilibrium derivations for mechanisms of elementary steps.
 *
 * You choose which intermediates are in steady state (d[X]/dt = 0) and which reversible
 * steps are fast pre-equilibria (forward rate = backward rate). The engine writes those
 * equations by mass action, solves them exactly, substitutes into the rate of interest,
 * and lists the limiting cases (one denominator term dominating).
 */
import {
  add,
  asMonomial,
  byPowerOf,
  constant,
  isZero,
  mul,
  neg,
  pow,
  rat,
  ratTex,
  polyTex,
  rDiv,
  rMul,
  sameValue,
  scale,
  simplify,
  displayTerms,
  sub,
  substitute,
  substituteR,
  sym,
  symbols,
  ZERO,
  type Poly,
  type Rational,
  type SymbolOrder,
} from './algebra';

export interface MechanismStep {
  /** Elementary step, e.g. "A + M -> A* + M" or "2 NO -> N2O2" (coefficient, space, species). */
  eq: string;
  /** Rate constant symbol: k1, km1 (k₋₁), kd, kp… */
  k: string;
  /** Rate constant of the reverse step, if the step is reversible. */
  back?: string;
}

export interface Mechanism {
  id: string;
  title: string;
  topic: string;
  /** One-line context shown under the title. */
  blurb: string;
  /** Species name → TeX body (inside \mathrm{}), in display order. */
  species: Record<string, string>;
  steps: MechanismStep[];
  /** Species that may be put in steady state. */
  intermediates: string[];
  /** The rate asked for: d[species]/dt, negated for a reactant. */
  rate: { species: string; sign?: 1 | -1 };
  /** Mass balance, e.g. [E]₀ = [E] + [ES]: `free` is replaced by total − the others. */
  conserve?: { total: string; tex: string; free: string; species: string[] };
  /** Approximations to ask about in practice mode. */
  challenges: Choice[];
  explanation: string;
  reviewed: boolean;
  todoVerify?: string[];
}

export interface Choice {
  /** Intermediates in steady state. */
  ss: string[];
  /** Indices (into `steps`) of reversible steps treated as fast pre-equilibria. */
  pe: number[];
}

export interface Elementary {
  k: string;
  reactants: Record<string, number>;
  products: Record<string, number>;
}

export interface DerivationStep {
  title: string;
  tex: string;
}

export type Derivation =
  | { ok: true; steps: DerivationStep[]; rate: Rational; rateTex: string; lhsTex: string; limits: { when: string; tex: string; rate: Rational }[] }
  | { ok: false; steps: DerivationStep[]; error: string };

// ---------- Parsing and naming ----------

function parseSide(side: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of side.split(' + ').map((s) => s.trim())) {
    const m = part.match(/^(\d+)\s+(.+)$/);
    const [n, sp] = m ? [Number(m[1]), m[2]!] : [1, part];
    out[sp] = (out[sp] ?? 0) + n;
  }
  return out;
}

export function elementarySteps(mech: Mechanism): (Elementary & { from: number; reverse: boolean })[] {
  return mech.steps.flatMap((s, i) => {
    const [l, r] = s.eq.split('->').map((x) => x.trim()) as [string, string];
    const f = { k: s.k, reactants: parseSide(l), products: parseSide(r), from: i, reverse: false };
    return s.back ? [f, { k: s.back, reactants: f.products, products: f.reactants, from: i, reverse: true }] : [f];
  });
}

/** k1 → k_{1}, km1 → k_{-1}, kd → k_\mathrm{d}. */
export function kTex(k: string): string {
  const num = k.match(/^k(m?)(\d+)$/);
  if (num) return `k_{${num[1] ? '-' : ''}${num[2]}}`;
  const word = k.match(/^k([A-Za-z]+)$/);
  return word ? `k_\\mathrm{${word[1]}}` : k;
}

export const conc = (sp: string) => `[${sp}]`;

export function symbolTex(mech: Mechanism): (s: string) => string {
  return (s) => {
    if (s.startsWith('[')) {
      const sp = s.slice(1, -1);
      return `[\\mathrm{${mech.species[sp] ?? sp}}]`;
    }
    if (mech.conserve && s === mech.conserve.total) return mech.conserve.tex;
    return kTex(s);
  };
}

export function symbolOrder(mech: Mechanism): SymbolOrder {
  const order = [
    ...mech.steps.flatMap((s) => (s.back ? [s.k, s.back] : [s.k])),
    ...(mech.conserve ? [mech.conserve.total] : []),
    ...Object.keys(mech.species).map(conc),
  ];
  return (s) => {
    const i = order.indexOf(s);
    return i === -1 ? order.length : i;
  };
}

/** Every symbol that can appear in a result (for numeric comparison). */
export const allSymbols = (mech: Mechanism) => [
  ...mech.steps.flatMap((s) => (s.back ? [s.k, s.back] : [s.k])),
  ...(mech.conserve ? [mech.conserve.total] : []),
  ...Object.keys(mech.species).map(conc),
];

export const rateOf = (e: Elementary): Poly => mul(sym(e.k), ...Object.entries(e.reactants).map(([sp, n]) => sym(conc(sp), n)));

/** A mass-action expression written step by step, in mechanism order (not collected). */
function stepwiseTex(mech: Mechanism, coef: (e: Elementary) => number): string {
  const tex = symbolTex(mech);
  const order = symbolOrder(mech);
  const parts = elementarySteps(mech)
    .map((e) => ({ c: coef(e), t: polyTex(rateOf(e), tex, order) }))
    .filter((x) => x.c !== 0)
    .map((x, i) => `${x.c < 0 ? (i ? ' - ' : '-') : i ? ' + ' : ''}${Math.abs(x.c) === 1 ? '' : Math.abs(x.c)}${x.t}`);
  return parts.length ? parts.join('') : '0';
}

const netRateTex = (mech: Mechanism, sp: string, sign = 1) =>
  stepwiseTex(mech, (e) => sign * ((e.products[sp] ?? 0) - (e.reactants[sp] ?? 0)));

/** d[sp]/dt by mass action. */
export function netRate(mech: Mechanism, sp: string): Poly {
  return add(...elementarySteps(mech).map((e) => scale(rateOf(e), (e.products[sp] ?? 0) - (e.reactants[sp] ?? 0))));
}

/** The intermediate a pre-equilibrium determines: one formed in the forward step, else one consumed. */
export function preEquilibriumSpecies(mech: Mechanism, stepIndex: number, ss: readonly string[] = []): string | undefined {
  const s = elementarySteps(mech).find((e) => e.from === stepIndex && !e.reverse);
  if (!s) return undefined;
  const pick = (side: Record<string, number>) => Object.keys(side).find((sp) => mech.intermediates.includes(sp) && !ss.includes(sp));
  return pick(s.products) ?? pick(s.reactants);
}

// ---------- Solving ----------

/** A solved unknown: [X]^power = value. */
export interface Solution {
  power: number;
  value: Rational;
}

/** Replace x^power by `value` throughout p (every power of x must be a multiple, unless the value is a monomial). */
export function substitutePower(p: Poly, x: string, { power, value }: Solution): Rational {
  if (power === 1) return substitute(p, x, value);
  const scaled = p.map((t) => {
    const e = t.m[x];
    if (e === undefined) return t;
    if (!Number.isInteger(e / power)) throw new Error(`${x} appears to a power that is not a multiple of ${power}`);
    return { c: t.c, m: { ...t.m, [x]: e / power } };
  });
  return substitute(scaled, x, value);
}

/** Solve polynomial equations (each = 0) for the unknowns, or explain why not. */
function solve(eqs: Poly[], unknowns: string[], order: SymbolOrder): { values: Map<string, Solution>; dens: Poly[] } | string {
  const values = new Map<string, Solution>();
  const dens: Poly[] = [];
  let pending = eqs.filter((e) => !isZero(e));
  let left = [...unknowns];

  const assign = (x: string, sol: Solution) => {
    values.set(x, sol);
    if (!asMonomial(sol.value.den)) dens.push(sol.value.den);
    pending = pending.map((e) => substitutePower(e, x, sol).num).filter((e) => !isZero(e));
    left = left.filter((u) => u !== x);
  };

  try {
    for (let guard = 0; left.length && guard < 10; guard++) {
      const single = pending.find((e) => left.filter((u) => symbols(e).has(u)).length === 1);
      if (single) {
        const x = left.find((u) => symbols(single).has(u))!;
        const groups = byPowerOf(single, x);
        const powers = [...groups.keys()].sort((a, b) => a - b);
        if (powers.length !== 2) return `The equation for ${x} cannot be solved in closed form with this choice.`;
        // c_p x^p + c_q x^q = 0, with x ≠ 0: x^(p−q) = −c_q / c_p.
        const [q, p] = powers as [number, number];
        const n = p - q;
        const v = simplify(rat(neg(groups.get(q)!), groups.get(p)!), order);
        const mono = asMonomial(v.num) && asMonomial(v.den);
        if (n === 1) assign(x, { power: 1, value: v });
        else if (mono && mono.c > 0 && asMonomial(v.num)!.c > 0) assign(x, { power: 1, value: rat(pow(mul(v.num, pow(v.den, -1)), 1 / n)) });
        else if (Number.isInteger(n)) assign(x, { power: n, value: v });
        else return `The equation for ${x} cannot be solved in closed form with this choice.`;
        continue;
      }
      // No equation with a single unknown left: solve the rest as a linear system.
      const lin = linearSystem(pending, left);
      if (typeof lin === 'string') return lin;
      lin.forEach((v, i) => {
        const s = simplify(v, order);
        values.set(left[i]!, { power: 1, value: s });
        if (!asMonomial(s.den)) dens.push(s.den);
      });
      left = [];
    }
  } catch (e) {
    return e instanceof Error ? `This choice cannot be solved in closed form: ${e.message}.` : String(e);
  }
  return left.length ? 'Not enough equations to find every approximated intermediate.' : { values, dens };
}

function det(m: Poly[][]): Poly {
  if (m.length === 1) return m[0]![0]!;
  return add(
    ...m[0]!.map((a, j) => {
      const minor = m.slice(1).map((row) => row.filter((_, c) => c !== j));
      return scale(mul(a, det(minor)), j % 2 ? -1 : 1);
    }),
  );
}

/** Cramer's rule for equations linear in the unknowns jointly. */
function linearSystem(eqs: Poly[], xs: string[]): Rational[] | string {
  if (eqs.length < xs.length) return 'Not enough equations to find every approximated intermediate.';
  const rows = eqs.slice(0, xs.length);
  const A: Poly[][] = [];
  const b: Poly[] = [];
  for (const e of rows) {
    const row: Poly[] = xs.map(() => ZERO);
    let rest: Poly = ZERO;
    for (const t of e) {
      const inv = xs.filter((x) => x in t.m);
      if (inv.length === 0) rest = add(rest, [t]);
      else if (inv.length === 1 && t.m[inv[0]!] === 1) {
        const j = xs.indexOf(inv[0]!);
        const m = { ...t.m };
        delete m[inv[0]!];
        row[j] = add(row[j]!, [{ c: t.c, m }]);
      } else return 'These intermediates react with each other, so the steady-state equations are not linear: try a different choice.';
    }
    A.push(row);
    b.push(neg(rest));
  }
  const D = det(A);
  if (isZero(D)) return 'The steady-state equations are not independent with this choice.';
  return xs.map((_, j) => rat(det(A.map((row, i) => row.map((a, c) => (c === j ? b[i]! : a)))), D));
}

// ---------- Derivation ----------

export function derive(mech: Mechanism, choice: Choice): Derivation {
  const tex = symbolTex(mech);
  const order = symbolOrder(mech);
  const P = (p: Poly) => polyTex(p, tex, order);
  const steps: DerivationStep[] = [];
  const elem = elementarySteps(mech);

  const { species: target, sign = 1 } = mech.rate;
  const d = (sp: string) => `\\frac{\\mathrm{d}${tex(conc(sp))}}{\\mathrm{d}t}`;
  const lhsTex = `${sign < 0 ? '-' : ''}${d(target)}`;
  let rateExpr = scale(netRate(mech, target), sign);
  steps.push({ title: 'Rate from the elementary steps', tex: `${lhsTex} = ${netRateTex(mech, target, sign)}` });

  const eqs: Poly[] = [];
  const unknowns: string[] = [];
  for (const sp of choice.ss) {
    const e = netRate(mech, sp);
    steps.push({ title: `Steady state on ${speciesMath(mech, sp)}`, tex: `${d(sp)} = ${netRateTex(mech, sp)} = 0` });
    eqs.push(e);
    unknowns.push(conc(sp));
  }
  for (const i of choice.pe) {
    const f = elem.find((e) => e.from === i && !e.reverse);
    const b = elem.find((e) => e.from === i && e.reverse);
    const sp = preEquilibriumSpecies(mech, i, choice.ss);
    if (!f || !b || !sp) return { ok: false, steps, error: `Step ${i + 1} cannot be a pre-equilibrium here.` };
    steps.push({ title: `Fast pre-equilibrium in step ${i + 1}`, tex: `${P(rateOf(f))} = ${P(rateOf(b))}` });
    eqs.push(sub(rateOf(f), rateOf(b)));
    unknowns.push(conc(sp));
  }

  if (mech.conserve) {
    const { total, free, species } = mech.conserve;
    const others = species.filter((s) => s !== free);
    const value = sub(sym(total), add(...others.map((s) => sym(conc(s)))));
    steps.push({ title: 'Mass balance', tex: `${tex(conc(free))} = ${P(value)}` });
    const sv = rat(value);
    for (let i = 0; i < eqs.length; i++) eqs[i] = substitute(eqs[i]!, conc(free), sv).num;
    rateExpr = substitute(rateExpr, conc(free), sv).num;
  }

  if (!unknowns.length) {
    const missing = mech.intermediates.filter((sp) => rateExpr.some((t) => conc(sp) in t.m));
    if (missing.length) {
      return { ok: false, steps, error: `The rate still contains ${missing.map((s) => `[${s}]`).join(', ')}. Put ${missing.length > 1 ? 'them' : 'it'} in steady state, or mark a step that forms ${missing.length > 1 ? 'them' : 'it'} as a pre-equilibrium.` };
    }
  }

  const sol = solve(eqs, unknowns, order);
  if (typeof sol === 'string') return { ok: false, steps, error: sol };
  for (const [x, v] of sol.values) {
    steps.push({ title: `Solve for $${tex(x)}$`, tex: `${tex(x)}${v.power === 1 ? '' : `^{${v.power}}`} = ${ratTex(v.value, tex, order)}` });
  }

  let rate: Rational = rat(rateExpr);
  try {
    for (const [x, v] of sol.values) rate = rDiv(substitutePower(rate.num, x, v), substitutePower(rate.den, x, v));
  } catch (e) {
    return { ok: false, steps, error: `The rate cannot be written in closed form with this choice (${e instanceof Error ? e.message : e}).` };
  }
  rate = simplify(rate, order, sol.dens);

  const leftover = [...symbols(rate.num), ...symbols(rate.den)].filter((s) => mech.intermediates.some((sp) => conc(sp) === s));
  if (leftover.length) {
    return { ok: false, steps, error: `The rate still contains ${leftover.join(', ')}. Approximate ${leftover.length > 1 ? 'those intermediates' : 'that intermediate'} too.` };
  }
  const rateTex = ratTex(rate, tex, order);

  return { ok: true, steps, rate, rateTex, lhsTex, limits: limits(rate, tex, order) };
}

/** One denominator term dominating the others. */
function limits(rate: Rational, tex: (s: string) => string, order: SymbolOrder) {
  if (rate.den.length < 2) return [];
  return displayTerms(rate.den, order).map((t) => {
    const others = sub(rate.den, [t]);
    const r = simplify(rDiv(rat(rate.num), rat([t])), order);
    return { when: `${polyTex([t], tex, order)} \\gg ${polyTex(others, tex, order)}`, tex: ratTex(r, tex, order), rate: r };
  });
}

/** Every valid approximation choice: each intermediate in steady state or not, each reversible step pre-equilibrium or not. */
export function allChoices(mech: Mechanism): Choice[] {
  const rev = mech.steps.map((s, i) => (s.back ? i : -1)).filter((i) => i >= 0);
  const out: Choice[] = [];
  for (let mask = 0; mask < 1 << (mech.intermediates.length + rev.length); mask++) {
    const ss = mech.intermediates.filter((_, i) => mask & (1 << i));
    const pe = rev.filter((_, j) => mask & (1 << (mech.intermediates.length + j)));
    const peSpecies = pe.map((i) => preEquilibriumSpecies(mech, i, ss));
    if (peSpecies.some((s) => !s) || new Set(peSpecies).size !== peSpecies.length) continue;
    out.push({ ss, pe });
  }
  return out;
}

export const choiceKey = (c: Choice) => `ss:${[...c.ss].sort().join(',')}|pe:${[...c.pe].sort().join(',')}`;

/** Species as inline maths for text that may contain $…$ (rendered by RichText). */
export const speciesMath = (mech: Mechanism, sp: string) => `$\\mathrm{${mech.species[sp] ?? sp}}$`;

export function describeChoice(mech: Mechanism, c: Choice): string {
  const parts = [
    ...c.ss.map((s) => `${speciesMath(mech, s)} in steady state`),
    ...c.pe.map((i) => `step ${i + 1} as a fast pre-equilibrium`),
  ];
  return parts.length ? parts.join(' and ') : 'no approximation';
}

export interface ChallengeOption {
  rate: Rational;
  tex: string;
  correct: boolean;
  /** Why a distractor is wrong, when known. */
  why?: string;
}

/**
 * Multiple-choice rate laws for a challenge: the right one, plus distractors from other
 * approximations, its own limiting cases, dropping the reverse step, and slips in the
 * stoichiometric factor. Distractors that equal the answer numerically are removed.
 */
export function challengeOptions(mech: Mechanism, choice: Choice, rnd: () => number, count = 4): ChallengeOption[] | null {
  const res = derive(mech, choice);
  if (!res.ok) return null;
  const tex = symbolTex(mech);
  const order = symbolOrder(mech);
  const syms = allSymbols(mech);
  const candidates: ChallengeOption[] = [];
  const push = (rate: Rational, why: string) => candidates.push({ rate, tex: ratTex(rate, tex, order), correct: false, why });

  for (const l of res.limits) push(l.rate, `That is only the limit where $${l.when}$.`);
  for (const s of mech.steps) {
    if (!s.back) continue;
    const r = substituteR(res.rate, s.back, rat(ZERO));
    if (!isZero(r.num) && !isZero(r.den)) push(simplify(r, order), `That ignores the reverse of the step with $${kTex(s.k)}$.`);
  }
  for (const c of allChoices(mech)) {
    if (choiceKey(c) === choiceKey(choice)) continue;
    const o = derive(mech, c);
    if (o.ok) push(o.rate, `That follows from ${describeChoice(mech, c)}.`);
  }
  // Typical slips: a sign error in the steady-state equation, and a concentration dropped.
  for (const t of res.rate.den.slice(1)) {
    push(simplify(rat(res.rate.num, sub(res.rate.den, scale([t], 2))), order), 'Check the signs when you collect the terms of the steady-state equation.');
  }
  const numMono = asMonomial(res.rate.num);
  if (numMono) {
    for (const [s, e] of Object.entries(numMono.m)) {
      if (!s.startsWith('[') || e !== 1) continue;
      const m = { ...numMono.m };
      delete m[s];
      push(simplify(rat([{ c: numMono.c, m }], res.rate.den), order), `Check the order in $${tex(s)}$: every rate term carries the concentrations of its reactants.`);
    }
  }
  const hasTwo = elementarySteps(mech).some((e) => Object.values(e.reactants).some((n) => n > 1) || Object.values(e.products).some((n) => n > 1));
  if (hasTwo) {
    push(simplify(rMul(res.rate, rat(constant(2))), order), 'Check the stoichiometric factor of 2.');
    push(simplify(rMul(res.rate, rat(constant(0.5))), order), 'Check the stoichiometric factor of 2.');
  }

  const chosen: ChallengeOption[] = [{ rate: res.rate, tex: res.rateTex, correct: true }];
  const shuffled = candidates.map((c) => ({ c, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.c);
  for (const c of shuffled) {
    if (chosen.length >= count) break;
    if (!chosen.some((o) => sameValue(o.rate, c.rate, syms))) chosen.push(c);
  }
  return chosen.map((c) => ({ c, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.c);
}

