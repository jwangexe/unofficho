import { type Dim, eqDim } from './dims';
import { getUnit, unitForDim } from './units';
import type { QKind, Quantity } from './quantity';
import { fail, ok, type Result } from './result';
import { findRoots } from './solver';

export type Topic = 'stoich' | 'thermo' | 'kinetics' | 'equilibrium' | 'electro' | 'other';

export interface VarSpec {
  /** Key used in relations and data files, e.g. "dG". */
  sym: string;
  /** Unicode label for chips, e.g. "ΔG". */
  label: string;
  latex: string;
  name: string;
  /**
   * Fixed dimension, or `{ any: group }`: any dimension, but every variable in the same
   * group must share it (e.g. [A] and [A]₀ in a first-order decay can be concentrations,
   * pressures or counts).
   */
  dim: Dim | { any: string };
  /**
   * The variable may also be given in an alternative extensive/molar form (e.g. ΔH in kJ
   * or kJ mol⁻¹). All flex variables in one formula must use the same form.
   */
  flexUnit?: string;
  kind?: QKind;
  /** Default display unit (and the unit of `examples`). */
  unit: string;
  /** 'positive' (default), 'nonneg', or 'signed'. */
  sign?: 'positive' | 'nonneg' | 'signed';
  integer?: boolean;
  /** False for fixed parameters such as stoichiometric coefficients. Default true. */
  solvable?: boolean;
  /** Typical SI value, used to choose between multiple roots. */
  typical?: number;
  /**
   * A small whole number set with −/+ in the app (e.g. a stoichiometric coefficient) instead of
   * a chip. Such variables are never solved for.
   */
  stepper?: { min: number; max: number; initial: number };
}

/**
 * A repeating group of variables, one set per chemical species, for formulas such as
 * K = Π([X]₀ + νξ)^ν that take any number of species. Species are numbered from 1.
 */
export interface SpeciesGroup {
  min: number;
  max: number;
  /** Variables species i adds, e.g. its coefficient ν_i and initial concentration [X_i]₀. */
  vars: (i: number) => VarSpec[];
  /** Symbol of species i's stoichiometric coefficient: chosen with a stepper, never solved for. */
  coefficient: (i: number) => string;
  /** The relation written out for particular coefficients (negative = reactant). */
  latexFor: (coefficients: readonly number[]) => string;
}

export interface Formula {
  id: string;
  name: string;
  topic: Topic;
  /** Main display form. */
  latex: string;
  vars: VarSpec[];
  /** The relation as [lhs, rhs] in SI values. Return NaN outside the domain. */
  relation: (v: Record<string, number>) => readonly [number, number];
  /** Hand-written rearrangement for each solvable variable. */
  rearranged: Record<string, string>;
  /** Optional search interval for an unknown, given the other values (SI). */
  bracket?: (unknown: string, v: Record<string, number>) => readonly [number, number] | undefined;
  /** Physical constraint on a full solution; return a message if violated. */
  constraint?: (v: Record<string, number>) => string | null;
  /** Advisory warnings on a full solution (e.g. "approximation not valid"). */
  warnings?: (v: Record<string, number>) => string[];
  notes?: string;
  /**
   * Worked values in each variable's display unit with exactly one solvable variable
   * omitted. Tests solve for the missing one, then round-trip every other variable.
   */
  examples: Record<string, number>[];
  reviewed: boolean;
  todoVerify?: string[];
  /** Per-species variables; `vars` then holds only the shared ones until species are added. */
  species?: SpeciesGroup;
  /** Set on a formula built for a particular number of species. */
  speciesCount?: number;
}

export const defineFormula = (f: Formula): Formula => f;

const withSpeciesCache = new Map<string, Formula>();

/** The formula with n species' variables added (cached). Formulas without species are returned as is. */
export function withSpecies(f: Formula, n: number): Formula {
  if (!f.species) return f;
  const key = `${f.id}#${n}`;
  let out = withSpeciesCache.get(key);
  if (!out) {
    const extra = Array.from({ length: n }, (_, i) => f.species!.vars(i + 1)).flat();
    out = { ...f, vars: [...f.vars, ...extra], speciesCount: n };
    withSpeciesCache.set(key, out);
  }
  return out;
}

/** The concrete formula for a set of variable symbols (counts species by their coefficients). */
export function formulaForSymbols(f: Formula, syms: Iterable<string>): Formula {
  if (!f.species) return f;
  const set = new Set(syms);
  let n = 0;
  while (set.has(f.species.coefficient(n + 1))) n++;
  return withSpecies(f, n);
}

export const varSpec = (f: Formula, sym: string): VarSpec => {
  const v = f.vars.find((x) => x.sym === sym);
  if (!v) throw new Error(`Formula ${f.id} has no variable "${sym}"`);
  return v;
};

const isAny = (d: VarSpec['dim']): d is { any: string } => !Array.isArray(d);

type Form = 'base' | 'flex';

/** Which form (base or flex) a quantity matches for a variable, or null if neither. */
function matchForm(spec: VarSpec, q: Quantity): Form | null {
  if (isAny(spec.dim)) return 'base';
  if (eqDim(spec.dim, q.dim)) return 'base';
  if (spec.flexUnit && eqDim(getUnit(spec.flexUnit).dim, q.dim)) return 'flex';
  return null;
}

const describeUnit = (spec: VarSpec) =>
  [spec.unit, spec.flexUnit]
    .filter((x): x is string => !!x)
    .map((u) => getUnit(u).symbol || 'a dimensionless number')
    .join(' or ');

/**
 * Check one quantity against a slot, given the slots already filled.
 * This is the drop-time check for the chip UI.
 */
