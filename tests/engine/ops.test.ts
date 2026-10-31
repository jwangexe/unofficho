import { describe, expect, it } from 'vitest';
import * as op from '@/engine/ops';
import { displayValue, qty, type Quantity } from '@/engine/quantity';
import type { Result } from '@/engine/result';

const v = (r: Result<Quantity>) => {
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

describe('operations', () => {
  it('T₂ − T₁ gives a temperature change', () => {
    const d = v(op.sub(qty(350, 'K'), qty(25, 'degC')));
    expect(d.kind).toBe('delta-temp');
    expect(displayValue(d)).toBeCloseTo(51.85, 10);
  });

  it('T + ΔT is a temperature; T + T is an error', () => {
    expect(v(op.add(qty(298, 'K'), qty(10, 'K', 'delta-temp'))).kind).toBe('abs-temp');
    const bad = op.add(qty(298, 'K'), qty(300, 'K'));
    expect(!bad.ok && bad.error.code).toBe('kind');
  });

  it('adds kJ mol⁻¹ and J mol⁻¹ correctly, keeping the first unit', () => {
    const r = v(op.add(qty(-92.4, 'kJ/mol'), qty(59093, 'J/mol')));
    expect(r.unit).toBe('kJ/mol');
    expect(displayValue(r)).toBeCloseTo(-33.307, 10);
  });

  it('refuses to add incompatible dimensions', () => {
    expect(op.add(qty(1, 'kJ/mol'), qty(1, 'K')).ok).toBe(false);
  });

  it('ΔH / ΔS gives a temperature in K', () => {
    const T = v(op.div(qty(178, 'kJ/mol'), qty(161, 'J/(K mol)')));
    expect(T.unit).toBe('K');
    expect(T.kind).toBe('abs-temp');
    expect(displayValue(T)).toBeCloseTo(178000 / 161, 9);
  });

  it('T × ΔS gives molar energy in kJ mol⁻¹', () => {
    const r = v(op.mul(qty(298, 'K'), qty(-198.3, 'J/(K mol)')));
    expect(r.unit).toBe('kJ/mol');
    expect(displayValue(r)).toBeCloseTo(-59.0934, 9);
  });

  it('ln and log need dimensionless arguments', () => {
    const bad = op.ln(qty(2e-3, '1/s'));
    expect(!bad.ok && bad.error.code).toBe('dimension');
    const ratio = v(op.div(qty(2e-3, '1/s'), qty(1e-3, '1/s')));
    expect(displayValue(v(op.ln(ratio)))).toBeCloseTo(Math.LN2, 12);
    expect(displayValue(v(op.log10(qty(1e-7, '1'))))).toBeCloseTo(-7, 12);
    expect(displayValue(v(op.pow10(qty(-4.76, '1'))))).toBeCloseTo(10 ** -4.76, 15);
    expect(op.ln(qty(-1, '1')).ok).toBe(false);
  });

  it("Hess's law as a weighted sum: CH₄ + 2O₂ → CO₂ + 2H₂O(l)", () => {
    const fH = { CO2: qty(-393.5, 'kJ/mol'), H2O: qty(-285.8, 'kJ/mol'), CH4: qty(-74.8, 'kJ/mol') };
    const r = v(op.weightedSum([
      { coef: 1, q: fH.CO2 },
      { coef: 2, q: fH.H2O },
      { coef: -1, q: fH.CH4 },
    ]));
    expect(displayValue(r)).toBeCloseTo(-393.5 - 2 * 285.8 + 74.8, 10);
  });

  it('scaling by a stoichiometric coefficient', () => {
    expect(displayValue(v(op.scale(qty(-285.8, 'kJ/mol'), 2)))).toBeCloseTo(-571.6, 10);
    expect(op.scale(qty(298, 'K'), 2).ok).toBe(false);
  });

  it('powers and roots carry dimensions', () => {
    const area = v(op.pow(qty(2, 'cm'), 2));
    expect(area.value).toBeCloseTo(4e-4, 15);
    const root = v(op.pow(qty(4e-6, '1'), 0.5));
    expect(displayValue(root)).toBeCloseTo(2e-3, 15);
    expect(op.pow(qty(2, 'mol/dm3'), 0.5).ok).toBe(false); // fractional units
  });

  it('divides by zero safely', () => {
    expect(op.div(qty(1, 'J'), qty(0, 'K')).ok).toBe(false);
  });
});
