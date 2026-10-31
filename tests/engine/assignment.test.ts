import { describe, expect, it } from 'vitest';
import { formulaById } from '@/engine/formulas';
import { checkAssignment, solveFormula } from '@/engine/formula';
import { qty } from '@/engine/quantity';

const gibbs = formulaById.get('gibbs')!;

describe('slot checks', () => {
  it('accepts kJ in a slot whose default unit is J (auto conversion)', () => {
    const f = formulaById.get('first-law')!;
    expect(checkAssignment(f, 'q', qty(0.5, 'kJ'), {}).ok).toBe(true);
  });

  it('rejects a temperature in an entropy slot', () => {
    const res = checkAssignment(gibbs, 'dS', qty(298, 'K'), {});
    expect(!res.ok && res.error.code).toBe('dimension');
  });

  it('rejects ΔT in an absolute-temperature slot and T in a ΔT slot', () => {
    expect(checkAssignment(gibbs, 'T', qty(10, 'K', 'delta-temp'), {}).ok).toBe(false);
    const heat = formulaById.get('heat-mass')!;
    const res = checkAssignment(heat, 'dT', qty(298, 'K'), {});
    expect(!res.ok && res.error.code).toBe('kind');
  });

  it('accepts molar or extensive forms, but not a mix', () => {
    expect(checkAssignment(gibbs, 'dH', qty(-92.4, 'kJ'), {}).ok).toBe(true);
    const res = checkAssignment(gibbs, 'dS', qty(-198.3, 'J/(K mol)'), { dH: qty(-92.4, 'kJ') });
    expect(!res.ok && res.error.code).toBe('molar-mix');
  });

  it('extensive inputs give an extensive answer', () => {
    const res = solveFormula(gibbs, 'dG', { dH: qty(-92.4, 'kJ'), T: qty(298, 'K'), dS: qty(-198.3, 'J/K') });
    expect(res.ok && res.value.quantity.unit).toBe('kJ');
  });

  it('enforces matching units within an "any" group', () => {
    const f = formulaById.get('first-order')!;
    const res = checkAssignment(f, 'A', qty(50, 'kPa'), { A0: qty(0.1, 'mol/dm3') });
    expect(!res.ok && res.error.code).toBe('dimension');
  });

  it('rejects non-positive values in positive slots', () => {
    const res = checkAssignment(gibbs, 'T', qty(-5, 'K'), {});
    expect(!res.ok && res.error.code).toBe('domain');
  });
});
