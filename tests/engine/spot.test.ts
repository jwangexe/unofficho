/** Spot checks against independently calculated textbook values. */
import { describe, expect, it } from 'vitest';
import { formulaById } from '@/engine/formulas';
import { solveFormula } from '@/engine/formula';
import { displayValue, qty, type Quantity } from '@/engine/quantity';

function solve(id: string, unknown: string, given: Record<string, Quantity>) {
  const res = solveFormula(formulaById.get(id)!, unknown, given);
  if (!res.ok) throw new Error(res.error.message);
  return res.value;
}
const val = (id: string, unknown: string, given: Record<string, Quantity>) => displayValue(solve(id, unknown, given).quantity);

describe('textbook values', () => {
  it('ΔG = ΔH − TΔS handles kJ and J together', () => {
    const v = val('gibbs', 'dG', { dH: qty(-92.4, 'kJ/mol'), T: qty(298, 'K'), dS: qty(-198.3, 'J/(K mol)') });
    expect(v).toBeCloseTo(-92.4 + 298 * 0.1983, 6);
  });

  it('ΔG with a temperature in °C', () => {
    const v = val('gibbs', 'dG', { dH: qty(-92.4, 'kJ/mol'), T: qty(25, 'degC'), dS: qty(-198.3, 'J/(K mol)') });
    expect(v).toBeCloseTo(-92.4 + 298.15 * 0.1983, 6);
  });

  it('ΔG° = 0 gives K = 1', () => {
    expect(val('gibbs-k', 'K', { dG0: qty(0, 'kJ/mol'), T: qty(298, 'K') })).toBeCloseTo(1, 12);
  });

  it('molar volume of an ideal gas at 273.15 K and 1 bar is 22.71 dm³', () => {
    expect(val('ideal-gas', 'V', { p: qty(1, 'bar'), n: qty(1, 'mol'), T: qty(273.15, 'K') })).toBeCloseTo(22.711, 3);
  });

  it('Kp = Kc(0.08314 T)^Δn with c° = 1 mol dm⁻³ and p° = 1 bar', () => {
    expect(val('kp-kc', 'Kp', { Kc: qty(1, '1'), T: qty(500, 'K'), dn: qty(1, '1') })).toBeCloseTo(0.0831446 * 500, 3);
  });

  it('Nernst slope is 0.0592 V per decade at 25 °C', () => {
    const E = val('nernst', 'E', { E0: qty(0, 'V'), T: qty(298.15, 'K'), n: qty(1, '1'), Q: qty(10, '1') });
    expect(E).toBeCloseTo(-0.05916, 5);
  });

  it('pH of 0.10 mol dm⁻³ ethanoic acid ≈ 2.87', () => {
    const H = solve('weak-acid-approx', 'H', { Ka: qty(1.8e-5, '1'), c: qty(0.1, 'mol/dm3') });
    expect(-Math.log10(displayValue(H.quantity))).toBeCloseTo(2.872, 3);
    expect(H.warnings).toEqual([]);
  });

  it('the approximation is flagged when dissociation exceeds 5%', () => {
    const H = solve('weak-acid-approx', 'H', { Ka: qty(1.0e-2, '1'), c: qty(0.01, 'mol/dm3') });
    expect(H.warnings.join(' ')).toMatch(/approximation/);
  });

  it('exact weak-acid root matches the quadratic formula', () => {
    const Ka = 1.0e-2;
    const c = 0.01;
    const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
    expect(val('weak-acid-exact', 'H', { Ka: qty(Ka, '1'), c: qty(c, 'mol/dm3') })).toBeCloseTo(x, 10);
  });

  it('Henderson–Hasselbalch at equal concentrations gives pH = pKa', () => {
    expect(val('henderson-hasselbalch', 'pH', { pKa: qty(4.76, '1'), Am: qty(0.1, 'mol/dm3'), HA: qty(0.1, 'mol/dm3') })).toBeCloseTo(4.76, 10);
  });

  it('CaF₂ solubility from Ksp: s = (Ksp/4)^(1/3)', () => {
    const s = val('ksp-solubility', 's', { Ksp: qty(3.9e-11, '1'), x: qty(1, '1'), y: qty(2, '1') });
    expect(s).toBeCloseTo((3.9e-11 / 4) ** (1 / 3), 10);
  });

  it('ICE: H₂ + I₂ ⇌ 2HI with K = 50 from 0.10 mol dm⁻³ each', () => {
    const xi = val('ice', 'xi', {
      K: qty(50, '1'), a: qty(1, '1'), b: qty(1, '1'), c: qty(2, '1'), d: qty(0, '1'),
      A0: qty(0.1, 'mol/dm3'), B0: qty(0.1, 'mol/dm3'), C0: qty(0, 'mol/dm3'), D0: qty(0, 'mol/dm3'),
    });
    expect(xi).toBeCloseTo((0.1 * Math.sqrt(50)) / (2 + Math.sqrt(50)), 8);
  });

  it('ICE runs backwards (negative ξ) when products start in excess', () => {
    const xi = val('ice', 'xi', {
      K: qty(50, '1'), a: qty(1, '1'), b: qty(1, '1'), c: qty(2, '1'), d: qty(0, '1'),
      A0: qty(0, 'mol/dm3'), B0: qty(0, 'mol/dm3'), C0: qty(0.2, 'mol/dm3'), D0: qty(0, 'mol/dm3'),
    });
    expect(xi).toBeLessThan(0);
    expect(xi).toBeCloseTo(-(0.2 - (0.2 * Math.sqrt(50)) / (2 + Math.sqrt(50))) / 2, 8);
  });

  it('a 10 K rise doubling the rate near room temperature means Eₐ ≈ 52.9 kJ mol⁻¹', () => {
    const Ea = val('arrhenius-two-point', 'Ea', { k1: qty(1, '1/s'), k2: qty(2, '1/s'), T1: qty(298, 'K'), T2: qty(308, 'K') });
    expect(Ea).toBeCloseTo((8.314462618 * Math.LN2) / (1 / 298 - 1 / 308) / 1000, 6);
    expect(Ea).toBeCloseTo(52.9, 1);
  });

  it('kBT/h ≈ 6.21 × 10¹² s⁻¹ at 298.15 K (Eyring with ΔG‡ = 0)', () => {
    expect(val('eyring', 'k', { T: qty(298.15, 'K'), dGa: qty(1e-9, 'kJ/mol') })).toBeCloseTo(6.2124e12, -9);
  });

  it('photon energy at 500 nm is 3.97 × 10⁻¹⁹ J; 400 nm photons carry 299 kJ mol⁻¹', () => {
    expect(val('photon-wavelength', 'E', { lambda: qty(500, 'nm') })).toBeCloseTo(3.9729e-19, 22);
    expect(val('photon-molar', 'Em', { lambda: qty(400, 'nm') })).toBeCloseTo(299.06, 1);
  });

  it('two half-lives of ¹⁴C leave a quarter', () => {
    expect(val('radioactive-decay', 'N', { N0: qty(10, 'g'), t: qty(11460, 'yr'), thalf: qty(5730, 'yr') })).toBeCloseTo(2.5, 10);
  });

  it('first-order half-life ↔ k, across time units', () => {
    expect(val('half-life-first', 'thalf', { k: qty(1, '1/min') })).toBeCloseTo(60 * Math.LN2, 10);
  });

  it('first-order law accepts pressures as long as both match', () => {
    const t = solve('first-order', 'A', { A0: qty(100, 'kPa'), k: qty(1e-3, '1/s'), t: qty(693.147, 's') });
    expect(t.quantity.unit).toBe('kPa');
    expect(displayValue(t.quantity)).toBeCloseTo(50, 3);
  });

  it('Clausius–Clapeyron: water at 90 °C has p ≈ 70 kPa', () => {
    const p = val('clausius-clapeyron', 'p2', { p1: qty(101.325, 'kPa'), T1: qty(373.15, 'K'), T2: qty(90, 'degC'), dvapH: qty(40.7, 'kJ/mol') });
    expect(p).toBeCloseTo(101.325 * Math.exp((-40700 / 8.314462618) * (1 / 363.15 - 1 / 373.15)), 6);
    expect(p).toBeGreaterThan(68);
    expect(p).toBeLessThan(72);
  });

  it('ΔG° = −nFE°: Daniell cell', () => {
    expect(val('gibbs-emf', 'dG0', { n: qty(2, '1'), E0: qty(1.1, 'V') })).toBeCloseTo((-2 * 96485.33212 * 1.1) / 1000, 6);
  });

  it('solving for the electron count returns a whole number', () => {
    expect(val('gibbs-emf', 'n', { dG0: qty(-212.27, 'kJ/mol'), E0: qty(1.1, 'V') })).toBe(2);
  });

});

describe('solver failures are reported clearly', () => {
  it('no real solution', () => {
    // First-order decay cannot make [A] grow: no positive k.
    const res = solveFormula(formulaById.get('first-order')!, 'k', {
      A: qty(0.2, 'mol/dm3'), A0: qty(0.1, 'mol/dm3'), t: qty(10, 's'),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('no-solution');
  });

  it('van ’t Hoff gives no T₂ when 1/T₂ would be negative', () => {
    const res = solveFormula(formulaById.get('vant-hoff')!, 'T2', {
      K1: qty(1, '1'), K2: qty(1e30, '1'), T1: qty(298, 'K'), dH0: qty(10, 'kJ/mol'),
    });
    expect(res.ok).toBe(false);
  });

  it('missing input', () => {
    const res = solveFormula(formulaById.get('gibbs')!, 'dG', { dH: qty(-92.4, 'kJ/mol') });
    expect(!res.ok && res.error.code).toBe('missing');
  });

  it('fixed parameters cannot be solved for', () => {
    const res = solveFormula(formulaById.get('ksp-solubility')!, 'x', {});
    expect(!res.ok && res.error.code).toBe('not-solvable');
  });
});
