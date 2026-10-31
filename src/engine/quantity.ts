import { D, type Dim, eqDim } from './dims';
import { fail, ok, type Result } from './result';
import { getUnit } from './units';
import { formatNumber } from './format';

/** Temperatures need a kind: absolute (T) and differences (ΔT) convert differently from °C. */
export type QKind = 'abs-temp' | 'delta-temp';

export interface Quantity {
  /** Value in SI base units. */
  value: number;
  dim: Dim;
  /** Display unit id (see units.ts). */
  unit: string;
  kind?: QKind;
}

const isTemp = (d: Dim) => eqDim(d, D.temperature);

export function toSI(display: number, unitId: string, kind?: QKind): number {
  const unit = getUnit(unitId);
  const offset = kind === 'delta-temp' ? 0 : (unit.offset ?? 0);
  return display * unit.factor + offset;
}

export function fromSI(si: number, unitId: string, kind?: QKind): number {
  const unit = getUnit(unitId);
  const offset = kind === 'delta-temp' ? 0 : (unit.offset ?? 0);
  return (si - offset) / unit.factor;
}

/** Build a quantity from a display value. Temperatures default to absolute. */
export function qty(display: number, unitId: string, kind?: QKind): Quantity {
  const unit = getUnit(unitId);
  const k = kind ?? (isTemp(unit.dim) ? 'abs-temp' : undefined);
  return { value: toSI(display, unitId, k), dim: unit.dim, unit: unitId, ...(k && { kind: k }) };
}

/** A quantity's value in its own display unit. */
export const displayValue = (q: Quantity): number => fromSI(q.value, q.unit, q.kind);

/** Change display unit. The SI value is unchanged; only the presentation moves. */
export function convert(q: Quantity, unitId: string): Result<Quantity> {
  const unit = getUnit(unitId);
  if (!eqDim(unit.dim, q.dim)) {
    return fail('dimension', `Cannot express ${getUnit(q.unit).symbol || 'a dimensionless number'} in ${unit.symbol || 'dimensionless form'}`);
  }
  return ok({ ...q, unit: unitId });
}

export function formatQuantity(q: Quantity, sig = 3): string {
  const sym = getUnit(q.unit).symbol;
  const num = formatNumber(displayValue(q), sig);
  return sym ? `${num} ${sym}` : num;
}
