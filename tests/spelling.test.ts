import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderPages } from '@/prerender';

/**
 * US spellings that should not appear in the site's copy (British English throughout).
 * "Colorimetry" is the standard British spelling too, so plain "color" is matched as a whole word only.
 */
const US = [
  /\b(organiz|analyz|recogniz|realiz|minimiz|maximiz|optimiz|ioniz|neutraliz|polariz|stabiliz|crystalliz|hydrolyz|catalyz|vaporiz|summariz|memoriz|emphasiz|characteriz|utiliz|visualiz|categoriz|prioritiz)\w*/i,
  /\b(colors?|colored|favorite|behaviors?|gray|aluminum|liters?|centimeters?|millimeters?|decimeters?|fibers?|centers?|centered|defense|labeled|labeling|modeled|modeling|traveling|canceled|enrollment)\b/i,
  // "Practise" is the verb: "practising", "practised", "to practise".
  /\bpractic(ed|ing)\b|\b(to|you|can|will|should|must|and) practice\b/i,
];

const hits = (name: string, text: string) =>
  text.split('\n').flatMap((line, i) => US.filter((re) => re.test(line)).map((re) => `${name}:${i + 1}: ${line.match(re)![0]}`));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mdx|json)$/.test(p) ? [p] : [];
  });
}

/** The visible text of a pre-rendered page: no tags, attributes, styles or scripts. */
const visible = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&[a-z]+;/g, ' ');

describe('British spelling', () => {
  it('in every pre-rendered page', () => {
    expect(renderPages().flatMap(({ meta, html }) => hits(meta.path, visible(html)))).toEqual([]);
  });

  it('in the content files (questions, Book pages, reagents, copy)', () => {
    const found = ['src/data', 'src/content'].flatMap(files).flatMap((f) => hits(f, readFileSync(f, 'utf8')));
    expect(found).toEqual([]);
  });
});
