/**
 * Dev-only write-back for the /review page: flips `reviewed: false` to `true` in the
 * source file that defines an item. Edits are textual so formatting and comments survive.
 *
 * Each kind of item has a set of source files and an "anchor" line that starts a
 * top-level item (its id at the item's own indentation). The flag changed is the first
 * `reviewed: false` after the anchor and before the next item's anchor.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export const REVIEW_KINDS = ['book', 'reagent', 'react', 'formula', 'template', 'mechanism'] as const;
export type ReviewKind = (typeof REVIEW_KINDS)[number];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface KindSpec {
  /** Directories (relative to the project root) and a filename test. */
  files: { dir: string; match: RegExp; recursive?: boolean }[];
  anchor: (id: string) => RegExp;
  /** Start of any item, to bound the search. */
  next: RegExp;
  flag: RegExp;
  replacement: string;
}

const json = { anchor: (id: string) => new RegExp(`^ {4}"id": "${esc(id)}",$`, 'm'), next: /^ {4}"id": "/m, flag: /"reviewed": false/, replacement: '"reviewed": true' };
const ts = { anchor: (id: string) => new RegExp(`^ {4}id: '${esc(id)}',$`, 'm'), next: /^ {4}id: '/m, flag: /\breviewed: false\b/, replacement: 'reviewed: true' };

const SPECS: Record<ReviewKind, KindSpec> = {
  // One page per file: the frontmatter id is the anchor, and the search stops at the closing ---.
  book: {
    files: [{ dir: 'src/data/book', match: /\.mdx$/, recursive: true }],
    anchor: (id) => new RegExp(`^id: ${esc(id)}$`, 'm'),
    next: /^---$/m,
    flag: /^reviewed: false$/m,
    replacement: 'reviewed: true',
  },
  reagent: { files: [{ dir: 'src/data/reagents', match: /\.json$/ }], ...json },
  react: { files: [{ dir: 'src/data', match: /^react-items\.json$/ }], ...json },
  formula: { files: [{ dir: 'src/engine/formulas', match: /\.ts$/ }], ...ts },
  template: { files: [{ dir: 'src/data/templates', match: /\.ts$/ }], ...ts },
  mechanism: { files: [{ dir: 'src/data', match: /^mechanisms\.ts$/ }], ...ts },
};

function listFiles(root: string, spec: KindSpec): string[] {
  return spec.files.flatMap(({ dir, match, recursive }) =>
    readdirSync(join(root, dir), { recursive: !!recursive, encoding: 'utf8' })
      .filter((f) => match.test(f.split('/').pop()!))
      .map((f) => join(root, dir, f)),
  );
}

export type EditResult = { ok: true; text: string } | { ok: false; error: string };

/** Pure text edit: mark one item reviewed within one file's source. */
export function markInSource(source: string, kind: ReviewKind, id: string): EditResult {
  const spec = SPECS[kind];
  const anchors = [...source.matchAll(new RegExp(spec.anchor(id).source, 'gm'))];
  if (anchors.length !== 1) return { ok: false, error: anchors.length ? `id "${id}" appears ${anchors.length} times` : `id "${id}" not found` };
  const start = anchors[0]!.index! + anchors[0]![0].length;
  const rest = source.slice(start);
  const end = rest.search(spec.next);
  const region = end === -1 ? rest : rest.slice(0, end);
  const flag = region.search(spec.flag);
  if (flag === -1) return { ok: false, error: `no "reviewed: false" found for "${id}"` };
  const at = start + flag;
  const match = region.slice(flag).match(spec.flag)![0];
  return { ok: true, text: source.slice(0, at) + spec.replacement + source.slice(at + match.length) };
}

/** Find the one file that defines the item; null if none does (e.g. generated in code). */
export function locate(root: string, kind: ReviewKind, id: string): { file: string; source: string } | null {
  const spec = SPECS[kind];
  const hits = listFiles(root, spec)
    .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
    .filter(({ source }) => spec.anchor(id).test(source));
  return hits.length === 1 ? hits[0]! : null;
}

export function markReviewed(root: string, kind: ReviewKind, id: string): { file: string } {
  const hit = locate(root, kind, id);
  if (!hit) throw new Error(`Could not find a single source for ${kind} "${id}". It may be generated in code: set its reviewed flag by hand.`);
  const res = markInSource(hit.source, kind, id);
  if (!res.ok) throw new Error(`${relative(root, hit.file)}: ${res.error}`);
  writeFileSync(hit.file, res.text);
  return { file: relative(root, hit.file) };
}

/** Vite plugin: POST /__unofficho/review { kind, id } during `vite dev` only. */
export function reviewPlugin() {
  return {
    name: 'unofficho-review',
    apply: 'serve' as const,
    configureServer(server: { config: { root: string }; middlewares: { use: (path: string, fn: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void) => void } }) {
      server.middlewares.use('/__unofficho/review', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'POST only' });
        let body = '';
        req.on('data', (c: Buffer) => (body += c));
        req.on('end', () => {
          try {
            const { kind, id } = JSON.parse(body) as { kind: ReviewKind; id: string };
            if (!REVIEW_KINDS.includes(kind) || typeof id !== 'string') return send(400, { error: 'bad request' });
            send(200, markReviewed(server.config.root, kind, id));
          } catch (e) {
            send(400, { error: e instanceof Error ? e.message : String(e) });
          }
        });
      });
    },
  };
}
