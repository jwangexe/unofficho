import type { Attempt } from './db';

/** Item ids are namespaced by kind so that, e.g., a reagent and a template can share a slug. */
export const itemId = {
  reagent: (id: string) => `reagent:${id}`,
  react: (id: string) => `react:${id}`,
  calc: (templateId: string) => `calc:${templateId}`,
  book: (pageId: string, checkId: string) => `book:${pageId}:${checkId}`,
};

export type ItemKind = keyof typeof itemId;

export function parseItemId(id: string): { kind: ItemKind; id: string; sub?: string } | null {
  const [kind, rest, sub] = id.split(':');
  if (!rest || !kind || !(kind in itemId)) return null;
  return { kind: kind as ItemKind, id: rest, ...(sub && { sub }) };
}

/**
 * Attempts recorded before ids were namespaced used the bare reagent / react-item /
 * template id. Section and mode are enough to recover the kind.
 */
export function normaliseAttemptId<T extends Pick<Attempt, 'itemId' | 'section' | 'mode'>>(a: T): T {
  if (parseItemId(a.itemId)) return a;
  if (a.section === 'calc') return { ...a, itemId: itemId.calc(a.itemId) };
  if (a.section === 'reagents') return { ...a, itemId: a.mode === 'react' ? itemId.react(a.itemId) : itemId.reagent(a.itemId) };
  return a;
}
