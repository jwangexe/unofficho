/** Skill levels: a ladder from A-level up to IChO. Each item belongs to one or more. */

export const LEVEL_IDS = ['alevel', 'c3l6', 'ukcho1', 'ukcho2', 'icho'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export type CalcModeId = 'feed' | 'approach' | 'multi' | 'case' | 'exam' | 'mechanisms';
export type ReagentModeId = 'classify' | 'fast' | 'react';

/** A level's scope: what its students are expected to know, and how the app presents it. */
export interface LevelScope {
  id: LevelId;
  /** Name in the UI. */
  name: string;
  /** One line: who it's for. */
  who: string;
  /** Formula ids from the library that students at this level are expected to use. */
  formulas: readonly string[] | 'all';
  /**
   * Topics in scope, matched as prefixes: calculation topics ('thermo'), reagent topics
   * ('organic/reduction') and Book sections ('physical/kinetics').
   */
  topics: readonly string[] | 'all';
  /** Reagent ids in scope. A reagent's levels are exactly the levels whose scope lists it. */
  reagents: readonly string[] | 'all';
  modes: { calc: readonly CalcModeId[]; reagents: readonly ReagentModeId[] };
  /** Exam mode stays a sequence of short items: a target time per item, and unit strictness. */
  exam: { secondsPerItem: number; strictUnits: boolean };
  /** Conventions students at this level see. */
  notation: {
    /** Constant values as printed on this level's data sheet (display only; the engine is exact). */
    constants: Partial<Record<'R' | 'NA' | 'F' | 'h' | 'c', number>>;
    /** How answers are expected to be rounded. */
    sigFigs: string;
    units: string;
  };
  /** Weight of this level's items when shown to higher levels as warm-ups (0–1). */
  warmUpWeight: number;
  todoVerify?: string[];
}
