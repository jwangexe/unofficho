import { defineFormula, type Formula, type VarSpec } from '../formula';
import { C_STD, P_STD, R } from '../constants';
import { conc, dimensionless, temp } from './vars';
import { D, powDim } from '../dims';
import type { Quantity } from '../quantity';

const ln = Math.log;
const log10 = Math.log10;

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** K = Π([X_i]₀ + ν_iξ)^ν_i written out: products over reactants, with the actual coefficients. */
function iceLatex(nus: readonly number[]): string {
  const xi = (n: number) => `${n === 1 ? '' : n}\\xi`;
  const term = (i: number, nu: number) => {
    const body = `[\\mathrm{X}_{${i + 1}}]_0 ${nu > 0 ? '+' : '-'} ${xi(Math.abs(nu))}`;
    return Math.abs(nu) === 1 ? `(${body})` : `(${body})^{${Math.abs(nu)}}`;
  };
  const top = nus.map((nu, i) => (nu > 0 ? term(i, nu) : '')).join('');
  const bottom = nus.map((nu, i) => (nu < 0 ? term(i, nu) : '')).join('');
  if (!bottom) return `K = ${top || '1'}`;
  return `K = \\dfrac{${top || '1'}}{${bottom}}`;
}

const pVar = (sym: string, label: string, latex: string, name: string): VarSpec =>
  dimensionless(sym, label, latex, name, { sign: 'signed' });

/** K = Π[X_i]^ν_i written out with the actual coefficients: products over reactants. */
function kLatex(K: string, X: (i: number) => string) {
  return (nus: readonly number[]): string => {
    const term = (i: number, nu: number) => (Math.abs(nu) === 1 ? X(i + 1) : `${X(i + 1)}^{${Math.abs(nu)}}`);
    const top = nus.map((nu, i) => (nu > 0 ? term(i, nu) : '')).join('\\,');
    const bottom = nus.map((nu, i) => (nu < 0 ? term(i, nu) : '')).join('\\,');
    return bottom ? `${K} = \\dfrac{${top || '1'}}{${bottom}}` : `${K} = ${top || '1'}`;
  };
}

const sumNu = (v: Record<string, Quantity | number>) => {
  let n = 0;
  for (let i = 1; `nu${i}` in v; i++) {
    const x = v[`nu${i}`]!;
    n += typeof x === 'number' ? x : x.value;
  }
  return n;
};

/** Display units for (mol dm⁻³)^n and pressure^n, by power. */
const CONC_UNITS: Record<number, string> = { [-3]: 'dm9/mol3', [-2]: 'dm6/mol2', [-1]: 'dm3/mol', 0: '1', 1: 'mol/dm3', 2: 'mol2/dm6', 3: 'mol3/dm9' };
const PRESSURE_UNITS: Record<string, Record<number, string>> = {
  kPa: { [-2]: '1/kPa2', [-1]: '1/kPa', 0: '1', 1: 'kPa', 2: 'kPa2' },
  Pa: { [-2]: '1/Pa2', [-1]: '1/Pa', 0: '1', 1: 'Pa', 2: 'Pa2' },
};

/**
 * Kc or Kp with units, as A-level uses them: K = Π x_i^ν_i over equilibrium concentrations
 * (or partial pressures), so K carries (mol dm⁻³)^Δn (or kPa^Δn). Any number of species.
 */