export function checkAssignment(
  f: Formula,
  sym: string,
  q: Quantity,
  assigned: Record<string, Quantity>,
): Result<{ form: Form }> {
  const spec = varSpec(f, sym);

  const form = matchForm(spec, q);
  if (!form) {
    return fail('dimension', `${spec.label} needs ${describeUnit(spec)}, not ${getUnit(q.unit).symbol || 'a dimensionless number'}`);
  }

  if (spec.kind === 'abs-temp' && q.kind === 'delta-temp') {
    return fail('kind', `${spec.label} needs an absolute temperature, not a temperature change`);
  }
  if (spec.kind === 'delta-temp' && q.kind === 'abs-temp') {
    return fail('kind', `${spec.label} is a temperature change: subtract two temperatures first`);
  }

  const sign = spec.sign ?? 'positive';
  if (sign === 'positive' && !(q.value > 0)) return fail('domain', `${spec.label} must be positive`);
  if (sign === 'nonneg' && !(q.value >= 0)) return fail('domain', `${spec.label} cannot be negative`);

  for (const [otherSym, other] of Object.entries(assigned)) {
    if (otherSym === sym) continue;
    const o = varSpec(f, otherSym);
    if (isAny(spec.dim) && isAny(o.dim) && spec.dim.any === o.dim.any && !eqDim(q.dim, other.dim)) {
      return fail('dimension', `${spec.label} must have the same units as ${o.label}`);
    }
    if (spec.flexUnit && o.flexUnit && matchForm(o, other) !== form) {
      return fail('molar-mix', `${spec.label} and ${o.label} must both be per mole, or both be totals`);
    }
  }
  return ok({ form });
}

export interface Solution {
  quantity: Quantity;
  warnings: string[];
  /** Other mathematically valid roots, if any (SI). */
  otherRoots: number[];
}

/** Solve formula `f` for `unknown`, given quantities for every other variable. */
export function solveFormula(
  f: Formula,
  unknown: string,
  assigned: Record<string, Quantity>,
): Result<Solution> {
  const target = varSpec(f, unknown);
  if (target.solvable === false) {
    return fail('not-solvable', `${target.label} is a fixed parameter of this formula`);
  }

  const known: Record<string, number> = {};
  let form: Form | undefined;
  const checked: Record<string, Quantity> = {};
  for (const spec of f.vars) {
    if (spec.sym === unknown) continue;
    const q = assigned[spec.sym];
    if (!q) return fail('missing', `Fill ${spec.label} first`);
    const res = checkAssignment(f, spec.sym, q, checked);
    if (!res.ok) return res;
    if (spec.flexUnit) form = res.value.form;
    checked[spec.sym] = q;
    known[spec.sym] = q.value;
  }

  // Output dimension and display unit.
  let outDim: Dim;
  let outUnit: string;
  if (isAny(target.dim)) {
    const group = target.dim.any;
    const partner = f.vars.find((s) => s.sym !== unknown && isAny(s.dim) && s.dim.any === group);
    const pq = partner && checked[partner.sym];
    outDim = pq ? pq.dim : getUnit(target.unit).dim;
    outUnit = pq ? pq.unit : target.unit;
  } else if (target.flexUnit && form === 'flex') {
    outDim = getUnit(target.flexUnit).dim;
    outUnit = target.flexUnit;
  } else {
    outDim = target.dim;
    outUnit = target.unit;
  }

  const sign = target.sign ?? 'positive';
  const sides = (x: number) => f.relation({ ...known, [unknown]: x });
  const bracket = f.bracket?.(unknown, known);
  let roots = findRoots(sides, { positive: sign === 'positive', ...(bracket && { bracket }) });

  if (sign === 'nonneg') roots = roots.filter((r) => r >= 0);
  // Whole-number unknowns (electron counts): data given to 3–4 s.f. never lands exactly on an
  // integer, so round anything within 0.1 and say so if the rounding was noticeable.
  const roundingNotes: string[] = [];
  if (target.integer) {
    roots = roots
      .filter((r) => Math.abs(r - Math.round(r)) < 0.1)
      .map((r) => {
        if (Math.abs(r - Math.round(r)) > 1e-3) {
          roundingNotes.push(`${target.label} = ${r.toFixed(3)}, rounded to ${Math.round(r)}`);
        }
        return Math.round(r);
      });
  }
  let violation: string | null = null;
  if (f.constraint) {
    roots = roots.filter((r) => {
      const msg = f.constraint!({ ...known, [unknown]: r });
      if (msg) violation = msg;
      return !msg;
    });
  }

  if (roots.length === 0) {
    const why = violation ? ` (${violation})` : target.integer ? ' (no whole-number solution)' : '';
    return fail('no-solution', `No real solution for ${target.label} with these values${why}`);
  }

  // Several roots: prefer the one nearest the typical value (in log terms when positive).
  let value = roots[0]!;
  if (roots.length > 1 && target.typical !== undefined) {
    const t = target.typical;
    const dist = (r: number) => (r > 0 && t > 0 ? Math.abs(Math.log(r / t)) : Math.abs(r - t));
    value = roots.reduce((best, r) => (dist(r) < dist(best) ? r : best));
  }

  const full = { ...known, [unknown]: value };
  // Keep the unit's dimension and the computed dimension in step for flex/any outputs.
  const unit = eqDim(getUnit(outUnit).dim, outDim) ? outUnit : unitForDim(outDim, value).id;
  return ok({
    quantity: { value, dim: outDim, unit, ...(target.kind && { kind: target.kind }) },
    warnings: [...roundingNotes, ...(f.warnings?.(full) ?? [])],
    otherRoots: roots.filter((r) => r !== value),
  });
}
