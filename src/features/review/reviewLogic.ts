/**
 * Review mode logic, kept free of UI so it can be tested: the review queue, typed answers
 * ("−56.3 kJ mol⁻¹"), comparison with the reference, sampling instances for outliers, and
 * the markdown export of notes.
 */
import { reactItems, reagents } from '@/data';
import { bookPages } from '@/data/book';
import { MECHANISMS } from '@/data/mechanisms';
import { CALC_TEMPLATES, CASE_PARTS, PROBLEMS } from '@/data/templates';
import { withinTolerance } from '@/engine/check';
import { D, eqDim } from '@/engine/dims';
import { FORMULAS } from '@/engine/formulas';
import { displayValue, qty, type Quantity } from '@/engine/quantity';
import { instantiate, type CalcInstance, type CalcTemplate } from '@/engine/template';
import { getUnit, UNITS, type Unit } from '@/engine/units';
import type { ReviewKind } from '../../../scripts/review';

// ---------- Queue ----------

export const SECTIONS = ['feed', 'multi', 'case', 'mechanisms', 'reagents', 'book', 'formulas'] as const;
export type ReviewSection = (typeof SECTIONS)[number];

export const SECTION_LABEL: Record<ReviewSection, string> = {
  feed: 'Feed questions',
  multi: 'Multi-step',
  case: 'Case studies',
  mechanisms: 'Mechanisms',
  reagents: 'Reagents',
  book: 'Book pages',
  formulas: 'Formulas',
};

export interface QueueItem {
  /** `${kind}:${id}`: unique, and the key used for notes and local marks. */
  key: string;
  kind: ReviewKind;
  id: string;
  section: ReviewSection;
  title: string;
  topic: string;
  difficulty?: number;
  reviewed: boolean;
}

/** Every reviewable item, in the order students are most likely to meet them. */
export function allItems(): QueueItem[] {
  const item = (kind: ReviewKind, id: string, section: ReviewSection, title: string, topic: string, reviewed: boolean, difficulty?: number): QueueItem => ({
    key: `${kind}:${id}`,
    kind,
    id,
    section,
    title,
    topic,
    reviewed,
    ...(difficulty !== undefined && { difficulty }),
  });
  const byDifficulty = (a: CalcTemplate, b: CalcTemplate) => a.difficulty - b.difficulty || a.title.localeCompare(b.title);
  return [
    ...[...CALC_TEMPLATES].sort(byDifficulty).map((t) => item('template', t.id, 'feed', t.title, t.topic, t.reviewed, t.difficulty)),
    ...[...PROBLEMS].sort(byDifficulty).map((t) => item('template', t.id, 'multi', t.title, t.topic, t.reviewed, t.difficulty)),
    // In case order (a, b, c), so each part is checked with the one before it fresh in mind.
    ...CASE_PARTS.map((t) => item('template', t.id, 'case', t.title, t.topic, t.reviewed, t.difficulty)),
    ...MECHANISMS.map((m) => item('mechanism', m.id, 'mechanisms', m.title, m.topic, m.reviewed)),
    ...reagents.map((r) => item('reagent', r.id, 'reagents', r.name, r.topic, r.reviewed)),
    ...reactItems.map((x) => item('react', x.id, 'reagents', `Will it react? ${x.substrate.name}`, x.topic, x.reviewed)),
    ...bookPages.filter((p) => !p.stub).map((p) => item('book', p.id, 'book', p.title, `${p.chapter}/${p.section}`, p.reviewed)),
    ...FORMULAS.map((f) => item('formula', f.id, 'formulas', f.name, f.topic, f.reviewed)),
  ];
}

/** Reviewed vs total per section, counting marks made on this device as reviewed. */
export function progressBySection(items: readonly QueueItem[], marked: ReadonlySet<string>) {
  return SECTIONS.map((section) => {
    const inSection = items.filter((i) => i.section === section);
    return { section, total: inSection.length, reviewed: inSection.filter((i) => i.reviewed || marked.has(i.key)).length };
  });
}

// ---------- Typed answers ----------

const SUPERSCRIPT: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const normaliseText = (s: string) =>
  s
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUPERSCRIPT[c]!)
    .replace(/[−–]/g, '-')
    .replace(/[µμ]/g, 'u')
    .trim();

/**
 * A unit as base tokens and powers: "kJ mol^-1", "kJ/mol" and "kJ mol⁻¹" all give
 * {kJ: 1, mol: -1}. "L" counts as dm³ and "M" as mol dm⁻³.
 */
