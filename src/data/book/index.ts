/**
 * Book registry. Each page is an MDX file in ./<chapter>/; its YAML frontmatter is the
 * page's metadata (validated against BookPageMeta) and its body is the page content.
 * Drop a new .mdx file into a chapter folder and it is picked up automatically.
 */
import type { MDXContent } from 'mdx/types';
import { z } from 'zod';
import { formulaById } from '@/engine/formulas';
import { reagentById } from '../index';
import { BookPageMeta, CHAPTERS, type Chapter } from '../schemas';
import { BOOK_OUTLINE } from './outline';

export { BOOK_OUTLINE };

export interface BookPage extends BookPageMeta {
  Content: MDXContent;
  /** Source path relative to src/data/book, for error messages and the review page. */
  path: string;
}

// Eager: pages are short, and the whole Book route is already its own lazy chunk.
const modules = import.meta.glob<{ default: MDXContent; frontmatter?: unknown }>('./*/*.mdx', { eager: true });

function loadPages(): BookPage[] {
  const pages: BookPage[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const parsed = BookPageMeta.safeParse(mod.frontmatter);
    if (!parsed.success) throw new Error(`Invalid frontmatter in book/${path.slice(2)}:\n${z.prettifyError(parsed.error)}`);
    const meta = parsed.data;
    const folder = path.split('/')[1] as Chapter;
    const where = `book/${path.slice(2)}`;
    if (meta.chapter !== folder) throw new Error(`${where}: chapter "${meta.chapter}" but file is in ${folder}/`);
    if (!BOOK_OUTLINE[meta.chapter].sections.some((s) => s.id === meta.section)) {
      throw new Error(`${where}: unknown section "${meta.section}"`);
    }
    for (const r of meta.related.reagents) if (!reagentById.has(r)) throw new Error(`${where}: unknown reagent ${r}`);
    for (const f of meta.related.formulas) if (!formulaById.has(f)) throw new Error(`${where}: unknown formula ${f}`);
    pages.push({ ...meta, Content: mod.default, path: path.slice(2) });
  }
  const ids = new Set<string>();
  for (const p of pages) {
    if (ids.has(p.id)) throw new Error(`Duplicate book page id ${p.id}`);
    ids.add(p.id);
  }
  return sortPages(pages);
}

const sectionIndex = (p: BookPageMeta) => BOOK_OUTLINE[p.chapter].sections.findIndex((s) => s.id === p.section);

function sortPages(pages: BookPage[]): BookPage[] {
  return pages.sort(
    (a, b) =>
      CHAPTERS.indexOf(a.chapter) - CHAPTERS.indexOf(b.chapter) ||
      sectionIndex(a) - sectionIndex(b) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  );
}

/** All pages in reading order: chapter, then section, then `order`. */
export const bookPages: readonly BookPage[] = loadPages();
export const bookPageById = new Map(bookPages.map((p) => [p.id, p]));

/** Item id used for attempts, flags and spaced repetition. */
export const quickCheckItemId = (pageId: string, checkId: string) => `book:${pageId}:${checkId}`;

export const sectionTitle = (p: BookPageMeta) =>
  BOOK_OUTLINE[p.chapter].sections.find((s) => s.id === p.section)?.title ?? p.section;
