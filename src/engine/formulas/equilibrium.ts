import { defineFormula, type Formula, type VarSpec } from '../formula';
import { C_STD, P_STD, R } from '../constants';
import { conc, dimensionless, temp } from './vars';

const ln = Math.log;
const log10 = Math.log10;

const pVar = (sym: string, label: string, latex: string, name: string): VarSpec =>
  dimensionless(sym, label, latex, name, { sign: 'signed' });

/** Weak acid / weak base pH, approximate and exact, built from one template. */
function weak(kind: 'acid' | 'base'): Formula[] {
  const acid = kind === 'acid';
  const ion = acid ? 'H' : 'OH';
  const ionLabel = acid ? '[H⁺]' : '[OH⁻]';
  const ionTex = acid ? '[\\mathrm{H^+}]' : '[\\mathrm{OH^-}]';
  const Kx = acid ? 'Ka' : 'Kb';
  const KxLabel = acid ? 'Kₐ' : 'K_b';
  const KxTex = acid ? 'K_\\mathrm{a}' : 'K_\\mathrm{b}';
  const vars = [
    conc(ion, ionLabel, ionTex, `${ionLabel} at equilibrium`),
    dimensionless(Kx, KxLabel, KxTex, `${acid ? 'Acid' : 'Base'} dissociation constant`),
    conc('c', 'c', 'c', `Analytical concentration of the ${kind}`),
  ];
  const approxWarnings = (v: Record<string, number>) => {
    const out: string[] = [];
    const frac = v[ion]! / v.c!;
    if (frac > 0.05) {
      out.push(`${ionLabel}/c = ${(100 * frac).toFixed(1)}% > 5%: the approximation c − x ≈ c fails; use the exact expression`);
    }
    if (v[ion]! < 1e-6 * C_STD) {
      out.push(`${ionLabel} is below 10⁻⁶ mol dm⁻³: autoionisation of water is no longer negligible`);
    }
    return out;
  };
  return [
    defineFormula({
      id: `weak-${kind}-approx`,
      name: `Weak ${kind} (approximate)`,
      topic: 'equilibrium',
      latex: `${ionTex} = \\sqrt{${KxTex}\\,c}`,
      vars,
      relation: (v) => [v[ion]! / C_STD, Math.sqrt((v[Kx]! * v.c!) / C_STD)],
      rearranged: {
        [ion]: `${ionTex} = \\sqrt{${KxTex}\\,c}`,
        [Kx]: `${KxTex} = \\dfrac{${ionTex}^2}{c}`,
        c: `c = \\dfrac{${ionTex}^2}{${KxTex}}`,
      },
      notes: 'Assumes dissociation is small (x ≪ c) and water autoionisation is negligible. Concentrations relative to c° = 1 mol dm⁻³.',
      warnings: approxWarnings,
      examples: [{ [Kx]: 1.8e-5, c: 0.1 }],
      reviewed: false,
    }),
    defineFormula({
      id: `weak-${kind}-exact`,
      name: `Weak ${kind} (without the approximation)`,
      topic: 'equilibrium',
      latex: `${KxTex} = \\dfrac{x^2}{c - x},\\quad x = ${ionTex}`,
      vars,
      relation: (v) => [v[Kx]!, (v[ion]! / C_STD) ** 2 / ((v.c! - v[ion]!) / C_STD)],
      bracket: (unknown, v) => (unknown === ion ? [0, v.c!] : undefined),
      constraint: (v) => (v[ion]! < v.c! ? null : `${ionLabel} must be less than c`),
      rearranged: {
        [ion]: `${ionTex} = \\dfrac{-${KxTex} + \\sqrt{${KxTex}^2 + 4${KxTex}c}}{2}`,
        [Kx]: `${KxTex} = \\dfrac{${ionTex}^2}{c - ${ionTex}}`,
        c: `c = ${ionTex} + \\dfrac{${ionTex}^2}{${KxTex}}`,
      },
      notes: 'Positive root of the quadratic. Still neglects water autoionisation.',
      warnings: (v) =>
        v[ion]! < 1e-6 * C_STD
          ? [`${ionLabel} is below 10⁻⁶ mol dm⁻³: autoionisation of water is no longer negligible`]
          : [],
      examples: [{ [Kx]: 1.8e-5, c: 0.01 }],
      reviewed: false,
    }),
  ];
}

