/**
 * Content schemas. Every data file under src/data is validated against these,
 * both at load time and in tests/content.test.ts. See CONTENT.md for examples.
 */
import { z } from 'zod';
import { LEVEL_IDS } from './levels/types';

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case');

/** Free-text notes for facts the author is unsure of — the JSON equivalent of a TODO(verify) comment. */
const todoVerify = z.array(z.string()).optional();

/** Levels an item belongs to (see src/data/levels). */
const levels = z.array(z.enum(LEVEL_IDS)).min(1);
const difficultyByLevel = z.partialRecord(z.enum(LEVEL_IDS), z.union([z.literal(1), z.literal(2), z.literal(3)])).optional();
/** Private note of what inspired an item (never shown). */
const sourceNote = z.string().optional();

// ---------- Reagents ----------

export const ROLES = [
  'oxidant',
  'reductant',
  'bronsted-acid',
  'bronsted-base',
  'lewis-acid',
  'lewis-base',
  'none',
] as const;
export const Role = z.enum(ROLES);
export type Role = z.infer<typeof Role>;

export const ROLE_LABELS: Record<Role, string> = {
  oxidant: 'Oxidising agent',
  reductant: 'Reducing agent',
  'bronsted-acid': 'Brønsted acid',
  'bronsted-base': 'Brønsted base',
  'lewis-acid': 'Lewis acid',
  'lewis-base': 'Lewis base / nucleophile',
  none: 'None of these',
};

export const Reagent = z
  .object({
    id,
    name: z.string().min(1),
    aliases: z.array(z.string()),
    formula: z.string().min(1),
    smiles: z.string().optional(),
    /** Roles this reagent is used for or clearly shows. Selecting all of them is full marks. */
    roles: z.array(Role).min(1),
    primaryRole: Role,
    /**
     * Defensible but not expected (e.g. hydride reagents as nucleophiles): picking these
     * is neither rewarded nor penalised.
     */
    alsoAccept: z.array(Role).optional(),
    /** Condition-dependent behaviour (e.g. H2O2, SO2), shown with the explanation. */
    context: z.string().optional(),
    strength: z
      .object({
        /** pKa of the conjugate acid, for bases. */
        pKaH: z.number().optional(),
        /** pKa, for acids. */
        pKa: z.number().optional(),
        /** Standard reduction potential (V) of the relevant couple. */
        E0: z.number().optional(),
        note: z.string().optional(),
      })
      .optional(),
    typicalUses: z.array(z.string()),
    chemoselectivity: z.array(z.string()),
    pitfalls: z.array(z.string()),
    topic: z.string(),
    reviewed: z.boolean(),
    levels,
    difficultyByLevel,
    sourceNote,
    todoVerify,
  })
  .refine((r) => r.roles.includes(r.primaryRole), {
    message: 'primaryRole must be one of roles',
  })
  .refine((r) => !r.roles.includes('none') || r.roles.length === 1, {
    message: '"none" cannot be combined with other roles',
  })
  .refine((r) => !(r.alsoAccept ?? []).some((x) => r.roles.includes(x) || x === 'none'), {
    message: 'alsoAccept must not repeat roles or include "none"',
  });
export type Reagent = z.infer<typeof Reagent>;

// ---------- "Will it react?" ----------

export const ReactItem = z.object({
  id,
  substrate: z.object({ name: z.string(), smiles: z.string() }),
  reagentId: id,
  /** Extra conditions shown with the reagent, e.g. "then H₃O⁺ workup". */
  conditions: z.string().optional(),
  groups: z.array(z.object({ name: z.string(), reacts: z.boolean() })).min(2),
  products: z
    .array(z.object({ smiles: z.string(), label: z.string(), correct: z.boolean() }))
    .min(3)
    .max(4)
    .refine((ps) => ps.filter((p) => p.correct).length === 1, { message: 'exactly one correct product' }),
  explanation: z.string(),
  topic: z.string(),
  reviewed: z.boolean(),
  levels,
  difficultyByLevel,
  sourceNote,
  todoVerify,
});
export type ReactItem = z.infer<typeof ReactItem>;

// ---------- Book ----------

export const CHAPTERS = ['physical', 'inorganic', 'organic', 'analytical'] as const;
export const Chapter = z.enum(CHAPTERS);
export type Chapter = z.infer<typeof Chapter>;

export const QuickCheck = z.discriminatedUnion('type', [
  z.object({
    id,
    type: z.literal('mcq'),
    prompt: z.string(),
    options: z.array(z.string()).min(2).max(5),
    answer: z.number().int().nonnegative(),
    explanation: z.string(),
  }),
  z.object({
    id,
    type: z.literal('reveal'),
    prompt: z.string(),
    answer: z.string(),
  }),
]);
export type QuickCheck = z.infer<typeof QuickCheck>;

export const BookPageMeta = z
  .object({
    id,
    chapter: Chapter,
    /** Section id within the chapter (see data/book/outline.ts). */
    section: id,
    order: z.number(),
    title: z.string(),
    /** Estimated reading time on a phone. */
    minutes: z.number().positive().default(2),
    related: z
      .object({
        reagents: z.array(id).default([]),
        formulas: z.array(id).default([]),
      })
      .default({ reagents: [], formulas: [] }),
    /** Formulas this page derives: questions using them link here. */
    derives: z.array(id).default([]),
    quickChecks: z.array(QuickCheck).max(3).default([]),
    /** Stub pages have a title and outline only. */
    stub: z.boolean().default(false),
    outline: z.array(z.string()).default([]),
    reviewed: z.boolean(),
    levels,
    difficultyByLevel,
    sourceNote,
    todoVerify,
  })
  .refine((p) => p.stub || p.quickChecks.length >= 2, { message: 'complete pages need 2–3 quick checks' })
  .refine((p) => !p.stub || p.outline.length > 0, { message: 'stub pages need an outline' })
  .refine((p) => new Set(p.quickChecks.map((q) => q.id)).size === p.quickChecks.length, {
    message: 'quick-check ids must be unique within a page',
  })
  .refine((p) => p.quickChecks.every((q) => q.type !== 'mcq' || q.answer < q.options.length), {
    message: 'mcq answer index out of range',
  });
export type BookPageMeta = z.infer<typeof BookPageMeta>;
