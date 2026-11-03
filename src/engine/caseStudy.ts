/**
 * Case studies: a short stem describing an unfamiliar system, then a few linked parts. Each
 * part is an ordinary question template sharing the case's parameters, setup and givens, so
 * every part of one case shows the same numbers. A later part can be handed an earlier part's
 * answer as an extra given ("from (a)"), worked out in the setup, so one slip does not sink
 * the rest of the case.
 */
import type { LevelId } from '@/data/levels/types';
import type { GraphNode } from './graph';
import type { CalcInstance, CalcTemplate, GivenSpec, Misconception, ParamSpec, Tolerance } from './template';
import { instantiate } from './template';

export interface CasePart {
  /** Full, permanent id: "<case id>-a", "<case id>-b", … */
  id: string;
  title: string;
  /** Extra givens for this part only, typically an earlier part's answer from the setup. */
  given?: GivenSpec[];
  reference: GraphNode[];
  answer: { node: string; label: string; unit: string };
  tolerance?: Tolerance;
  misconceptions?: Misconception[];
  /** The part's own question (the stem is shown above it). At least two wordings. */
  wordings: string[];
  approachText?: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
  reviewed: boolean;
}

export interface CaseStudyDef {
  id: string;
  topic: string;
  title: string;
  /** The stem, with {key} placeholders for the shared givens. */
  intro: string;
  params: Record<string, ParamSpec>;
  setup?: GraphNode[];
  /** Givens shared by every part (the data in the stem). */
  given: GivenSpec[];
  /** Realism check on the shared givens' SI values (no part's answer is passed). */
  constraint?: (v: Record<string, number>) => boolean;
  levels: LevelId[];
  sourceNote?: string;
  todoVerify?: string[];
  parts: CasePart[];
}

export interface CaseStudy {
  id: string;
  title: string;
  topic: string;
  levels: LevelId[];
  parts: CalcTemplate[];
  /** How many givens (the first ones of every part) are shared by all parts. */
  shared: number;
}

/** Turn a case definition into its part templates. */
export function defineCase(c: CaseStudyDef): CaseStudy {
  const parts = c.parts.map(
    (p, i): CalcTemplate => ({
      id: p.id,
      topic: c.topic,
      title: `${c.title} (${String.fromCharCode(97 + i)}): ${p.title}`,
      difficulty: p.difficulty,
      params: c.params,
      ...(c.setup && { setup: c.setup }),
      given: [...c.given, ...(p.given ?? [])],
      ...(c.constraint && { constraint: (v: Record<string, number>) => c.constraint!(v) }),
      reference: p.reference,
      answer: p.answer,
      ...(p.tolerance !== undefined && { tolerance: p.tolerance }),
      ...(p.misconceptions && { misconceptions: p.misconceptions }),
      wordings: p.wordings,
      approachText: p.approachText ?? p.title,
      explanation: p.explanation,
      reviewed: p.reviewed,
      levels: c.levels,
      ...(c.sourceNote && { sourceNote: c.sourceNote }),
      ...(c.todoVerify && { todoVerify: c.todoVerify }),
      caseStudy: { id: c.id, title: c.title, intro: c.intro, part: i + 1, parts: c.parts.length },
    }),
  );
  return { id: c.id, title: c.title, topic: c.topic, levels: c.levels, parts, shared: c.given.length };
}

/** Part letter for display: 1 → "a". */
export const partLetter = (part: number) => String.fromCharCode(96 + part);

/**
 * Every part of one case with the same numbers. Parts share their parameters, so the same
 * seed normally gives the same draw; if a part had to redraw, try the next seed.
 */
export function instantiateCase(c: CaseStudy, seed: number): CalcInstance[] {
  for (let s = seed; s < seed + 50; s++) {
    const insts = c.parts.map((t) => instantiate(t, s));
    if (!insts.every((r) => r.ok)) continue;
    const values = insts.flatMap((r) => (r.ok ? [r.value] : []));
    const shared = (i: CalcInstance) => JSON.stringify(i.givens.slice(0, c.shared).map((g) => [g.key, g.q.value]));
    if (values.every((v) => shared(v) === shared(values[0]!))) return values;
  }
  throw new Error(`Case study ${c.id}: parts do not agree on their numbers`);
}
