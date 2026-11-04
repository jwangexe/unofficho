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
    title: 'A-Level Chemistry calculation practice',
    description:
      'Free, interactive A-Level Chemistry practice (AQA): moles, energetics, Kc and Kp, rates, pH and cells, with worked examples and fresh numbers each time.',
    about: [
      'A-Level Chemistry is the two-year sixth-form course taken in Years 12 and 13 in England, Wales and Northern Ireland. The A-Level questions in UnoffIChO follow the AQA specification and stay inside it.',
      'It is also where every chemistry olympiad starts: the Cambridge Chemistry Challenge and the UK Chemistry Olympiad build on A-Level and then go further.',
    ],
    tips: [
      'Use Feed for short questions on mixed topics, and Exam when you want a timed run.',
      'Kc and Kp carry units at A-Level; the questions ask for them.',
      'Read the Book page on a topic first if a question type is new to you, then try its worked example.',
    ],
  },
  c3l6: {
    level: 'c3l6',
    slug: 'cambridge-chemistry-challenge-c3l6',
    title: 'Cambridge Chemistry Challenge (C3L6) practice',
    description:
      'Free practice for the Cambridge Chemistry Challenge Lower Sixth (C3L6): multi-part calculations built around one context, from A-Level and beyond.',
    about: [
      'The Cambridge Chemistry Challenge Lower Sixth (C3L6) is a written paper for Year 12 students, sat at school in the summer term. It starts from A-Level chemistry and goes well beyond the syllabus, explaining anything unfamiliar in the question itself.',
      'Questions are long and often built around one context, such as a mineral, a drug or an industrial process, with later parts using earlier answers.',
    ],
    tips: [
      'Case studies practise the longer C3L6 questions: several linked parts that share one story and one set of data.',
      'Multi-step questions train you to carry an answer from one step into the next.',
      'When a question explains a new idea, read it twice before reaching for a formula.',
    ],
  },
  ukcho1: {
    level: 'ukcho1',
    slug: 'uk-chemistry-olympiad-round-1',
    title: 'UK Chemistry Olympiad Round 1 practice',
    description:
      'Free, interactive practice for UK Chemistry Olympiad (UKChO) Round 1: thermodynamics, kinetics, electrochemistry and organic reagents beyond A-Level.',
    about: [
      'Round 1 of the UK Chemistry Olympiad (UKChO), run by the Royal Society of Chemistry, is a written paper for post-16 students, sat at school in late January.',
      'It expects A-Level chemistry and goes beyond it: entropy and Gibbs energy, rate laws and half-lives, the Nernst equation, and organic chemistry with reagents you may not have met in class. The best scorers are invited to Round 2.',
    ],
    tips: [
      'Approach mode asks you to plan a route before any numbers, which is most of the work in a Round 1 calculation.',
      'Drill reagents with Classify and Will it react? so the organic questions are about thinking, not recall.',
      'Exam mode times each question; Round 1 rewards working quickly and accurately.',
    ],
  },
  ukcho2: {
    level: 'ukcho2',
    slug: 'uk-chemistry-olympiad-round-2',
    title: 'UK Chemistry Olympiad Round 2 practice',
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
    title: 'International Chemistry Olympiad (IChO) practice',
    description:
      'Free, interactive International Chemistry Olympiad (IChO) practice: calculations, rate-law derivations, reagents and short revision pages.',
    about: [
      'The International Chemistry Olympiad (IChO) is held every July. Each country sends a team of up to four school students, who sit two exams of about five hours each, one theoretical and one practical.',
      'Each year’s host publishes preparatory problems in advance, which set out the advanced topics that may come up beyond the common syllabus.',
    ],
    tips: [
      'Plan routes in Approach mode, then derive rate laws in Mechanisms; every formula in the library is in scope.',
      'Keep missed questions coming back by reviewing what Progress marks as due each day.',
      'Unitless K matters here: the Book page on Kc, Kp and activities shows why.',
    ],
  },
};

export const GUIDE_LIST: readonly Guide[] = LEVEL_IDS.map((l) => GUIDES[l]);
export const guidePath = (g: Guide) => `/guides/${g.slug}`;
export const guideBySlug = new Map(GUIDE_LIST.map((g) => [g.slug, g]));

