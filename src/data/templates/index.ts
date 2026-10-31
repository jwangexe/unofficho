import { isFormulaNode } from '@/engine/graph';
import type { CalcTemplate } from '@/engine/template';
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
];

/** Hand-authored olympiad-style problems (4–8 operations) for multi-step mode. */
export const PROBLEMS: readonly CalcTemplate[] = problems;

export const ALL_TEMPLATES: readonly CalcTemplate[] = [...CALC_TEMPLATES, ...PROBLEMS];
export const calcTemplateById = new Map(ALL_TEMPLATES.map((t) => [t.id, t]));

/** Formula ids used by a template's reference solution. */
export const templateFormulas = (t: CalcTemplate) => [...new Set(t.reference.filter(isFormulaNode).map((n) => n.formula))];
