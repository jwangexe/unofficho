/**
 * Just enough computer algebra for steady-state derivations: polynomials in named symbols
 * (rate constants and concentrations) whose exponents may be fractional or negative, and
 * rational expressions built from them. Coefficients are plain numbers; in mechanism
 * algebra they stay small rationals.
 */

/** Symbol → exponent (never 0). */
export type Mono = Readonly<Record<string, number>>;
export interface Term {
  c: number;
  m: Mono;
}
/** A polynomial is a list of terms with distinct monomials and non-zero coefficients. */
export type Poly = readonly Term[];
export interface Rational {
  num: Poly;
  den: Poly;
}

const EPS = 1e-12;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

export const monoKey = (m: Mono) =>
  Object.keys(m)
    .sort()
    .map((k) => `${k}^${m[k]}`)
    .join('*');

function collect(terms: Iterable<Term>): Poly {
  const map = new Map<string, Term>();
  for (const t of terms) {
    const k = monoKey(t.m);
    const prev = map.get(k);
    map.set(k, { c: (prev?.c ?? 0) + t.c, m: t.m });
  }
  return [...map.values()].filter((t) => Math.abs(t.c) > EPS);
}

export const ZERO: Poly = [];
export const ONE: Poly = [{ c: 1, m: {} }];
export const constant = (c: number): Poly => (c === 0 ? [] : [{ c, m: {} }]);
export const sym = (name: string, exp = 1): Poly => [{ c: 1, m: { [name]: exp } }];

function mulMono(a: Mono, b: Mono, sign = 1): Mono {
  const out: Record<string, number> = { ...a };
  for (const [k, e] of Object.entries(b)) {
    const v = (out[k] ?? 0) + sign * e;
    if (Math.abs(v) < EPS) delete out[k];
    else out[k] = v;
  }
  return out;
}

export const add = (...ps: Poly[]): Poly => collect(ps.flat());
export const scale = (p: Poly, c: number): Poly => collect(p.map((t) => ({ c: t.c * c, m: t.m })));
export const neg = (p: Poly) => scale(p, -1);
export const sub = (a: Poly, b: Poly) => add(a, neg(b));
export function mul(...ps: Poly[]): Poly {
  return ps.reduce<Poly>((acc, p) => collect(acc.flatMap((a) => p.map((b) => ({ c: a.c * b.c, m: mulMono(a.m, b.m) })))), ONE);
}
export function pow(p: Poly, n: number): Poly {
  if (Number.isInteger(n) && n >= 0) return Array.from({ length: n }, () => p).reduce<Poly>((a, b) => mul(a, b), ONE);
  const t = asMonomial(p);
  if (!t) throw new Error('fractional or negative power of a non-monomial');
  if (!Number.isInteger(n) && t.c <= 0) throw new Error('fractional power of a negative coefficient');
  return [{ c: t.c ** n, m: Object.fromEntries(Object.entries(t.m).map(([k, e]) => [k, e * n])) }];
}

export const isZero = (p: Poly) => p.length === 0;
export const asMonomial = (p: Poly): Term | null => (p.length === 1 ? p[0]! : null);
export const symbols = (p: Poly) => new Set(p.flatMap((t) => Object.keys(t.m)));
export const hasSymbol = (p: Poly, s: string) => p.some((t) => s in t.m);

/** Evaluate with numeric values for every symbol. */
export const evaluate = (p: Poly, v: Record<string, number>) =>
  p.reduce((s, t) => s + t.c * Object.entries(t.m).reduce((x, [k, e]) => x * v[k]! ** e, 1), 0);
export const evaluateR = (r: Rational, v: Record<string, number>) => evaluate(r.num, v) / evaluate(r.den, v);

/** Coefficient polynomials of a symbol's powers: p = Σ coeff[e] · s^e. */
export function byPowerOf(p: Poly, s: string): Map<number, Poly> {
  const groups = new Map<number, Term[]>();
  for (const t of p) {
    const e = t.m[s] ?? 0;
    const rest = { ...t.m };
    delete rest[s];
    groups.set(e, [...(groups.get(e) ?? []), { c: t.c, m: rest }]);
  }
  return new Map([...groups].map(([e, ts]) => [e, collect(ts)]));
}