function unitPowers(text: string): Map<string, number> | null {
  const s = normaliseText(text).replace(/[·*]/g, ' ');
  const out = new Map<string, number>();
  const add = (token: string, power: number) => {
    if (token === 'L' || token === 'l') return add('dm', 3 * power);
    if (token === 'M') {
      add('mol', power);
      return add('dm', -3 * power);
    }
    if (token === '°C' || token === 'oC') token = 'degC';
    if (token === '1') return;
    out.set(token, (out.get(token) ?? 0) + power);
    if (out.get(token) === 0) out.delete(token);
  };
  // Everything after a "/" is in the denominator; brackets just group it.
  const [num = '', ...dens] = s.split('/');
  const parts: [string, number][] = [[num, 1], ...dens.map((d) => [d, -1] as [string, number])];
  for (const [part, sign] of parts) {
    for (const raw of part.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean)) {
      const m = raw.match(/^(°C|%|[A-Za-z]+|1)\^?(-?\d+)?$/);
      if (!m) return null;
      add(m[1]!, sign * Number(m[2] ?? 1));
    }
  }
  return out;
}

const samePowers = (a: Map<string, number>, b: Map<string, number>) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

/** Find the app's unit for typed text such as "kJ mol-1", "mol dm^-3", "M", "°C" or "%". */
export function parseUnit(text: string): Unit | null {
  const t = normaliseText(text);
  if (!t) return getUnit('1');
  const direct = UNITS.find((u) => u.id === t || u.symbol === text.trim());
  if (direct) return direct;
  const want = unitPowers(t);
  if (!want) return null;
  return UNITS.find((u) => {
    const have = unitPowers(u.id);
    return have !== null && samePowers(have, want);
  }) ?? null;
}

export type ParsedAnswer = { ok: true; q: Quantity; assumedUnit: boolean } | { ok: false; error: string };

/**
 * Parse a typed answer: a number (1.2e-3, 1.2×10^-3, 1.2 x 10⁻³, −4) and an optional unit.
 * With no unit, the question's answer unit is assumed.
 */
export function parseAnswer(text: string, answerUnit: string, kind?: Quantity['kind']): ParsedAnswer {
  const s = normaliseText(text).replace(/,/g, '');
  const m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(?:\s*[x×*]\s*10\s*\^?\s*([+-]?\d+))?\s*(.*)$/);
  if (!m) return { ok: false, error: 'Start with a number, e.g. 1.2e-3 or 1.2×10^-3.' };
  const value = Number(m[1]) * (m[2] ? 10 ** Number(m[2]) : 1);
  const unitText = m[3]!.trim();
  if (!unitText) return { ok: true, q: qty(value, answerUnit, kind), assumedUnit: true };
  const unit = parseUnit(unitText);
  if (!unit) return { ok: false, error: `Unknown unit "${unitText}". Try forms like kJ/mol, mol dm^-3, s^-1.` };
  return { ok: true, q: qty(value, unit.id, kind), assumedUnit: false };
}

export interface Comparison {
  dimOk: boolean;
  agrees: boolean;
  /** Relative difference |mine − reference| / |reference|, when the units match. */
  relDiff: number | null;
  /** Absolute difference |mine − reference| in SI, when the units match (for pH-like answers). */
  absDiff: number | null;
}

/** The same check the app uses for students: same dimension and within the template's tolerance. */
export function compareAnswer(t: CalcTemplate, inst: CalcInstance, mine: Quantity): Comparison {
  const dimOk = eqDim(mine.dim, inst.expected.dim);
  if (!dimOk) return { dimOk, agrees: false, relDiff: null, absDiff: null };
  const ref = inst.expected.value;
  return {
    dimOk,
    agrees: withinTolerance(mine.value, ref, t.tolerance),
    relDiff: ref === 0 ? null : Math.abs(mine.value - ref) / Math.abs(ref),
    absDiff: Math.abs(mine.value - ref),
  };
}

// ---------- Sampling for range problems ----------

export interface Sample {
  seed: number;
  /** Displayed in the template's answer unit; null if no instance could be generated. */
  value: number | null;
  flags: string[];
}

/** Values no question should produce, by what the answer is. */
function implausible(t: CalcTemplate, q: Quantity): string | null {
  const v = q.value;
  const unit = getUnit(t.answer.unit);
  const label = t.answer.label.toLowerCase();
  if (eqDim(q.dim, D.temperature) && q.kind !== 'delta-temp' && (v <= 0 || v > 5000)) return 'temperature outside 0–5000 K';
  if (/\bp(h|oh|k)/.test(label) && (displayValue(q) < -2 || displayValue(q) > 16)) return 'p-value outside −2…16';
  if (eqDim(q.dim, D.concentration) && v > 2.5e4) return 'concentration above 25 mol dm⁻³';
  if (unit.id === '%' && (displayValue(q) < 0 || displayValue(q) > 100)) return 'percentage outside 0–100';
  const mustBePositive = [D.mass, D.amount, D.volume, D.time, D.concentration, D.pressure, D.massConcentration];
  if (mustBePositive.some((d) => eqDim(q.dim, d)) && v < 0) return 'negative amount, mass, volume, time, concentration or pressure';
  return null;
}

