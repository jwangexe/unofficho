import { describe, expect, it } from 'vitest';
import { MECHANISMS, mechanismById } from '@/data/mechanisms';
import { sameValue } from '@/engine/algebra';
import { applySolve, checkEquation, checkSolve, equationTargets, finalRate, massBalanceTarget, solveStep, startWork, type WorkState } from '@/engine/derive';
import { allSymbols, derive, type Choice, type Mechanism } from '@/engine/mechanism';
import { rng } from '@/engine/template';

/** Every order in which the intermediates can be eliminated, solving each correctly. */
function routes(mech: Mechanism, work: WorkState, r: () => number): WorkState[] {
  if (work.equations.size === 0) return [work];
  const out: WorkState[] = [];
  for (const x of work.equations.keys()) {
    const step = solveStep(mech, work, x, r);
    if (!step) continue;
    const placed = Object.fromEntries(step.chips.map((c) => [c.key, c.place]));
    expect(checkSolve(step, placed)).toEqual([]);
    out.push(...routes(mech, applySolve(work, step), r));
  }
  return out;
}

describe('derive it yourself', () => {
  it('accepts the true equations and reaches the engine’s rate law by every route', () => {
    for (const mech of MECHANISMS) {
      for (const choice of mech.challenges) {
        for (const t of equationTargets(mech, choice)) expect(checkEquation(mech, t, t.coefficients), `${mech.id} ${t.species}`).toEqual([]);
        const done = routes(mech, startWork(mech, choice), rng(3));
        expect(done.length, `${mech.id} ${JSON.stringify(choice)}: no solvable route`).toBeGreaterThan(0);
        const want = derive(mech, choice);
        if (!want.ok) throw new Error(want.error);
        for (const w of done) expect(sameValue(finalRate(mech, w), want.rate, allSymbols(mech)), mech.id).toBe(true);
      }
    }
  });

  it('explains wrong signs, missing terms and missing factors of 2', () => {
    const lind = mechanismById.get('mech-lindemann')!;
    const [t] = equationTargets(lind, { ss: ['A*'], pe: [] });
    // Steps: forward activation (+1), deactivation (−1), reaction (−1).
    const issues = checkEquation(lind, t!, [1, 1, 0]);
    expect(issues.map((i) => i.index)).toEqual([1, 2]);
    expect(issues[0]!.message).toMatch(/negative/);
    expect(issues[1]!.message).toMatch(/belongs in the equation/);

    const no = mechanismById.get('mech-no-oxidation')!;
    const [n] = equationTargets(no, { ss: ['N2O2'], pe: [] });
    expect(n!.coefficients).toEqual([1, -1, -1]);
    const ozone = mechanismById.get('mech-ozone')!;
    const [o] = equationTargets(ozone, { ss: ['O'], pe: [] });
    expect(checkEquation(ozone, o!, [1, -1, -1])).toEqual([]);
    const hi = mechanismById.get('mech-hydrogen-iodine')!;
    const [h] = equationTargets(hi, { ss: ['I'], pe: [] });
    expect(checkEquation(hi, h!, [1, -1, -1])[0]!.message).toMatch(/coefficient is 2/);
  });

  it('accepts a pre-equilibrium written either way round', () => {
    const m = mechanismById.get('mech-consecutive')!;
    const [t] = equationTargets(m, { ss: [], pe: [0] });
    expect(checkEquation(m, t!, [1, -1, 0])).toEqual([]);
    expect(checkEquation(m, t!, [-1, 1, 0])).toEqual([]);
    expect(checkEquation(m, t!, [1, 1, 0])).toHaveLength(1);
  });

  it('asks for the mass balance only where there is a catalyst', () => {
    expect(massBalanceTarget(mechanismById.get('mech-michaelis-menten')!)).toMatchObject({ free: '[E]', parts: ['E0', '[ES]'], coefficients: [1, -1] });
    expect(massBalanceTarget(mechanismById.get('mech-lindemann')!)).toBeNull();
  });

  it('marks misplaced chips, including distractors that were used', () => {
    const m = mechanismById.get('mech-lindemann')!;
    const choice: Choice = { ss: ['A*'], pe: [] };
    const step = solveStep(m, startWork(m, choice), '[A*]', rng(1))!;
    expect(step.chips.some((c) => c.place === 'none')).toBe(true);
    const allTop = Object.fromEntries(step.chips.map((c) => [c.key, 'top' as const]));
    const wrong = checkSolve(step, allTop);
    expect(wrong.length).toBe(step.chips.filter((c) => c.place !== 'top').length);
  });
});
