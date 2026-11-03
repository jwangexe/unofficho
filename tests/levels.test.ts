/**
 * Level scope checks: every item is tagged with at least one level, and everything a
 * student needs for it (formulas, topic, reagent, mode) is in scope at each of its levels.
 */
import { describe, expect, it } from 'vitest';
import { reactItems, reagentById, reagents } from '@/data';
import { bookPages } from '@/data/book';
import { LEVEL_IDS, LEVELS, formulaInScope, reagentInScope, reagentLevels, topicInScope, type LevelId } from '@/data/levels';
import { MECHANISMS } from '@/data/mechanisms';
import { CALC_TEMPLATES, CASE_PARTS, PROBLEMS } from '@/data/templates';
import { FORMULAS } from '@/engine/formulas';
import { isFormulaNode } from '@/engine/graph';
import type { CalcTemplate } from '@/engine/template';

const templates = [...CALC_TEMPLATES, ...PROBLEMS, ...CASE_PARTS];
const formulaIds = new Set(FORMULAS.map((f) => f.id));


/** Formulas a student must use: the reference chain only (misconceptions and setup are internal). */
const studentFormulas = (t: CalcTemplate) => [...new Set(t.reference.filter(isFormulaNode).map((n) => n.formula))];

describe('level scopes', () => {
  it('only name formulas and reagents that exist', () => {
    for (const l of LEVEL_IDS) {
      const s = LEVELS[l];
      if (s.formulas !== 'all') for (const f of s.formulas) expect(formulaIds.has(f), `${l}: formula ${f}`).toBe(true);
      if (s.reagents !== 'all') for (const r of s.reagents) expect(reagentById.has(r), `${l}: reagent ${r}`).toBe(true);
    }
  });

  it('form a ladder: each level’s formulas include the level below’s, up to UKChO Round 1', () => {
    const order: LevelId[] = ['alevel', 'c3l6', 'ukcho1'];
    for (let i = 1; i < order.length; i++) {
      const lower = LEVELS[order[i - 1]!].formulas as string[];
      for (const f of lower) expect(formulaInScope(order[i]!, f), `${order[i]} lacks ${f}`).toBe(true);
    }
  });
});

describe('every item is tagged, and in scope for each of its levels', () => {
  it('calculation templates: every reference formula and the topic are in scope', () => {
    for (const t of templates) {
      const levels = t.levels;
      expect(levels.length, `${t.id} has no levels`).toBeGreaterThan(0);
      for (const l of levels) {
        expect(topicInScope(l, t.topic), `${t.id}: topic ${t.topic} not in ${l}`).toBe(true);
        for (const f of studentFormulas(t)) expect(formulaInScope(l, f), `${t.id}: formula ${f} not in ${l}`).toBe(true);
      }
      for (const l of Object.keys(t.difficultyByLevel ?? {}) as LevelId[]) expect(levels, `${t.id}: difficultyByLevel names ${l}`).toContain(l);
    }
  });

  it('case studies only at levels that show the Case studies mode', () => {
    for (const t of CASE_PARTS) for (const l of t.levels) expect(LEVELS[l].modes.calc, `${t.id}: ${l} has no Case studies mode`).toContain('case');
  });

  it('mechanisms', () => {
    for (const m of MECHANISMS) {
      const levels = m.levels;
      expect(levels.length, m.id).toBeGreaterThan(0);
      for (const l of levels) expect(LEVELS[l].modes.calc, `${m.id}: ${l} has no Mechanisms mode`).toContain('mechanisms');
    }
  });

  it('reagents: tagged with exactly the levels whose scope lists them, with the topic in scope', () => {
    for (const r of reagents) {
      const levels = r.levels;
      expect(levels, `${r.id}: levels should match the scope files`).toEqual(reagentLevels(r.id));
      expect(levels.length, `${r.id} is in no level’s scope`).toBeGreaterThan(0);
      for (const l of levels) {
        expect(reagentInScope(l, r.id), `${r.id}: not in ${l}’s reagent list`).toBe(true);
        expect(topicInScope(l, r.topic), `${r.id}: topic ${r.topic} not in ${l}`).toBe(true);
      }
    }
  });

  it('"Will it react?" items: the reagent is in scope at every level of the item', () => {
    for (const x of reactItems) {
      const levels = x.levels;
      expect(levels.length, x.id).toBeGreaterThan(0);
      for (const l of levels) {
        expect(reagentInScope(l, x.reagentId), `${x.id}: reagent ${x.reagentId} not in ${l}`).toBe(true);
        expect(LEVELS[l].modes.reagents, `${x.id}: ${l} has no "Will it react?" mode`).toContain('react');
      }
    }
  });

  it('Book pages: the section is in scope at every level', () => {
    for (const p of bookPages) {
      const levels = p.levels;
      expect(levels.length, p.id).toBeGreaterThan(0);
      for (const l of levels) expect(topicInScope(l, `${p.chapter}/${p.section}`), `${p.id}: section not in ${l}`).toBe(true);
    }
  });
});
