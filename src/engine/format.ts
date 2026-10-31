import { superscript } from './dims';

const MINUS = '−';

/** Format a number to `sig` significant figures, using × 10ⁿ outside 10⁻³…10⁵. */
export function formatNumber(v: number, sig = 3): string {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0) return '0';
  const sign = v < 0 ? MINUS : '';
  const rounded = Number(Math.abs(v).toPrecision(sig));
  const exp = Math.floor(Math.log10(rounded));
  if (rounded >= 1e-3 && rounded < 1e5) {
    return sign + rounded.toFixed(Math.max(0, sig - 1 - exp));
  }
  const mant = rounded / 10 ** exp;
  return `${sign}${mant.toFixed(sig - 1)} × 10${superscript(String(exp))}`;
}