// ---------- Rational expressions ----------

export const rat = (num: Poly, den: Poly = ONE): Rational => ({ num, den });
export const rAdd = (a: Rational, b: Rational): Rational => rat(add(mul(a.num, b.den), mul(b.num, a.den)), mul(a.den, b.den));
export const rMul = (a: Rational, b: Rational): Rational => rat(mul(a.num, b.num), mul(a.den, b.den));
export const rDiv = (a: Rational, b: Rational): Rational => rat(mul(a.num, b.den), mul(a.den, b.num));
export const rNeg = (a: Rational): Rational => rat(neg(a.num), a.den);

/**
 * Replace symbol s by a rational value in a polynomial. Powers of s must be non-negative
 * integers unless the value is a single monomial.
 */
export function substitute(p: Poly, s: string, value: Rational): Rational {
  if (!hasSymbol(p, s)) return rat(p);
  const mono = asMonomial(value.num) && asMonomial(value.den);
  if (mono) {
    const v = mul(value.num, pow(value.den, -1));
    return rat(collect(p.flatMap((t) => mul([{ c: t.c, m: withoutSym(t.m, s) }], pow(v, t.m[s] ?? 0)))));
  }
  const groups = byPowerOf(p, s);
  const top = Math.max(...groups.keys());
  if ([...groups.keys()].some((e) => !Number.isInteger(e) || e < 0)) throw new Error(`cannot substitute ${s}: non-integer power`);
  const num = add(...[...groups].map(([e, c]) => mul(c, pow(value.num, e), pow(value.den, top - e))));
  return rat(num, pow(value.den, top));
}

function withoutSym(m: Mono, s: string): Mono {
  const out = { ...m };
  delete out[s];
  return out;
}

export function substituteR(r: Rational, s: string, value: Rational): Rational {
  const n = substitute(r.num, s, value);
  const d = substitute(r.den, s, value);
  return rDiv(n, d);
}

// ---------- Simplification ----------

/** Order symbols for leading terms and display: earlier in `order` first. */
export type SymbolOrder = (s: string) => number;

function compareMono(a: Mono, b: Mono, order: SymbolOrder): number {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => order(x) - order(y) || x.localeCompare(y));
  for (const k of keys) {
    const d = (a[k] ?? 0) - (b[k] ?? 0);
    if (Math.abs(d) > EPS) return d > 0 ? -1 : 1;
  }
  return 0;
}

export const sortTerms = (p: Poly, order: SymbolOrder): Poly => [...p].sort((a, b) => compareMono(a.m, b.m, order));

/** Concentrations are symbols written [X]. */
const concDegree = (m: Mono) => Object.entries(m).reduce((d, [s, e]) => d + (s.startsWith('[') ? e : 0), 0);

/** Display order: terms with fewer concentrations first (k₋₁ + k₂ + k₁[S]), then by symbol order. */
export const displayTerms = (p: Poly, order: SymbolOrder): Poly =>
  [...p].sort((a, b) => concDegree(a.m) - concDegree(b.m) || compareMono(a.m, b.m, order));

/** Exact division a / b, or null if b does not divide a. */
export function divide(a: Poly, b: Poly, order: SymbolOrder): Poly | null {
  if (isZero(b)) return null;
  const bm = asMonomial(b);
  if (bm) return collect(a.map((t) => ({ c: t.c / bm.c, m: mulMono(t.m, bm.m, -1) })));
  const lb = sortTerms(b, order)[0]!;
  let r = a;
  const q: Term[] = [];
  for (let i = 0; i < 400 && !isZero(r); i++) {
    const lr = sortTerms(r, order)[0]!;
    const m = mulMono(lr.m, lb.m, -1);
    if (Object.values(m).some((e) => e < -EPS)) return null;
    const t = { c: lr.c / lb.c, m };
    q.push(t);
    r = sub(r, mul([t], b));
  }
  return isZero(r) ? collect(q) : null;
}

const gcdInt = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcdInt(b, a % b));

/**
 * Cancel common factors: shared monomial content (which also clears negative exponents),
 * integer content, any of the `candidates` that divide both, and an exact quotient.
 * The sign is fixed so that the denominator's leading term is positive.
 */
