import { describe, expect, it } from 'vitest';
import { MECHANISMS, mechanismById } from '@/data/mechanisms';
import { evaluateR, type Rational } from '@/engine/algebra';
import { allSymbols, challengeOptions, derive, elementarySteps, type Choice } from '@/engine/mechanism';
import { rng } from '@/engine/template';

const v = {
  k1: 2.3, km1: 0.7, k2: 1.9, k3: 0.45, km3: 1.6, kd: 0.8, kp: 3.1, kt: 0.6, E0: 0.25,
  '[A]': 1.3, '[B]': 0.9, '[C]': 2.2, '[M]': 0.35, '[S]': 1.7, '[I]': 0.6, '[NO]': 0.8, '[O2]': 1.1,
  '[RX]': 0.5, '[X-]': 0.4, '[Nu-]': 0.9, '[O3]': 1.4, '[H2]': 0.75, '[I2]': 0.55, '[In]': 0.3,
};

function rateOf(id: string, choice: Choice): number {
  const res = derive(mechanismById.get(id)!, choice);
  if (!res.ok) throw new Error(`${id}: ${res.error}`);
  return evaluateR(res.rate, v);
}
const ss = (...s: string[]): Choice => ({ ss: s, pe: [] });
const pe = (...p: number[]): Choice => ({ ss: [], pe: p });

describe('steady-state derivations match the textbook results', () => {
  const { k1, km1, k2, k3, km3, kd, kp, kt, E0 } = v;
  it('A ⇌ I → P', () => {
    expect(rateOf('mech-consecutive', ss('I'))).toBeCloseTo((k1 * k2 * v['[A]']) / (km1 + k2), 10);
    expect(rateOf('mech-consecutive', pe(0))).toBeCloseTo(((k1 * k2) / km1) * v['[A]'], 10);
  });
  it('Lindemann–Hinshelwood', () => {
    const M = v['[M]'];
    expect(rateOf('mech-lindemann', ss('A*'))).toBeCloseTo((k1 * k2 * M * v['[A]']) / (km1 * M + k2), 10);
  });
  it('Michaelis–Menten, steady state and pre-equilibrium', () => {
    const S = v['[S]'];
    expect(rateOf('mech-michaelis-menten', ss('ES'))).toBeCloseTo((k2 * E0 * S) / ((km1 + k2) / k1 + S), 10);
    expect(rateOf('mech-michaelis-menten', pe(0))).toBeCloseTo((k2 * E0 * S) / (km1 / k1 + S), 10);
  });
  it('competitive inhibition', () => {
    const S = v['[S]'];
    const KM = (km1 + k2) / k1;
    const KI = km3 / k3;
    const expected = (k2 * E0 * S) / (KM * (1 + v['[I]'] / KI) + S);
    expect(rateOf('mech-competitive-inhibition', ss('ES', 'EI'))).toBeCloseTo(expected, 10);
    expect(rateOf('mech-competitive-inhibition', { ss: ['ES'], pe: [2] })).toBeCloseTo(expected, 10);
  });
  it('2NO + O₂ and ozone carry their factors of 2', () => {
    expect(rateOf('mech-no-oxidation', pe(0))).toBeCloseTo((2 * k1 * k2 * v['[NO]'] ** 2 * v['[O2]']) / km1, 10);
    expect(rateOf('mech-ozone', ss('O'))).toBeCloseTo((2 * k1 * k2 * v['[O3]'] ** 2) / (km1 * v['[O2]'] + k2 * v['[O3]']), 10);
  });
  it('S_N1 common-ion effect', () => {
    expect(rateOf('mech-sn1-common-ion', ss('R+'))).toBeCloseTo((k1 * k2 * v['[RX]'] * v['[Nu-]']) / (km1 * v['[X-]'] + k2 * v['[Nu-]']), 10);
  });
  it('H₂ + I₂: pre-equilibrium, and steady state solved for [I]²', () => {
    expect(rateOf('mech-hydrogen-iodine', pe(0))).toBeCloseTo((2 * k1 * k2 * v['[H2]'] * v['[I2]']) / km1, 10);
    expect(rateOf('mech-hydrogen-iodine', ss('I'))).toBeCloseTo((2 * k1 * k2 * v['[H2]'] * v['[I2]']) / (km1 + k2 * v['[H2]']), 10);
  });
  it('radical polymerisation: half order in initiator', () => {
    expect(rateOf('mech-radical-polymerisation', ss('R'))).toBeCloseTo(kp * v['[M]'] * Math.sqrt((kd * v['[In]']) / kt), 10);
  });
  it('two intermediates in sequence: k₃ cancels', () => {
    const res = derive(mechanismById.get('mech-two-intermediates')!, ss('I1', 'I2'));
    expect(res.ok && res.rateTex).toBe('\\dfrac{k_{1}k_{2}[\\mathrm{A}][\\mathrm{B}]}{k_{-1} + k_{2}}');
  });
});

