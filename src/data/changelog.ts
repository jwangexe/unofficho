/**
 * The "What's new" page (/changelog). Add each new entry at the top: newest first.
 * `date` is YYYY-MM-DD; `text` is one or two plain sentences.
 */
export interface ChangelogEntry {
  date: string;
  text: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-11-05',
    text: 'Calculations: tables and formulas now open right under the question, and the chips stay pinned at the top as you scroll.',
  },
  { date: '2026-11-04', text: 'Guides to each competition, and a worked example for every question type.' },
  { date: '2026-11-03', text: 'Kc and Kp with units for A-Level, and a Book page on Kc, Kp and the unitless K.' },
  { date: '2026-11-03', text: 'First batches of UKChO Round 1 and Round 2 questions, and C3L6 case studies.' },
  { date: '2026-11-03', text: 'Levels: pick A-Level, C3L6, UKChO or IChO, with a short placement quiz.' },
  { date: '2026-11-01', text: 'Send a suggestion from the speech-bubble button at the top of every page.' },
  { date: '2026-10-31', text: 'Rad joins, with first-visit tours of Calculations and Mechanisms.' },
  { date: '2026-10-31', text: 'UnoffIChO launches: the Book, the reagent drill and the Calculations trainer.' },
];
