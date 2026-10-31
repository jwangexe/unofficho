/**
 * SI dimension vectors: exponents of [mass, length, time, current, temperature, amount].
 * (Luminous intensity is never needed here, so it is omitted.)
 */
export type Dim = readonly [number, number, number, number, number, number];

const BASE_SYMBOLS = ['kg', 'm', 's', 'A', 'K', 'mol'] as const;

export function dim(e: { M?: number; L?: number; T?: number; I?: number; Th?: number; N?: number }): Dim {
  return [e.M ?? 0, e.L ?? 0, e.T ?? 0, e.I ?? 0, e.Th ?? 0, e.N ?? 0];
}

export const mulDim = (a: Dim, b: Dim): Dim => a.map((x, i) => x + b[i]!) as unknown as Dim;
export const divDim = (a: Dim, b: Dim): Dim => a.map((x, i) => x - b[i]!) as unknown as Dim;
export const powDim = (a: Dim, p: number): Dim => a.map((x) => x * p) as unknown as Dim;
export const eqDim = (a: Dim, b: Dim): boolean => a.every((x, i) => Math.abs(x - b[i]!) < 1e-9);
export const isDimensionless = (a: Dim): boolean => a.every((x) => Math.abs(x) < 1e-9);
/** A dimension vector with non-integer exponents (e.g. after a square root) */
export const isIntegral = (a: Dim): boolean => a.every((x) => Math.abs(x - Math.round(x)) < 1e-9);

export const dimKey = (a: Dim): string => a.map((x) => +x.toFixed(6)).join(',');

const SUP: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '.': '·', '/': 'ᐟ',
};
export const superscript = (s: string): string => [...s].map((c) => SUP[c] ?? c).join('');

/** Format as SI base units, e.g. "kg m² s⁻²". Used for results with no named unit. */
export function formatDim(a: Dim): string {
  if (isDimensionless(a)) return '';
  const fmtExp = (x: number) => (Number.isInteger(x) ? String(x) : String(+x.toFixed(3)));
  return a
    .map((x, i) => [x, BASE_SYMBOLS[i]!] as const)
    .filter(([x]) => Math.abs(x) > 1e-9)
    .sort(([x], [y]) => (y > 0 ? 1 : 0) - (x > 0 ? 1 : 0)) // positive exponents first
    .map(([x, s]) => (x === 1 ? s : s + superscript(fmtExp(x))))
    .join(' ');
}

export const D = {
  none: dim({}),
  mass: dim({ M: 1 }),
  length: dim({ L: 1 }),
  time: dim({ T: 1 }),
  current: dim({ I: 1 }),
  temperature: dim({ Th: 1 }),
  amount: dim({ N: 1 }),
  energy: dim({ M: 1, L: 2, T: -2 }),
  molarEnergy: dim({ M: 1, L: 2, T: -2, N: -1 }),
  entropy: dim({ M: 1, L: 2, T: -2, Th: -1 }),
  molarEntropy: dim({ M: 1, L: 2, T: -2, Th: -1, N: -1 }),
  specificHeat: dim({ L: 2, T: -2, Th: -1 }),
  pressure: dim({ M: 1, L: -1, T: -2 }),
  volume: dim({ L: 3 }),
  concentration: dim({ N: 1, L: -3 }),
  molarMass: dim({ M: 1, N: -1 }),
  frequency: dim({ T: -1 }),
  rate: dim({ N: 1, L: -3, T: -1 }),
  rateConst2: dim({ L: 3, N: -1, T: -1 }),
  charge: dim({ I: 1, T: 1 }),
  potential: dim({ M: 1, L: 2, T: -3, I: -1 }),
  molarAbsorptivity: dim({ L: 2, N: -1 }),
  energyTime: dim({ M: 1, L: 2, T: -1 }),
  velocity: dim({ L: 1, T: -1 }),
  perAmount: dim({ N: -1 }),
  chargePerAmount: dim({ I: 1, T: 1, N: -1 }),
} as const;
