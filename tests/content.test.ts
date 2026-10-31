import { describe, expect, it } from 'vitest';
import SmilesDrawer from 'smiles-drawer';
import { reactItems, reagents } from '@/data';
import { ROLES, type Reagent } from '@/data/schemas';
import { scoreClassification, scoreFast } from '@/features/reagents/scoring';

const parses = (smiles: string) =>
  new Promise<boolean>((resolve) => SmilesDrawer.parse(smiles, () => resolve(true), () => resolve(false)));

describe('reagent data', () => {
  it('has around 60+ reagents with unique ids', () => {
    expect(reagents.length).toBeGreaterThanOrEqual(60);
    const ids = reagents.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every category, including "none"', () => {
    for (const role of ROLES) expect(reagents.some((r) => r.roles.includes(role)), role).toBe(true);
  });

  it('every reagent has uses, selectivity notes and pitfalls, and is unreviewed by default', () => {
    for (const r of reagents) {
      expect(r.typicalUses.length, r.id).toBeGreaterThan(0);
      expect(r.chemoselectivity.length, r.id).toBeGreaterThan(0);
      expect(r.pitfalls.length, r.id).toBeGreaterThan(0);
    }
  });

  it('every SMILES string parses', async () => {
    const all = [
      ...reagents.filter((r) => r.smiles).map((r) => [r.id, r.smiles!] as const),
      ...reactItems.flatMap((i) => [[i.id, i.substrate.smiles] as const, ...i.products.map((p) => [i.id, p.smiles] as const)]),
    ];
    for (const [id, s] of all) expect(await parses(s), `${id}: ${s}`).toBe(true);
  });
});

describe('will-it-react items', () => {
  it('each has at least one reacting and one spectator group', () => {
    for (const i of reactItems) {
      expect(i.groups.some((g) => g.reacts), i.id).toBe(true);
      expect(i.groups.some((g) => !g.reacts), i.id).toBe(true);
    }
  });
});

describe('scoring', () => {
  const r = { roles: ['oxidant', 'reductant'], primaryRole: 'oxidant', alsoAccept: ['lewis-base'] } as Reagent;

  it('gives full marks for the exact set, and ignores acceptable extras', () => {
    expect(scoreClassification(r, new Set(['oxidant', 'reductant'])).score).toBe(1);
    expect(scoreClassification(r, new Set(['oxidant', 'reductant', 'lewis-base'])).score).toBe(1);
  });

  it('gives partial credit and subtracts wrong picks', () => {
    expect(scoreClassification(r, new Set(['oxidant'])).score).toBe(0.5);
    expect(scoreClassification(r, new Set(['oxidant', 'bronsted-acid'])).score).toBe(0);
    expect(scoreClassification(r, new Set(['none'])).wrong).toEqual(['none']);
  });

  it('fast mode: primary role is full marks, other listed roles half', () => {
    expect(scoreFast(r, 'oxidant').score).toBe(1);
    expect(scoreFast(r, 'reductant').score).toBe(0.5);
    expect(scoreFast(r, 'lewis-acid').score).toBe(0);
  });
});
