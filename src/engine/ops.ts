/**
 * Arithmetic and conversion operations on quantities. Each checks dimensions and keeps
 * track of temperature kinds (absolute T vs ΔT), so e.g. T₂ − T₁ gives a ΔT chip.
 */
import { D, type Dim, divDim, eqDim, isDimensionless, isIntegral, mulDim, powDim } from './dims';
import { convert as convertQ, type QKind, type Quantity } from './quantity';
import { fail, ok, type Result } from './result';
import { getUnit, unitForDim } from './units';

export type OpId =
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'pow'
  | 'ln'
  | 'log10'
  | 'exp'
  | 'pow10'
  | 'sum'
  | 'scale'
  | 'convert';

const isTemp = (d: Dim) => eqDim(d, D.temperature);
const unitLabel = (q: Quantity) => getUnit(q.unit).symbol || 'dimensionless';

/** Build a result, choosing a display unit for its dimension. */
function make(value: number, dim: Dim, preferUnit?: string, kind?: QKind): Result<Quantity> {
  if (!Number.isFinite(value)) return fail('domain', 'The result is not a finite number');
  if (!isIntegral(dim)) return fail('dimension', 'That gives fractional units; check the operation');
  const unit =
    preferUnit && eqDim(getUnit(preferUnit).dim, dim) && getUnit(preferUnit).offset === undefined
      ? preferUnit
      : unitForDim(dim, value).id;
  const k = kind ?? (isTemp(dim) ? 'abs-temp' : undefined);
  return ok({ value, dim, unit, ...(k && { kind: k }) });
}

/** Kept unit for add/sub: the first operand's, unless it is °C (an offset scale) — then K. */
const addUnit = (q: Quantity) => (getUnit(q.unit).offset !== undefined ? 'K' : q.unit);

export function add(a: Quantity, b: Quantity): Result<Quantity> {
  if (!eqDim(a.dim, b.dim)) return fail('dimension', `Cannot add ${unitLabel(a)} and ${unitLabel(b)}`);
  if (a.kind === 'abs-temp' && b.kind === 'abs-temp') {
    return fail('kind', 'Adding two absolute temperatures is meaningless. Did you mean to subtract?');
  }
  const kind = a.kind === 'abs-temp' || b.kind === 'abs-temp' ? 'abs-temp' : a.kind;
  return make(a.value + b.value, a.dim, addUnit(a), kind);
}

export function sub(a: Quantity, b: Quantity): Result<Quantity> {
  if (!eqDim(a.dim, b.dim)) return fail('dimension', `Cannot subtract ${unitLabel(b)} from ${unitLabel(a)}`);
  let kind: QKind | undefined;
  if (isTemp(a.dim)) {
    if (a.kind === 'delta-temp' && b.kind === 'abs-temp') {
      return fail('kind', 'Subtracting an absolute temperature from a temperature change is meaningless');
    }
    kind = a.kind === 'abs-temp' && b.kind === 'abs-temp' ? 'delta-temp' : a.kind;
  }
  return make(a.value - b.value, a.dim, addUnit(a), kind);
}

/** Kind for products: scaling a ΔT by a pure number keeps it a ΔT. */
function scaledKind(q: Quantity, other: Quantity): QKind | undefined {
  return isDimensionless(other.dim) ? q.kind : undefined;
}

export function mul(a: Quantity, b: Quantity): Result<Quantity> {
  const dim = mulDim(a.dim, b.dim);
  const kind = isTemp(dim) ? (scaledKind(a, b) ?? scaledKind(b, a)) : undefined;
  return make(a.value * b.value, dim, isDimensionless(b.dim) ? a.unit : isDimensionless(a.dim) ? b.unit : undefined, kind);
}

export function div(a: Quantity, b: Quantity): Result<Quantity> {
  if (b.value === 0) return fail('domain', 'Division by zero');
  const dim = divDim(a.dim, b.dim);
  const kind = isTemp(dim) && isDimensionless(b.dim) ? a.kind : undefined;
  return make(a.value / b.value, dim, isDimensionless(b.dim) ? a.unit : undefined, kind);
}

export function pow(a: Quantity, p: number): Result<Quantity> {
  if (a.value < 0 && !Number.isInteger(p)) return fail('domain', 'A negative number cannot be raised to a fractional power');
  return make(a.value ** p, powDim(a.dim, p));
}

const needsDimensionless = (name: string, a: Quantity) =>
  fail<Quantity>('dimension', `${name} needs a pure number, but this has units of ${unitLabel(a)}. Take a ratio first.`);

export function ln(a: Quantity): Result<Quantity> {
  if (!isDimensionless(a.dim)) return needsDimensionless('ln', a);
  if (a.value <= 0) return fail('domain', 'ln is only defined for positive numbers');
  return make(Math.log(a.value), D.none);
}

export function log10(a: Quantity): Result<Quantity> {
  if (!isDimensionless(a.dim)) return needsDimensionless('log₁₀', a);
  if (a.value <= 0) return fail('domain', 'log₁₀ is only defined for positive numbers');
  return make(Math.log10(a.value), D.none);
}

export function exp(a: Quantity): Result<Quantity> {
  if (!isDimensionless(a.dim)) return needsDimensionless('exp', a);
  return make(Math.exp(a.value), D.none);
}

export function pow10(a: Quantity): Result<Quantity> {
  if (!isDimensionless(a.dim)) return needsDimensionless('10ˣ', a);
  return make(10 ** a.value, D.none);
}

/** Σ νᵢ·qᵢ, e.g. Hess's law: ΔrH = Σ ν ΔfH(products) − Σ ν ΔfH(reactants) with signed ν. */
export function weightedSum(terms: readonly { coef: number; q: Quantity }[]): Result<Quantity> {
  const first = terms[0];
  if (!first) return fail('missing', 'Add at least one term');
  for (const t of terms) {
    if (!eqDim(t.q.dim, first.q.dim)) {
      return fail('dimension', `All terms must have the same units (${unitLabel(first.q)} vs ${unitLabel(t.q)})`);
    }
    if (t.q.kind === 'abs-temp') return fail('kind', 'Absolute temperatures cannot be summed');
  }
  const value = terms.reduce((s, t) => s + t.coef * t.q.value, 0);
  return make(value, first.q.dim, addUnit(first.q), first.q.kind);
}

/** Multiply by a stoichiometric coefficient (or any pure number). */
export function scale(a: Quantity, coef: number): Result<Quantity> {
  if (a.kind === 'abs-temp' && coef !== 1) return fail('kind', 'Scaling an absolute temperature is meaningless');
  return make(a.value * coef, a.dim, addUnit(a), a.kind);
}

export const convert = convertQ;