function kWithUnits(kind: 'c' | 'p'): Formula {
  const c = kind === 'c';
  const X = (i: number) => (c ? `[\\mathrm{X}_{${i}}]` : `p_{\\mathrm{X}_{${i}}}`);
  return defineFormula({
    id: c ? 'kc' : 'kp',
    name: c ? 'Kc from equilibrium concentrations' : 'Kp from equilibrium partial pressures',
    topic: 'equilibrium',
    latex: c ? 'K_\\mathrm{c} = \\dfrac{[\\mathrm{C}]^c[\\mathrm{D}]^d}{[\\mathrm{A}]^a[\\mathrm{B}]^b}' : 'K_\\mathrm{p} = \\dfrac{p_\\mathrm{C}^{\\,c}\\,p_\\mathrm{D}^{\\,d}}{p_\\mathrm{A}^{\\,a}\\,p_\\mathrm{B}^{\\,b}}',
    vars: [
      {
        sym: 'K',
        label: c ? 'Kc' : 'Kp',
        latex: c ? 'K_\\mathrm{c}' : 'K_\\mathrm{p}',
        name: c ? 'Equilibrium constant in concentrations (units depend on Δn)' : 'Equilibrium constant in partial pressures (units depend on Δn)',
        dim: { any: c ? 'Kc' : 'Kp' },
        unit: '1',
      },
    ],
    species: {
      min: 1,
      max: 6,
      vars: (i) => [
        dimensionless(`nu${i}`, `ν${SUB[i]}`, `\\nu_{${i}}`, `Coefficient of X${SUB[i]} (− reactant, + product)`, {
          sign: 'signed',
          solvable: false,
          integer: true,
        }),
        c
          ? conc(`X${i}`, `[X${SUB[i]}]`, X(i), `Equilibrium concentration of X${SUB[i]}`)
          : { sym: `X${i}`, label: `p(X${SUB[i]})`, latex: X(i), name: `Equilibrium partial pressure of X${SUB[i]}`, dim: D.pressure, unit: 'kPa' },
      ],
      coefficient: (i) => `nu${i}`,
      latexFor: kLatex(c ? 'K_\\mathrm{c}' : 'K_\\mathrm{p}', X),
    },
    // In SI units throughout, so K comes out in (mol m⁻³)^Δn or Pa^Δn and converts for display.
    relation: (v) => {
      let lnQ = 0;
      for (let i = 1; `nu${i}` in v; i++) lnQ += v[`nu${i}`]! * ln(v[`X${i}`]!);
      return [ln(v.K!), lnQ];
    },
    anyDim: (sym, others) => {
      if (sym !== 'K') return undefined;
      const n = Math.round(sumNu(others));
      if (c) return { dim: powDim(D.concentration, n), unit: CONC_UNITS[n] ?? 'mol/dm3' };
      const base = Object.entries(others).find(([k]) => /^X\d+$/.test(k))?.[1]?.unit === 'Pa' ? 'Pa' : 'kPa';
      return { dim: powDim(D.pressure, n), unit: PRESSURE_UNITS[base]![n] ?? base };
    },
    constraint: (v) => {
      for (let i = 1; `nu${i}` in v; i++) if (v[`nu${i}`] === 0) return `ν${SUB[i]} is 0: remove that species instead`;
      return null;
    },
    rearranged: {
      K: c ? 'K_\\mathrm{c} = \\prod_i [\\mathrm{X}_i]^{\\nu_i}' : 'K_\\mathrm{p} = \\prod_i p_{\\mathrm{X}_i}^{\\,\\nu_i}',
      ...Object.fromEntries(
        Array.from({ length: 6 }, (_, k) => [`X${k + 1}`, `\\text{Solve } ${c ? 'K_\\mathrm{c}' : 'K_\\mathrm{p}'} = \\prod_i ${c ? '[\\mathrm{X}_i]' : 'p_{\\mathrm{X}_i}'}^{\\nu_i} \\text{ for } ${X(k + 1)}`]),
      ),
    },
    notes: c
      ? 'ν is negative for reactants and positive for products; leave out solids. Kc has units of (mol dm⁻³)^Δn, where Δn = Σν.'
      : 'ν is negative for reactants and positive for products; only gases appear. Kp has units of (pressure)^Δn, where Δn = Σν.',
    examples: c
      ? [
          // N₂ + 3H₂ ⇌ 2NH₃: Kc in mol⁻² dm⁶.
          { nu1: -1, X1: 0.5, nu2: -3, X2: 1.2, nu3: 2, X3: 0.3 },
          // H₂ + I₂ ⇌ 2HI: Δn = 0, so Kc has no units; find [HI].
          { K: 49, nu1: -1, X1: 0.02, nu2: -1, X2: 0.02, nu3: 2 },
        ]
      : [
          // N₂O₄ ⇌ 2NO₂ in kPa: Kp in kPa.
          { nu1: -1, X1: 60, nu2: 2, X2: 40 },
          // 2SO₂ + O₂ ⇌ 2SO₃: Kp in kPa⁻¹.
          { nu1: -2, X1: 20, nu2: -1, X2: 10, nu3: 2, X3: 70 },
        ],
    reviewed: false,
  });
}

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
  kWithUnits('c'),
  kWithUnits('p'),
  defineFormula({
    id: 'partial-pressure',
    name: 'Partial pressure from mole fraction',
    topic: 'equilibrium',
    latex: 'p_\\mathrm{A} = x_\\mathrm{A}\\,p_\\text{total}',
    vars: [
      { sym: 'p', label: 'p(A)', latex: 'p_\\mathrm{A}', name: 'Partial pressure of A', dim: D.pressure, unit: 'kPa' },
      dimensionless('x', 'x(A)', 'x_\\mathrm{A}', 'Mole fraction of A (n_A ÷ n_total)'),
      { sym: 'ptot', label: 'p(total)', latex: 'p_\\text{total}', name: 'Total pressure', dim: D.pressure, unit: 'kPa' },
    ],
    relation: (v) => [v.p!, v.x! * v.ptot!],
    rearranged: {
      p: 'p_\\mathrm{A} = x_\\mathrm{A}\\,p_\\text{total}',
      x: 'x_\\mathrm{A} = \\dfrac{p_\\mathrm{A}}{p_\\text{total}}',
      ptot: 'p_\\text{total} = \\dfrac{p_\\mathrm{A}}{x_\\mathrm{A}}',
    },
    notes: 'Mole fraction x_A = n_A ÷ n_total; the partial pressures add up to the total pressure.',
    examples: [{ x: 0.25, ptot: 200 }],
    reviewed: false,
  }),
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
    name: 'Equilibrium from initial concentrations (ICE)',
    topic: 'equilibrium',
    latex: 'K = \\prod_i \\left(\\frac{[\\mathrm{X}_i]_0 + \\nu_i\\,\\xi}{c^\\circ}\\right)^{\\nu_i}',
    vars: [
      dimensionless('K', 'K', 'K', 'Equilibrium constant (concentrations relative to c°)'),
      conc('xi', 'ξ', '\\xi', 'Extent of reaction per volume (negative if it runs backwards)', { sign: 'signed', typical: 0 }),
    ],
    // Any number of species: ν_i < 0 for reactants, > 0 for products. Leave out solids,
    // pure liquids and the solvent, which do not appear in K.
    species: {
      min: 1,
      max: 6,
      vars: (i) => [
        dimensionless(`nu${i}`, `ν${SUB[i]}`, `\\nu_{${i}}`, `Stoichiometric coefficient of X${SUB[i]} (− reactant, + product)`, {
          sign: 'signed',
          solvable: false,
          integer: true,
        }),
        conc(`X0${i}`, `[X${SUB[i]}]₀`, `[\\mathrm{X}_{${i}}]_0`, `Initial concentration of X${SUB[i]}`, { sign: 'nonneg', solvable: false }),
      ],
      coefficient: (i) => `nu${i}`,
      latexFor: iceLatex,
    },
    relation: (v) => {
      // ln Q = Σ ν_i ln(([X_i]₀ + ν_i ξ)/c°); every species must stay positive.
      let lnQ = 0;
      for (let i = 1; `nu${i}` in v; i++) {
        const nu = v[`nu${i}`]!;
        if (nu === 0) continue;
        const x = (v[`X0${i}`]! + nu * v.xi!) / C_STD;
        if (!(x > 0)) return [ln(v.K!), NaN];
        lnQ += nu * ln(x);
      }
      return [ln(v.K!), lnQ];
    },
    bracket: (unknown, v) => {
      if (unknown !== 'xi') return undefined;
      // Reactants limit how far forward ξ can go, products how far backward.
      let lo = -Infinity;
      let hi = Infinity;
      for (let i = 1; `nu${i}` in v; i++) {
        const nu = v[`nu${i}`]!;
        const x0 = v[`X0${i}`]!;
        if (nu < 0) hi = Math.min(hi, x0 / -nu);
        if (nu > 0) lo = Math.max(lo, -x0 / nu);
      }
      return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : undefined;
    },
    constraint: (v) => {
      for (let i = 1; `nu${i}` in v; i++) if (v[`nu${i}`] === 0) return `ν${SUB[i]} is 0: remove that species instead`;
      return null;
    },
    rearranged: {
      K: 'K = \\prod_i \\left(\\frac{[\\mathrm{X}_i]_\\mathrm{eq}}{c^\\circ}\\right)^{\\nu_i},\\quad [\\mathrm{X}_i]_\\mathrm{eq} = [\\mathrm{X}_i]_0 + \\nu_i\\xi',
      xi: '\\text{Solve } K = \\prod_i \\left(\\frac{[\\mathrm{X}_i]_0 + \\nu_i\\,\\xi}{c^\\circ}\\right)^{\\nu_i} \\text{ for } \\xi',
    },
    notes:
      'ν is negative for reactants and positive for products. Concentrations are relative to c° = 1 mol dm⁻³; leave out solids, pure liquids and the solvent. The physical root keeps every concentration positive.',
    examples: [
      // H₂ + I₂ ⇌ 2HI from 0.10 mol dm⁻³ each.
      { K: 50, nu1: -1, X01: 0.1, nu2: -1, X02: 0.1, nu3: 2, X03: 0 },
      // Weak acid HA ⇌ H⁺ + A⁻.
      { K: 1.8e-5, nu1: -1, X01: 0.1, nu2: 1, X02: 0, nu3: 1, X03: 0 },
      // N₂ + 3H₂ ⇌ 2NH₃.
      { K: 0.5, nu1: -1, X01: 1, nu2: -3, X02: 3, nu3: 2, X03: 0 },
      // AgCl(s) ⇌ Ag⁺ + Cl⁻ into 0.010 mol dm⁻³ Cl⁻ (the solid is left out).
      { K: 1.8e-10, nu1: 1, X01: 0, nu2: 1, X02: 0.01 },
      // From ξ to K: N₂O₄ ⇌ 2NO₂.
      { xi: 0.02, nu1: -1, X01: 0.1, nu2: 2, X02: 0 },
    ],
    reviewed: false,
  }),
];