export function simplify(r: Rational, order: SymbolOrder, candidates: readonly Poly[] = []): Rational {
  if (isZero(r.num)) return rat(ZERO);
  let { num, den } = r;

  const all = [...num, ...den];
  const syms = new Set(all.flatMap((t) => Object.keys(t.m)));
  const content: Record<string, number> = {};
  for (const s of syms) {
    const e = Math.min(...all.map((t) => t.m[s] ?? 0));
    if (Math.abs(e) > EPS) content[s] = e;
  }
  const cm: Poly = [{ c: 1, m: content }];
  num = divide(num, cm, order)!;
  den = divide(den, cm, order)!;

  for (const f of candidates) {
    if (asMonomial(f)) continue;
    for (let i = 0; i < 4; i++) {
      const n2 = divide(num, f, order);
      const d2 = n2 && divide(den, f, order);
      if (!n2 || !d2) break;
      num = n2;
      den = d2;
    }
  }
  if (!asMonomial(den)) {
    const q = divide(num, den, order);
    if (q) return simplify(rat(q), order);
  }

  const coefs = [...num, ...den].map((t) => t.c);
  if (coefs.every((c) => Number.isInteger(Math.round(c * 1e9) / 1e9) && near(c, Math.round(c)))) {
    const g = coefs.map((c) => Math.round(c)).reduce(gcdInt);
    if (g > 1) {
      num = scale(num, 1 / g);
      den = scale(den, 1 / g);
    }
  }
  num = sortTerms(num, order);
  den = sortTerms(den, order);
  if (den[0]!.c < 0) {
    num = neg(num);
    den = neg(den);
  }
  // A constant denominator folds into the numerator's coefficients.
  const dm = asMonomial(den);
  if (dm && Object.keys(dm.m).length === 0) {
    num = sortTerms(scale(num, 1 / dm.c), order);
    den = ONE;
  }
  return rat(num, den);
}

/** Do two rational expressions agree at several random positive points? */
export function sameValue(a: Rational, b: Rational, symbolsList: readonly string[], trials = 6): boolean {
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return 0.3 + (seed / 2 ** 31) * 3;
  };
  for (let i = 0; i < trials; i++) {
    const v = Object.fromEntries(symbolsList.map((s) => [s, rnd()]));
    const x = evaluateR(a, v);
    const y = evaluateR(b, v);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
  }
  return true;
}

// ---------- LaTeX ----------

function fraction(x: number): string {
  if (near(x, Math.round(x))) return String(Math.round(x));
  for (let d = 2; d <= 12; d++) if (near(x * d, Math.round(x * d))) return `${Math.round(x * d)}/${d}`;
  return x.toPrecision(4);
}

function monoTex(m: Mono, tex: (s: string) => string, order: SymbolOrder): string {
  return Object.keys(m)
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
    .map((s) => {
      const e = m[s]!;
      const base = tex(s);
      if (near(e, 1)) return base;
      const exp = fraction(e);
      // Wrap subscripted symbols so the exponent does not read as part of the subscript.
      const wrapped = /_/.test(base) && !base.startsWith('[') ? `{${base}}` : base;
      return `${wrapped}^{${exp}}`;
    })
    .join('');
}

export function polyTex(p: Poly, tex: (s: string) => string, order: SymbolOrder): string {
  if (isZero(p)) return '0';
  return displayTerms(p, order)
    .map((t, i) => {
      const body = monoTex(t.m, tex, order);
      const mag = Math.abs(t.c);
      const coef = near(mag, 1) && body ? '' : fraction(mag).replace(/^(\d+)\/(\d+)$/, '\\tfrac{$1}{$2}');
      const sign = t.c < 0 ? (i === 0 ? '-' : ' - ') : i === 0 ? '' : ' + ';
      return `${sign}${coef}${body || (coef ? '' : '1')}`;
    })
    .join('');
}

export function ratTex(r: Rational, tex: (s: string) => string, order: SymbolOrder): string {
  const n = polyTex(r.num, tex, order);
  const dm = asMonomial(r.den);
  if (dm && Object.keys(dm.m).length === 0 && near(dm.c, 1)) return n;
  return `\\dfrac{${n}}{${polyTex(r.den, tex, order)}}`;
}
