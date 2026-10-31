/**
 * One-dimensional root finding for formula relations written as lhs = rhs.
 *
 * Strategy:
 * 1. Scan a grid for sign changes of the normalised residual (lhs − rhs) / max(|lhs|, |rhs|).
 *    Positive-only unknowns are scanned on a logarithmic grid (10⁻⁸⁰…10⁸⁰), because
 *    chemistry quantities such as K or k span tens of orders of magnitude; signed unknowns on
 *    ±10⁻⁶⁰…10⁶⁰ plus zero. A formula can supply a tighter bracket (e.g. 0 < x < c).
 * 2. Refine each bracket with Newton's method (numerical derivative), falling back to
 *    bisection whenever a Newton step leaves the bracket or stalls.
 * 3. Reject sign changes that are poles rather than roots.
 */

/** A relation evaluated at x, returned as [lhs, rhs]. Return NaN outside the domain. */
export type Sides = (x: number) => readonly [number, number];

export interface RootOptions {
  /** Only positive roots. */
  positive?: boolean;
  /** Open search interval. */
  bracket?: readonly [number, number];
}

const POS_RANGE = [-80, 80] as const; // log10 bounds for positive unknowns
const SIGNED_RANGE = [-60, 60] as const; // log10 bounds of |x| for signed unknowns
const STEP = 0.1; // decades per grid step
const MAX_ITER = 200;
const RESIDUAL_TOL = 1e-6;

export function normalised([lhs, rhs]: readonly [number, number]): number {
  if (!Number.isFinite(lhs) || !Number.isFinite(rhs)) return NaN;
  const m = Math.max(Math.abs(lhs), Math.abs(rhs));
  return m === 0 ? 0 : (lhs - rhs) / m;
}

const magnitude = ([lhs, rhs]: readonly [number, number]) => Math.max(Math.abs(lhs), Math.abs(rhs));

function logSpace(lo: number, hi: number, step = STEP): number[] {
  const out: number[] = [];
  for (let k = lo; k <= hi + 1e-9; k += step) out.push(10 ** k);
  return out;
}

function defaultGrid(positive: boolean): number[] {
  if (positive) return logSpace(...POS_RANGE);
  const pos = logSpace(...SIGNED_RANGE);
  return [...pos.map((x) => -x).reverse(), 0, ...pos];
}

/** Grid inside (lo, hi): linear, plus points crowding towards both ends, plus a log grid when lo ≥ 0. */
function bracketGrid(lo: number, hi: number, positive: boolean): number[] {
  const width = hi - lo;
  const pts: number[] = [];
  for (let i = 1; i < 400; i++) pts.push(lo + (width * i) / 400);
  for (let k = 1; k <= 15; k++) {
    pts.push(lo + width * 10 ** -k, hi - width * 10 ** -k);
  }
  if (positive || lo >= 0) {
    const a = Math.log10(Math.max(lo, hi * 1e-40, Number.MIN_VALUE));
    const b = Math.log10(hi);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) {
      for (const x of logSpace(a, b, (b - a) / 400)) pts.push(x);
    }
  }
  return [...new Set(pts)].filter((x) => x > lo && x < hi && (!positive || x > 0)).sort((x, y) => x - y);
}

function refine(f: (x: number) => number, a0: number, b0: number, fa0: number): number {
  let a = a0;
  let b = b0;
  let fa = fa0;
  let x = (a + b) / 2;
  let prevWidth = Infinity;
  for (let i = 0; i < MAX_ITER; i++) {
    const fx = f(x);
    if (fx === 0) return x;
    if (Number.isNaN(fx)) {
      // Outside the domain inside the bracket: shrink towards the finite end.
      b = x;
      x = (a + b) / 2;
      continue;
    }
    if (Math.sign(fx) === Math.sign(fa)) {
      a = x;
      fa = fx;
    } else {
      b = x;
    }
    const width = Math.abs(b - a);
    if (width <= 1e-14 * Math.max(Math.abs(a), Math.abs(b)) || width < 1e-300) return (a + b) / 2;

    // Newton step with a central-difference derivative.
    const hstep = 1e-7 * Math.max(Math.abs(x), width);
    const df = (f(x + hstep) - f(x - hstep)) / (2 * hstep);
    let next = x - fx / df;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const stalled = width > 0.5 * prevWidth;
    if (!Number.isFinite(next) || next <= lo || next >= hi || stalled) next = (a + b) / 2;
    prevWidth = width;
    x = next;
  }
  return (a + b) / 2;
}

/** All real roots of lhs = rhs in the search region, ascending. */
export function findRoots(sides: Sides, opts: RootOptions = {}): number[] {
  const positive = !!opts.positive;
  const grid = opts.bracket
    ? bracketGrid(opts.bracket[0], opts.bracket[1], positive)
    : defaultGrid(positive);
  const f = (x: number) => normalised(sides(x));

  const roots: number[] = [];
  let px = NaN;
  let pf = NaN;
  for (const x of grid) {
    const fx = f(x);
    if (fx === 0) {
      roots.push(x);
    } else if (Number.isFinite(fx) && Number.isFinite(pf) && pf !== 0 && Math.sign(fx) !== Math.sign(pf)) {
      const r = refine(f, px, x, pf);
      const res = sides(r);
      const isRoot =
        Math.abs(normalised(res)) < RESIDUAL_TOL ||
        // Both sides → 0 at the root (e.g. ln 1 = 0): the normalised residual stays ±1, but the
        // magnitude shrinks rather than blowing up as it would at a pole.
        magnitude(res) <= 10 * Math.max(magnitude(sides(px)), magnitude(sides(x)));
      if (isRoot) roots.push(r);
    }
    px = x;
    pf = fx;
  }

  roots.sort((a, b) => a - b);
  return roots.filter((r, i) => i === 0 || Math.abs(r - roots[i - 1]!) > 1e-9 * Math.max(Math.abs(r), 1e-300));
}
