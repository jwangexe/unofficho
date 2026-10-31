import type { Formula } from '../formula';
import { electro } from './electro';
import { equilibrium } from './equilibrium';
import { kinetics } from './kinetics';
import { other } from './other';
import { stoich } from './stoich';
import { thermo } from './thermo';

export const FORMULAS: readonly Formula[] = [...stoich, ...thermo, ...kinetics, ...equilibrium, ...electro, ...other];
export const formulaById = new Map(FORMULAS.map((f) => [f.id, f]));
