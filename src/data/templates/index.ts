import { isFormulaNode } from '@/engine/graph';
import type { CalcTemplate } from '@/engine/template';
import { alevelAmountTemplates } from './alevel-amount';
import { c3l6Cases } from './c3l6-cases';
import type { CaseStudy } from '@/engine/caseStudy';
import { alevelEnergeticsTemplates } from './alevel-energetics';
import { electroTemplates } from './electro';
import { equilibriumTemplates } from './equilibrium';
import { kineticsTemplates } from './kinetics';
import { kineticsTemplates2 } from './kinetics2';
import { moreTemplates } from './more';
import { problems } from './problems';
import { thermoTemplates } from './thermo';

/** Single- and two-step parameterised questions for feed mode. */
export const CALC_TEMPLATES: readonly CalcTemplate[] = [
  ...thermoTemplates,
  ...kineticsTemplates,
  ...kineticsTemplates2,
  ...equilibriumTemplates,
  ...electroTemplates,
  ...moreTemplates,
  ...alevelEnergeticsTemplates,
  ...alevelAmountTemplates,
];

/** Hand-authored olympiad-style problems (4–8 operations) for multi-step mode. */
export const PROBLEMS: readonly CalcTemplate[] = problems;

export const ALL_TEMPLATES: readonly CalcTemplate[] = [...CALC_TEMPLATES, ...PROBLEMS];

/** Case studies (a stem and linked parts) for the Case studies mode. */
export const CASE_STUDIES: readonly CaseStudy[] = c3l6Cases;
/** Every case-study part: questions in their own right (progress, review), but only dealt as a case. */
export const CASE_PARTS: readonly CalcTemplate[] = CASE_STUDIES.flatMap((c) => c.parts);

export const calcTemplateById = new Map([...ALL_TEMPLATES, ...CASE_PARTS].map((t) => [t.id, t]));

/** Formula ids used by a template's reference solution. */
export const templateFormulas = (t: CalcTemplate) => [...new Set(t.reference.filter(isFormulaNode).map((n) => n.formula))];