/**
 * Which values are isolated outliers: far from the rest in log space by a robust measure
 * (3 × the scaled median absolute deviation, and at least a factor of 10). A uniformly wide
 * spread, normal for equilibrium constants, is not flagged; one stray value is.
 */
export function flagOutliers(values: readonly number[]): boolean[] {
  const logs = values.map((v) => (v > 0 ? Math.log10(v) : null));
  const ok = logs.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (ok.length < 5) return values.map(() => false);
  const median = ok[Math.floor(ok.length / 2)]!;
  const deviations = ok.map((x) => Math.abs(x - median)).sort((a, b) => a - b);
  const sigma = 1.4826 * deviations[Math.floor(deviations.length / 2)]!;
  return logs.map((x) => x !== null && Math.abs(x - median) > Math.max(3 * sigma, 1));
}

/** Orders of magnitude between the smallest and largest positive answer (shown, not flagged). */
export function spreadDecades(samples: readonly Sample[]): number | null {
  const v = samples.map((s) => s.value).filter((x): x is number => x !== null && x > 0);
  return v.length > 1 ? Math.log10(Math.max(...v) / Math.min(...v)) : null;
}

/**
 * Generate n instances and flag the ones a reviewer should look at: failures, implausible
 * values, numbers too extreme to read, and isolated outliers.
 */
export function sampleAnswers(t: CalcTemplate, n = 20, firstSeed = 1): Sample[] {
  const samples: (Sample & { q?: Quantity })[] = [];
  for (let i = 0; i < n; i++) {
    const seed = firstSeed + i;
    const res = instantiate(t, seed);
    if (!res.ok) {
      samples.push({ seed, value: null, flags: [`could not generate: ${res.error.message}`] });
      continue;
    }
    const q = res.value.expected;
    const value = displayValue(q);
    const flags: string[] = [];
    if (!Number.isFinite(value)) flags.push('not a finite number');
    const why = implausible(t, q);
    if (why) flags.push(why);
    if (value !== 0 && (Math.abs(value) > 1e12 || Math.abs(value) < 1e-12)) flags.push('extreme number (beyond 10^±12)');
    samples.push({ seed, value, flags, q });
  }
  const outliers = flagOutliers(samples.map((s) => s.value ?? NaN));
  samples.forEach((s, i) => outliers[i] && s.flags.push('isolated outlier'));
  return samples.map(({ seed, value, flags }) => ({ seed, value, flags }));
}

// ---------- Notes and export ----------

export interface ReviewNote {
  key: string;
  kind: ReviewKind;
  id: string;
  title: string;
  note: string;
  createdAt: number;
  /** For calculation templates: the instance the problem was found on. */
  instance?: { seed: number; question: string; myAnswer?: string; reference: string; agreed?: boolean };
}

export interface LocalMark {
  key: string;
  kind: ReviewKind;
  id: string;
  title: string;
  at: number;
}

const one = (s: string) => s.replace(/\s+/g, ' ').trim();

/** A markdown list to paste back to Claude: problems first, then items marked reviewed on a device. */
export function exportMarkdown(notes: readonly ReviewNote[], marks: readonly LocalMark[], date = new Date()): string {
  const lines = [`# UnoffIChO review notes (${date.toISOString().slice(0, 10)})`, ''];
  lines.push(`## Problems found (${notes.length})`, '');
  if (!notes.length) lines.push('None.', '');
  for (const n of notes) {
    lines.push(`- **${n.title}** (\`${n.kind}\` \`${n.id}\`)`);
    lines.push(`  - Note: ${one(n.note) || '(no note)'}`);
    if (n.instance) {
      lines.push(`  - Instance: seed ${n.instance.seed}: ${one(n.instance.question)}`);
      const mine = n.instance.myAnswer ? `my answer ${one(n.instance.myAnswer)}` : 'no answer entered';
      const verdict = n.instance.agreed === undefined ? '' : n.instance.agreed ? ' (agreed)' : ' (DISAGREED)';
      lines.push(`  - ${mine}; reference ${n.instance.reference}${verdict}`);
    }
  }
  if (notes.length) lines.push('');
  lines.push(`## Marked reviewed here, not yet in the source (${marks.length})`, '');
  if (!marks.length) lines.push('None.');
  for (const m of marks) lines.push(`- \`${m.kind}\` \`${m.id}\`: ${m.title} → set \`reviewed: true\``);
  return `${lines.join('\n')}\n`;
}
