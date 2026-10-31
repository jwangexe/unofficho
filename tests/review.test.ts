import { describe, expect, it } from 'vitest';
import { reactItems, reagents } from '@/data';
import { bookPages } from '@/data/book';
import { ALL_TEMPLATES } from '@/data/templates';
import { FORMULAS } from '@/engine/formulas';
import { locate, markInSource, type ReviewKind } from '../scripts/review';

const root = process.cwd();

describe('review write-back', () => {
  it('edits only the flag of the named item', () => {
    const src = `[\n  {\n    "id": "a",\n    "reviewed": false\n  },\n  {\n    "id": "b",\n    "reviewed": false\n  }\n]\n`;
    const res = markInSource(src, 'reagent', 'b');
    expect(res.ok && res.text).toBe(src.replace(/("b",\n {4}"reviewed": )false/, '$1true'));
  });

  it('does not run past the next item when an item has no flag', () => {
    const src = `export const x = [\n  {\n    id: 'a',\n    nodes: [{ id: 'k' }],\n  },\n  {\n    id: 'b',\n    reviewed: false,\n  },\n];\n`;
    expect(markInSource(src, 'template', 'a').ok).toBe(false);
    expect(markInSource(src, 'template', 'b').ok).toBe(true);
  });

  it('edits book frontmatter, not body text', () => {
    const src = '---\nid: p\ntitle: T\nreviewed: false\n---\n\nreviewed: false\n';
    const res = markInSource(src, 'book', 'p');
    expect(res.ok && res.text).toBe('---\nid: p\ntitle: T\nreviewed: true\n---\n\nreviewed: false\n');
  });

  it('can locate every unreviewed item except formulas generated in code', () => {
    const items: [ReviewKind, string][] = [
      ...bookPages.filter((p) => !p.reviewed).map((p) => ['book', p.id] as [ReviewKind, string]),
      ...reagents.filter((r) => !r.reviewed).map((r) => ['reagent', r.id] as [ReviewKind, string]),
      ...reactItems.filter((r) => !r.reviewed).map((r) => ['react', r.id] as [ReviewKind, string]),
      ...FORMULAS.filter((f) => !f.reviewed).map((f) => ['formula', f.id] as [ReviewKind, string]),
      ...ALL_TEMPLATES.filter((t) => !t.reviewed).map((t) => ['template', t.id] as [ReviewKind, string]),
    ];
    const failed = items
      .filter(([kind, id]) => {
        const hit = locate(root, kind, id);
        return !hit || !markInSource(hit.source, kind, id).ok;
      })
      .map(([, id]) => id);
    expect(failed.sort()).toEqual(['weak-acid-approx', 'weak-acid-exact', 'weak-base-approx', 'weak-base-exact']);
  });
});
