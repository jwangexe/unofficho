/**
 * Which Book page derives which formula (a page's `derives` frontmatter). Reads frontmatter
 * only, so Calculations can link to a derivation without loading the Book.
 */
import type { LevelId } from '../levels';

interface Frontmatter {
  id: string;
  title: string;
  stub?: boolean;
  derives?: string[];
  levels: LevelId[];
}

const frontmatter = import.meta.glob<Frontmatter>('./*/*.mdx', { eager: true, import: 'frontmatter' });

export interface DerivationRef {
  pageId: string;
  title: string;
}

const byFormula = new Map<string, DerivationRef>();
for (const fm of Object.values(frontmatter)) {
  if (fm.stub) continue;
  for (const f of fm.derives ?? []) byFormula.set(f, { pageId: fm.id, title: fm.title });
}

/** The Book page that derives a formula, if one does. */
export const derivationFor = (formulaId: string): DerivationRef | undefined => byFormula.get(formulaId);
