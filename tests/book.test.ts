import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import SmilesDrawer from 'smiles-drawer';
import { describe, expect, it } from 'vitest';
import { reagentById } from '@/data';
import { BOOK_OUTLINE, bookPages } from '@/data/book';
import { mechanismById } from '@/data/mechanisms';
import { CHAPTERS } from '@/data/schemas';
import { formulaById } from '@/engine/formulas';
import { mdxComponents } from '@/features/book/mdx';

const parses = (smiles: string) =>
  new Promise<boolean>((resolve) => SmilesDrawer.parse(smiles, () => resolve(true), () => resolve(false)));

const source = (path: string) => readFileSync(new URL(`../src/data/book/${path}`, import.meta.url), 'utf8');
const body = (path: string) => source(path).replace(/^---[\s\S]*?\n---\n/, '');
const attrs = (text: string, tag: string, attr: string) =>
  [...text.matchAll(new RegExp(`<${tag}\\b[^>]*?\\b${attr}="([^"]+)"`, 'g'))].map((m) => m[1]!);

const written = bookPages.filter((p) => !p.stub);

describe('book pages', () => {
  it('loads and validates every page', () => {
    expect(bookPages.length).toBeGreaterThan(20);
    expect(written.length).toBeGreaterThanOrEqual(6);
  });

  it('has a written page in every chapter and a page in every section', () => {
    for (const c of CHAPTERS) {
      expect(written.some((p) => p.chapter === c), c).toBe(true);
      for (const s of BOOK_OUTLINE[c].sections) expect(bookPages.some((p) => p.chapter === c && p.section === s.id), `${c}/${s.id}`).toBe(true);
    }
  });

  it('has a body for written pages and none for stubs', () => {
    for (const p of bookPages) expect(body(p.path).trim().length > 0, p.id).toBe(!p.stub);
  });

  it('links only to reagents and formulas that exist', () => {
    for (const p of written) {
      const text = body(p.path);
      for (const id of [...attrs(text, 'R', 'id'), ...attrs(text, 'Scheme', 'reagent')]) expect(reagentById.has(id), `${p.id}: ${id}`).toBe(true);
      for (const id of attrs(text, 'F', 'id')) expect(formulaById.has(id), `${p.id}: ${id}`).toBe(true);
      for (const id of attrs(text, 'Mechanism', 'id')) expect(mechanismById.has(id), `${p.id}: ${id}`).toBe(true);
    }
  });

  it('uses SMILES that parse', async () => {
    const all = written.flatMap((p) => {
      const text = body(p.path);
      return [...attrs(text, 'Smiles', 'smiles'), ...attrs(text, 'Scheme', 'from'), ...attrs(text, 'Scheme', 'to')].map((s) => [p.id, s] as const);
    });
    expect(all.length).toBeGreaterThan(0);
    for (const [id, s] of all) expect(await parses(s), `${id}: ${s}`).toBe(true);
  });

  it('keeps subscript underscores inside maths, where KaTeX can render them', () => {
    const stripMath = (t: string) => t.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$\n]*\$/g, '');
    for (const p of bookPages) {
      const strings = [body(p.path), ...p.quickChecks.flatMap((q) => Object.values(q).flat().filter((v) => typeof v === 'string'))];
      for (const s of strings) expect(stripMath(s), p.id).not.toMatch(/[A-Za-z0-9]_[A-Za-z0-9{]/);
    }
  });

  it('renders every written page without errors or KaTeX failures', () => {
    for (const p of written) {
      const html = renderToString(createElement(p.Content, { components: mdxComponents }));
      expect(html.length, p.id).toBeGreaterThan(500);
      expect(html, `${p.id} has a KaTeX error`).not.toContain('katex-error');
      expect(html, `${p.id} links to an unknown id`).not.toContain('[unknown');
      if (/^\|.*\|\s*$/m.test(body(p.path))) expect(html, `${p.id} has an unrendered table`).toContain('<table');
    }
  });
});
