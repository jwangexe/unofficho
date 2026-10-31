/** First-visit tutorials for Calculations and Mechanisms, presented by Rad. */
import type { TourStep } from '@/ui/Tutorial';

export const CALC_TOUR: TourStep[] = [
  {
    pose: 'idle',
    title: 'Hi, I’m Rad',
    text: 'A free radical with one unpaired electron (that’s it floating above me). Let me show you how Calculations works. It takes a minute.',
  },
  {
    pose: 'pointing',
    target: 'question',
    title: 'Read the question',
    text: 'Each card is one problem. The numbers are new every time, so you can’t just remember answers.',
  },
  {
    pose: 'pointing',
    target: 'givens',
    title: 'Your data are chips',
    text: 'Every given value is a chip with its unit. You never type numbers: you build the answer out of these.',
  },
  {
    pose: 'pointing',
    target: 'actions',
    title: 'Apply an operation',
    text: 'Tap + Operation and pick a formula (like ΔG = ΔH − TΔS) or some maths (×, ÷, ln…). Choose what to solve for, then tap chips into the slots. Units are converted for you.',
  },
  {
    pose: 'thinking',
    target: 'givens',
    title: 'Results become chips',
    text: 'Each step adds a new chip under the givens, ready for the next step. Undo takes back the last step if you change your mind.',
  },
  {
    pose: 'correct',
    target: 'actions',
    title: 'Submit your answer',
    text: 'When a chip holds the answer, tap it and press Submit. If it’s wrong, I’ll point out where the route went astray, such as a missed unit or a classic misconception.',
  },
  {
    pose: 'thinking',
    target: 'explain',
    title: 'Stuck?',
    text: 'Explain shows a worked route. You can still have a go afterwards. The flag reports a question that looks wrong.',
  },
  {
    pose: 'celebrating',
    target: 'modes',
    title: 'Pick your mode',
    text: 'Feed for quick questions, Approach to plan without numbers, Multi-step for olympiad-length problems, Exam for timed practice with strict units, and Mechanisms for deriving rate laws. Swipe up for the next card. Tap ? any time to see this again.',
  },
];

export const MECHANISMS_TOUR: TourStep[] = [
  {
    pose: 'idle',
    title: 'Mechanisms',
    text: 'Here you derive rate laws from elementary steps, with no memorising. Steady state and pre-equilibrium are just bookkeeping, and I’ll check every line.',
  },
  {
    pose: 'pointing',
    target: 'scheme',
    title: 'The mechanism',
    text: 'These are the elementary steps, with rate constants on the arrows. Each step’s rate is k times the concentrations of its reactants.',
  },
  {
    pose: 'pointing',
    target: 'style',
    title: 'Derive it, or pick it',
    text: 'Derive it walks you through the algebra. Pick the rate law is the quick version, for when you just want to check you know the answer.',
  },
  {
    pose: 'thinking',
    target: 'equations',
    title: '1. Write the equations',
    text: 'For each intermediate in steady state, give every step’s rate term a coefficient: + if the step forms it, − if it uses it up, ×2 if two form or go at once. For a pre-equilibrium, forward rate = backward rate.',
  },
  {
    pose: 'thinking',
    title: '2. Solve by substitution',
    text: 'Pick an intermediate and tap terms onto the top or bottom of its fraction. I’ll circle anything in the wrong place, then substitute your result into whatever is left.',
  },
  {
    pose: 'correct',
    title: '3. The rate law',
    text: 'Finally choose the simplified rate law. Fewer slips on the way means a higher score, and missed mechanisms come back for review.',
  },
  {
    pose: 'celebrating',
    target: 'modes',
    title: 'Then explore',
    text: 'Afterwards, switch the approximations to see how the rate law and its limiting cases change. Tap ? to see this tour again.',
  },
];