export const equilibrium = [
  defineFormula({
    id: 'kp-kc',
    name: 'Kp from Kc',
    topic: 'equilibrium',
    latex: 'K_p = K_c\\left(\\dfrac{c^\\circ RT}{p^\\circ}\\right)^{\\Delta n}',
    vars: [
      dimensionless('Kp', 'K_p', 'K_p', 'Equilibrium constant (pressures)'),
      dimensionless('Kc', 'K_c', 'K_c', 'Equilibrium constant (concentrations)'),
      temp(),
      dimensionless('dn', 'Δn_gas', '\\Delta n_\\mathrm{gas}', 'Moles of gaseous products − reactants', { sign: 'signed' }),
    ],
    relation: (v) => [ln(v.Kp!), ln(v.Kc!) + v.dn! * ln((C_STD * R * v.T!) / P_STD)],
    rearranged: {
      Kp: 'K_p = K_c\\left(\\dfrac{c^\\circ RT}{p^\\circ}\\right)^{\\Delta n}',
      Kc: 'K_c = K_p\\left(\\dfrac{c^\\circ RT}{p^\\circ}\\right)^{-\\Delta n}',
      T: 'T = \\dfrac{p^\\circ}{c^\\circ R}\\left(\\dfrac{K_p}{K_c}\\right)^{1/\\Delta n}',
      dn: '\\Delta n = \\dfrac{\\ln(K_p/K_c)}{\\ln(c^\\circ RT/p^\\circ)}',
    },
    notes: 'Standard states c° = 1 mol dm⁻³ and p° = 1 bar, so c°R/p° = 0.08314 K⁻¹. With p° = 1 atm the factor becomes 0.08206 K⁻¹.',
    examples: [{ Kc: 0.5, T: 500, dn: -2 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ph',
    name: 'pH',
    topic: 'equilibrium',
    latex: '\\mathrm{pH} = -\\log_{10}\\dfrac{[\\mathrm{H^+}]}{c^\\circ}',
    vars: [pVar('pH', 'pH', '\\mathrm{pH}', 'pH'), conc('H', '[H⁺]', '[\\mathrm{H^+}]', 'Hydrogen ion concentration')],
    relation: (v) => [v.pH!, -log10(v.H! / C_STD)],
    rearranged: {
      pH: '\\mathrm{pH} = -\\log_{10}[\\mathrm{H^+}]',
      H: '[\\mathrm{H^+}] = 10^{-\\mathrm{pH}}',
    },
    examples: [{ H: 3.2e-4 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'poh',
    name: 'pOH',
    topic: 'equilibrium',
    latex: '\\mathrm{pOH} = -\\log_{10}\\dfrac{[\\mathrm{OH^-}]}{c^\\circ}',
    vars: [pVar('pOH', 'pOH', '\\mathrm{pOH}', 'pOH'), conc('OH', '[OH⁻]', '[\\mathrm{OH^-}]', 'Hydroxide concentration')],
    relation: (v) => [v.pOH!, -log10(v.OH! / C_STD)],
    rearranged: {
      pOH: '\\mathrm{pOH} = -\\log_{10}[\\mathrm{OH^-}]',
      OH: '[\\mathrm{OH^-}] = 10^{-\\mathrm{pOH}}',
    },
    examples: [{ OH: 2.0e-3 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'pkw',
    name: 'pH + pOH = pKw',
    topic: 'equilibrium',
    latex: '\\mathrm{pH} + \\mathrm{pOH} = \\mathrm{p}K_\\mathrm{w}',
    vars: [
      pVar('pH', 'pH', '\\mathrm{pH}', 'pH'),
      pVar('pOH', 'pOH', '\\mathrm{pOH}', 'pOH'),
      pVar('pKw', 'pK_w', '\\mathrm{p}K_\\mathrm{w}', 'pKw (14.00 at 25 °C)'),
    ],
    relation: (v) => [v.pH! + v.pOH!, v.pKw!],
    rearranged: {
      pH: '\\mathrm{pH} = \\mathrm{p}K_\\mathrm{w} - \\mathrm{pOH}',
      pOH: '\\mathrm{pOH} = \\mathrm{p}K_\\mathrm{w} - \\mathrm{pH}',
      pKw: '\\mathrm{p}K_\\mathrm{w} = \\mathrm{pH} + \\mathrm{pOH}',
    },
    examples: [{ pH: 3.49, pKw: 14.0 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'p-function',
    name: 'p-function (pKa, pKb, pKsp…)',
    topic: 'equilibrium',
    latex: '\\mathrm{p}X = -\\log_{10}X',
    vars: [pVar('pX', 'pX', '\\mathrm{p}X', 'p-value'), dimensionless('X', 'X', 'X', 'Constant (Ka, Kb, Ksp…)')],
    relation: (v) => [v.pX!, -log10(v.X!)],
    rearranged: { pX: '\\mathrm{p}X = -\\log_{10}X', X: 'X = 10^{-\\mathrm{p}X}' },
    examples: [{ X: 1.8e-5 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ka-kb',
    name: 'Conjugate pair: Ka·Kb = Kw',
    topic: 'equilibrium',
    latex: 'K_\\mathrm{a}K_\\mathrm{b} = K_\\mathrm{w}',
    vars: [
      dimensionless('Ka', 'Kₐ', 'K_\\mathrm{a}', 'Acid dissociation constant'),
      dimensionless('Kb', 'K_b', 'K_\\mathrm{b}', 'Base dissociation constant of the conjugate base'),
      dimensionless('Kw', 'K_w', 'K_\\mathrm{w}', 'Ionic product of water'),
    ],
    relation: (v) => [ln(v.Ka! * v.Kb!), ln(v.Kw!)],
    rearranged: {
      Ka: 'K_\\mathrm{a} = \\dfrac{K_\\mathrm{w}}{K_\\mathrm{b}}',
      Kb: 'K_\\mathrm{b} = \\dfrac{K_\\mathrm{w}}{K_\\mathrm{a}}',
      Kw: 'K_\\mathrm{w} = K_\\mathrm{a}K_\\mathrm{b}',
    },
    examples: [{ Ka: 1.8e-5, Kw: 1.0e-14 }],
    reviewed: false,
  }),

  ...weak('acid'),
  ...weak('base'),

  defineFormula({
    id: 'henderson-hasselbalch',
    name: 'Henderson–Hasselbalch equation',
    topic: 'equilibrium',
    latex: '\\mathrm{pH} = \\mathrm{p}K_\\mathrm{a} + \\log_{10}\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}',
    vars: [
      pVar('pH', 'pH', '\\mathrm{pH}', 'pH'),
      pVar('pKa', 'pKₐ', '\\mathrm{p}K_\\mathrm{a}', 'pKa of the acid'),
      { ...conc('Am', '[A⁻]', '[\\mathrm{A^-}]', 'Conjugate base (concentration or amount)'), dim: { any: 'ratio' } },
      { ...conc('HA', '[HA]', '[\\mathrm{HA}]', 'Acid (same units)'), dim: { any: 'ratio' } },
    ],
    relation: (v) => [v.pH!, v.pKa! + log10(v.Am! / v.HA!)],
    rearranged: {
      pH: '\\mathrm{pH} = \\mathrm{p}K_\\mathrm{a} + \\log_{10}\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}',
      pKa: '\\mathrm{p}K_\\mathrm{a} = \\mathrm{pH} - \\log_{10}\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}',
      Am: '[\\mathrm{A^-}] = [\\mathrm{HA}]\\cdot 10^{\\mathrm{pH} - \\mathrm{p}K_\\mathrm{a}}',
      HA: '[\\mathrm{HA}] = [\\mathrm{A^-}]\\cdot 10^{\\mathrm{p}K_\\mathrm{a} - \\mathrm{pH}}',
    },
    notes: 'Moles work as well as concentrations, since both species share the same volume.',
    examples: [{ pKa: 4.76, Am: 0.15, HA: 0.1 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ksp-solubility',
    name: 'Ksp and solubility (MₓAᵧ)',
    topic: 'equilibrium',
    latex: 'K_\\mathrm{sp} = (xs)^x(ys)^y',
    vars: [
      dimensionless('Ksp', 'K_sp', 'K_\\mathrm{sp}', 'Solubility product'),
      conc('s', 's', 's', 'Molar solubility'),
      dimensionless('x', 'x', 'x', 'Cations per formula unit', { integer: true, solvable: false }),
      dimensionless('y', 'y', 'y', 'Anions per formula unit', { integer: true, solvable: false }),
    ],
    relation: (v) => {
      const s = v.s! / C_STD;
      return [ln(v.Ksp!), v.x! * ln(v.x! * s) + v.y! * ln(v.y! * s)];
    },
    rearranged: {
      Ksp: 'K_\\mathrm{sp} = x^x y^y s^{x+y}',
      s: 's = \\left(\\dfrac{K_\\mathrm{sp}}{x^x y^y}\\right)^{1/(x+y)}',
    },
    notes: 'Pure water, no common ion, no hydrolysis or complexation, activities ≈ concentrations.',
    examples: [{ s: 1.3e-5, x: 1, y: 1 }, { Ksp: 3.9e-11, x: 1, y: 2 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ice',
    name: 'ICE table: aA + bB ⇌ cC + dD',
    topic: 'equilibrium',
    latex: 'K = \\dfrac{([\\mathrm{C}]_0 + c\\xi)^c([\\mathrm{D}]_0 + d\\xi)^d}{([\\mathrm{A}]_0 - a\\xi)^a([\\mathrm{B}]_0 - b\\xi)^b}',
    vars: [
      dimensionless('K', 'K', 'K', 'Equilibrium constant (concentrations relative to c°)'),
      conc('xi', 'ξ', '\\xi', 'Extent of reaction per volume (negative if it runs backwards)', { sign: 'signed', typical: 0 }),
      dimensionless('a', 'a', 'a', 'Coefficient of A (0 if absent)', { sign: 'nonneg', solvable: false }),
      dimensionless('b', 'b', 'b', 'Coefficient of B (0 if absent)', { sign: 'nonneg', solvable: false }),
      dimensionless('c', 'c', 'c', 'Coefficient of C (0 if absent)', { sign: 'nonneg', solvable: false }),
      dimensionless('d', 'd', 'd', 'Coefficient of D (0 if absent)', { sign: 'nonneg', solvable: false }),
      conc('A0', '[A]₀', '[\\mathrm{A}]_0', 'Initial [A]', { sign: 'nonneg', solvable: false }),
      conc('B0', '[B]₀', '[\\mathrm{B}]_0', 'Initial [B]', { sign: 'nonneg', solvable: false }),
      conc('C0', '[C]₀', '[\\mathrm{C}]_0', 'Initial [C]', { sign: 'nonneg', solvable: false }),
      conc('D0', '[D]₀', '[\\mathrm{D}]_0', 'Initial [D]', { sign: 'nonneg', solvable: false }),
    ],
    relation: (v) => {
      // Signed coefficient ν (negative for reactants): contributes ν·ln([X]₀ + νξ).
      const term = (c0: number, nu: number) => {
        if (nu === 0) return 0;
        const x = (c0 + nu * v.xi!) / C_STD;
        return x > 0 ? nu * ln(x) : NaN;
      };
      const lnQ = term(v.C0!, v.c!) + term(v.D0!, v.d!) + term(v.A0!, -v.a!) + term(v.B0!, -v.b!);
      return [ln(v.K!), lnQ];
    },
    bracket: (unknown, v) => {
      if (unknown !== 'xi') return undefined;
      // Every species present must keep a positive concentration.
      let lo = -Infinity;
      let hi = Infinity;
      if (v.a! > 0) hi = Math.min(hi, v.A0! / v.a!);
      if (v.b! > 0) hi = Math.min(hi, v.B0! / v.b!);
      if (v.c! > 0) lo = Math.max(lo, -v.C0! / v.c!);
      if (v.d! > 0) lo = Math.max(lo, -v.D0! / v.d!);
      return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : undefined;
    },
    rearranged: {
      K: 'K = \\dfrac{[\\mathrm{C}]^c[\\mathrm{D}]^d}{[\\mathrm{A}]^a[\\mathrm{B}]^b}\\ \\text{at equilibrium}',
      xi: '\\text{Solve } K = \\dfrac{([\\mathrm{C}]_0 + c\\xi)^c([\\mathrm{D}]_0 + d\\xi)^d}{([\\mathrm{A}]_0 - a\\xi)^a([\\mathrm{B}]_0 - b\\xi)^b}\\text{ for }\\xi',
    },
    notes: 'Solution-phase concentrations relative to c° = 1 mol dm⁻³. The physical root keeps every concentration positive.',
    examples: [
      { K: 50, a: 1, b: 1, c: 2, d: 0, A0: 0.1, B0: 0.1, C0: 0, D0: 0 },
      { K: 1.8e-5, a: 1, b: 0, c: 1, d: 1, A0: 0.1, B0: 0, C0: 0, D0: 0 },
    ],
    reviewed: false,
  }),
];
