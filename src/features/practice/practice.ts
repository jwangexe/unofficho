/**
 * Practice landing pages: one public page per question template (/practice/<slug>), with a
 * worked example, the method and the common mistakes, so each question type can be found by
 * search and linked to. The example uses a fixed seed, so the page reads the same every time
 * (and the pre-rendered HTML matches what the app shows).
 */
import { ALL_TEMPLATES } from '@/data/templates';
import { LEVELS } from '@/data/levels';
import { instantiate, type CalcInstance, type CalcTemplate } from '@/engine/template';
import { focusQuery } from '../focus';
import { itemId } from '@/storage/itemIds';

/** URL slug from the template id, which never changes: "calc-al-born-haber-nacl" → "born-haber-nacl". */
export const practiceSlug = (t: CalcTemplate) => t.id.replace(/^(calc|ms)-/, '').replace(/^al-/, '');

export const PRACTICE: readonly CalcTemplate[] = ALL_TEMPLATES;
export const practiceBySlug = new Map(PRACTICE.map((t) => [practiceSlug(t), t]));
export const practicePath = (t: CalcTemplate) => `/practice/${practiceSlug(t)}`;

/** The worked example: the first seed that gives a valid instance. */
export function workedExample(t: CalcTemplate): CalcInstance {
  for (let seed = 1; seed < 50; seed++) {
    const r = instantiate(t, seed);
    if (r.ok) return r.value;
  }
  throw new Error(`${t.id}: no worked example`);
}

/** "A-Level (AQA) · C3L6" */
export const levelNames = (t: CalcTemplate) => t.levels.map((l) => LEVELS[l].name).join(' · ');

/** One sentence on what the question is about. */
export const practiceLead = (t: CalcTemplate) => (t.approachText ?? t.explanation.split(/(?<=\.)\s/)[0] ?? t.title).replace(/\.?$/, '.');

/** Up to ~160 characters for the meta description. */
export function practiceDescription(t: CalcTemplate): string {
  const lead = practiceLead(t);
  const text = `${lead} Worked example, method and common mistakes.`;
  if (text.length <= 160) return text;
  return `${lead.slice(0, 155).replace(/\s+\S*$/, '')}…`;
}

/** Into the app: this question with fresh numbers, in Feed mode (which accepts any template). */
export const practiseHref = (t: CalcTemplate) => `/calc${focusQuery({ ids: [itemId.calc(t.id)], label: t.title })}&mode=feed`;
