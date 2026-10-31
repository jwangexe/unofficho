/**
 * Content schemas. Every data file under src/data is validated against these,
 * both at load time and in tests/content.test.ts. See CONTENT.md for examples.
 */
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case');

/** Free-text notes for facts the author is unsure of — the JSON equivalent of a TODO(verify) comment. */
const todoVerify = z.array(z.string()).optional();

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
    roles: z.array(Role).min(1),
    primaryRole: Role,
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
    todoVerify,
  })
  .refine((r) => r.roles.includes(r.primaryRole), {
    message: 'primaryRole must be one of roles',
  })
  .refine((r) => !r.roles.includes('none') || r.roles.length === 1, {
    message: '"none" cannot be combined with other roles',
  });
export type Reagent = z.infer<typeof Reagent>;

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

export const BookPageMeta = z.object({
  id,
  chapter: Chapter,
  section: z.string(),
  order: z.number(),
  title: z.string(),
  topic: z.string(),
  related: z.object({
    reagents: z.array(id).default([]),
    formulas: z.array(id).default([]),
  }),
  quickChecks: z.array(QuickCheck).max(3),
  /** Stub pages have a title and outline only. */
  stub: z.boolean().default(false),
  reviewed: z.boolean(),
  todoVerify,
});
export type BookPageMeta = z.infer<typeof BookPageMeta>;
