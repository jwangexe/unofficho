/** First-visit tutorial for Mechanisms, presented by Rad. Calculations uses the hints in onboarding.ts. */
import type { TourStep } from '@/ui/Tutorial';

export const MECHANISMS_TOUR: TourStep[] = [
  {
    pose: 'idle',
    title: 'Mechanisms',
    text: 'Here you derive rate laws from elementary steps.',
  },
  {
    pose: 'pointing',
    target: 'scheme',
    title: 'The mechanism',
    text: 'These are the elementary steps, with rate constants on the arrows. Each step’s rate is k times the reaction concentrations.',
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
    text: 'For each intermediate in steady state, give every step’s rate a coefficient: + if the step forms it, − if it uses it up, ×2 if two form or go at once.',
  },
  {
    pose: 'thinking',
    title: '2. Solve by substitution',
    text: 'Pick an intermediate and tap terms onto the top or bottom of its fraction. I’ll circle anything in the wrong place, then substitute your result into whatever is left.',
  },
  {
    pose: 'correct',
    title: '3. The rate law',
    text: 'Finally choose the simplified rate law.',
  },
  {
    pose: 'celebrating',
    target: 'modes',
    title: 'Then explore',
    text: 'You can switch the approximations to see how the rate law and its limiting cases change.',
  },
];
