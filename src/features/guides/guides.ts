/**
 * One guide page per level: what the competition or exam is, how to prepare for it in the app,
 * and what the app covers there. Written for people arriving from a search, so each page names
 * its competition the way people type it.
 */
import { LEVEL_IDS, type LevelId } from '@/data/levels';

export interface Guide {
  level: LevelId;
  slug: string;
  /** Page title and h1. */
  title: string;
  /** Meta description (160 characters at most). */
  description: string;
  /** What the competition or exam is. */
  about: string[];
  /** How to use the app for it. */
  tips: string[];
}

export const GUIDES: Record<LevelId, Guide> = {
  alevel: {
    level: 'alevel',
    slug: 'a-level-chemistry',
    title: 'A-Level Chemistry calculations',
    description:
      'A-Level Chemistry practice: moles, energetics, Kc and Kp, rates, pH and electrochemical cells.',
    about: [
      'A-Level Chemistry is the two-year course taken in Years 12 and 13 in England, Wales and Northern Ireland. The A-Level questions roughly follow major exam boards.'
    ],
    tips: [
      'Kc and Kp have units at A-Level, but the K introduced later on is dimensionless.',
      'Read the Book page on a topic first if a question type is new to you, then try its worked example.',
    ],
  },
  c3l6: {
    level: 'c3l6',
    slug: 'cambridge-chemistry-challenge-c3l6',
    title: 'Cambridge Chemistry Challenge (C3L6)',
    description:
      'Practice for the Cambridge Chemistry Challenge Lower Sixth (C3L6): multi-part calculations, from beyond AS-Level.',
    about: [
      'C3L6 is for Year 12 students and is sat at school in the summer. It starts from AS-Level chemistry and explains unfamiliar ideas in the question itself.',
      'Questions are long and often built around one context, with later parts dependent on earlier ones.',
    ],
    tips: [
      'Case studies practise longer C3L6 questions: several linked parts that share one story.',
      'Multi-step questions train your accuracy and ability to carry an answer through.',
      'When a question explains a new idea, read it twice and try to derive its formula.',
    ],
  },
  ukcho1: {
    level: 'ukcho1',
    slug: 'uk-chemistry-olympiad-round-1',
    title: 'UK Chemistry Olympiad Round 1',
    description:
      'Practice for the UK Chemistry Olympiad (UKChO) Round 1: thermodynamics, kinetics, electrochemistry and organic reagents at high A-Level standard.',
    about: [
      'UKChO, run by the Royal Society of Chemistry, is a written paper for Year 13 students, sat at school in late January.',
      'It expects A-Level chemistry and goes beyond it: entropy and Gibbs energy, rate laws and half-lives, the Nernst equation, and organic chemistry with reagents you probably have not have met. The 30 best scorers are invited to Round 2.',
    ],
    tips: [
      'Approach mode asks you to plan a route before any numbers, which is most of the work in a Round 1 calculation.',
      'Drill reagents with Classify so the organic questions are about thinking, not recall.',
      'Exam mode times each question; Round 1 rewards working quickly and accurately.',
    ],
  },
  ukcho2: {
    level: 'ukcho2',
    slug: 'uk-chemistry-olympiad-round-2',
    title: 'UK Chemistry Olympiad Round 2',
    description:
      'Practice for UK Chemistry Olympiad (UKChO) Round 2: derivations, mechanisms and rate laws, crystal structures and harder physical chemistry.',
    about: [
      'Round 2 of the UK Chemistry Olympiad brings around thirty of the top Round 1 students together for selection, with theory and practical tests. Four are chosen to represent the UK at the International Chemistry Olympiad.',
      'Its problems are close to the IChO preparatory problems: longer derivations, reaction mechanisms and the rate laws they lead to, solid-state structures and spectroscopy.',
    ],
    tips: [
      'Mechanisms mode has you derive rate laws with the steady-state and pre-equilibrium approximations, step by step.',
      'The Book’s derivation pages show where the two-point and other formulas come from; Round 2 often asks for exactly that.',
      'Turn on “Include easier levels” in Settings to mix Round 1 questions in as warm-ups.',
    ],
  },
  icho: {
    level: 'icho',
    slug: 'international-chemistry-olympiad',
    title: 'International Chemistry Olympiad (IChO)',
    description:
      'Practice for the International Chemistry Olympiad (IChO): calculations, rate-law derivations, reagents and short revision pages.',
    about: [
      'The International Chemistry Olympiad (IChO) is held every summer. Each country sends a team of up to four school students, who sit two five-hour exams, one theoretical and one practical.',
      'The host nation must publish preparatory problems in advance, which set out the advanced topics that may come up beyond the common syllabus.',
    ],
    tips: [
      'Plan your attack in Approach mode, and derive rate laws in Mechanisms; any of the library formulas could come up.',
      'Reviewing what Progress marks as due each day.',
      'At university level, K is unitless: see the Book page on Kc, Kp and activities for why. Functionally, just use bar for Kp and M for Kc.',
    ],
  },
};

export const GUIDE_LIST: readonly Guide[] = LEVEL_IDS.map((l) => GUIDES[l]);
export const guidePath = (g: Guide) => `/guides/${g.slug}`;
export const guideBySlug = new Map(GUIDE_LIST.map((g) => [g.slug, g]));