describe('derivation output', () => {
  it('writes the Lindemann result and both limits in conventional form', () => {
    const res = derive(mechanismById.get('mech-lindemann')!, ss('A*'));
    if (!res.ok) throw new Error(res.error);
    expect(res.rateTex).toBe('\\dfrac{k_{1}k_{2}[\\mathrm{A}][\\mathrm{M}]}{k_{2} + k_{-1}[\\mathrm{M}]}');
    expect(res.limits.map((l) => l.tex)).toEqual(['k_{1}[\\mathrm{A}][\\mathrm{M}]', '\\dfrac{k_{1}k_{2}[\\mathrm{A}]}{k_{-1}}']);
    expect(res.steps.map((s) => s.title)).toContain('Steady state on $\\mathrm{A^*}$');
    expect(res.steps[1]!.tex).toContain('= k_{1}[\\mathrm{A}][\\mathrm{M}] - k_{-1}[\\mathrm{M}][\\mathrm{A^*}] - k_{2}[\\mathrm{A^*}] = 0');
  });

  it('writes fractional powers for the radical chain', () => {
    const res = derive(mechanismById.get('mech-radical-polymerisation')!, ss('R'));
    expect(res.ok && res.rateTex).toBe('\\dfrac{k_\\mathrm{d}^{1/2}k_\\mathrm{p}[\\mathrm{In}]^{1/2}[\\mathrm{M}]}{k_\\mathrm{t}^{1/2}}'.replace(/k_\\mathrm\{(\w)\}\^/g, '{k_\\mathrm{$1}}^'));
  });

  it('explains when an intermediate is left unapproximated', () => {
    const res = derive(mechanismById.get('mech-consecutive')!, ss());
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error).toMatch(/still contains \[I\]/);
  });
});

describe('mechanism data and practice questions', () => {
  it('declares every species and intermediate it uses', () => {
    for (const m of MECHANISMS) {
      for (const e of elementarySteps(m)) for (const sp of [...Object.keys(e.reactants), ...Object.keys(e.products)]) expect(m.species, `${m.id}: ${sp}`).toHaveProperty([sp]);
      for (const sp of [...m.intermediates, m.rate.species]) expect(m.species, `${m.id}: ${sp}`).toHaveProperty([sp]);
      expect(new Set(MECHANISMS.map((x) => x.id)).size).toBe(MECHANISMS.length);
    }
  });

  it('gives 3–4 numerically distinct options with exactly one correct for every challenge', () => {
    for (const m of MECHANISMS) {
      for (const c of m.challenges) {
        const opts = challengeOptions(m, c, rng(7));
        expect(opts, `${m.id} ${JSON.stringify(c)}`).not.toBeNull();
        expect(opts!.length, m.id).toBeGreaterThanOrEqual(3);
        expect(opts!.filter((o) => o.correct)).toHaveLength(1);
        const vals = opts!.map((o) => evaluateR(o.rate, Object.fromEntries(allSymbols(m).map((s, i) => [s, 0.7 + 0.37 * i]))));
        for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) expect(Math.abs(vals[i]! - vals[j]!), m.id).toBeGreaterThan(1e-9);
      }
    }
  });
});

describe('the steady state is a good approximation when it should be', () => {
  it('matches a numerical integration of Lindemann kinetics once A* has settled', () => {
    // Reactive A* (large k₋₁[M] + k₂) stays small, so the steady state should hold to within ~1%.
    const p = { k1: 1, km1: 50, k2: 200, M: 2 };
    let A = 1;
    let As = 0;
    const dt = 1e-5;
    for (let t = 0; t < 0.05; t += dt) {
      const dA = -p.k1 * A * p.M + p.km1 * As * p.M;
      const dAs = p.k1 * A * p.M - p.km1 * As * p.M - p.k2 * As;
      A += dA * dt;
      As += dAs * dt;
    }
    const exact = p.k2 * As;
    const res = derive(mechanismById.get('mech-lindemann')!, ss('A*'));
    if (!res.ok) throw new Error(res.error);
    const approx = evaluateR(res.rate as Rational, { k1: p.k1, km1: p.km1, k2: p.k2, '[M]': p.M, '[A]': A });
    expect(Math.abs(approx - exact) / exact).toBeLessThan(0.01);
  });
});
