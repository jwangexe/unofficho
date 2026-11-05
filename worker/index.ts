/**
 * The Cloudflare Worker behind unofficho.org. Hashed build files under /assets/ go straight to the
 * assets layer; every other request reaches this code (see run_worker_first in wrangler.jsonc).
 *
 *   POST /api/suggestions   anyone: store a suggestion in D1
 *   GET  /api/suggestions   owner only (Authorization: Bearer <ADMIN_TOKEN>): list them
 *   GET  /api/admin/check   owner only: 204 if the password is right (used by /review)
 *
 * Anything else is a file from dist/ if there is one (pre-rendered pages included); else the app
 * shell for a client-only route; else dist/404.html with status 404.
 */
import { page } from './pages';
import { parseSuggestion } from './suggestions';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Set with `npx wrangler secret put ADMIN_TOKEN`; reading suggestions is disabled without it. */
  ADMIN_TOKEN?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

let tableReady: Promise<unknown> | null = null;
/** Create the table on first use, so no separate migration step is needed. */
const ensureTable = (db: D1Database) =>
  (tableReady ??= db
    .prepare(
      `CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        kind TEXT NOT NULL,
        message TEXT NOT NULL,
        name TEXT,
        page TEXT
      )`,
    )
    .run()
    .catch((e) => {
      tableReady = null;
      throw e;
    }));

/** Constant-time comparison, so the token cannot be guessed from response timing. */
function sameToken(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function suggestions(request: Request, env: Env): Promise<Response> {
  await ensureTable(env.DB);

  if (request.method === 'POST') {
    if (Number(request.headers.get('Content-Length') ?? 0) > 16_384) return json({ error: 'Too long.' }, 413);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Expected JSON.' }, 400);
    }
    const parsed = parseSuggestion(body);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const { kind, message, name, page } = parsed.value;
    await env.DB.prepare('INSERT INTO suggestions (kind, message, name, page) VALUES (?, ?, ?, ?)').bind(kind, message, name, page).run();
    return json({ ok: true }, 201);
  }

  if (request.method === 'GET') {
    const denied = requireOwner(request, env);
    if (denied) return denied;
    const { results } = await env.DB.prepare(
      'SELECT id, created_at, kind, message, name, page FROM suggestions ORDER BY id DESC LIMIT 500',
    ).all();
    return json({ suggestions: results });
  }

  return json({ error: 'Method not allowed.' }, 405);
}

/** null if the request carries the owner's password, else the error response to send. */
function requireOwner(request: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) return json({ error: 'Reading is disabled until ADMIN_TOKEN is set.' }, 503);
  if (!sameToken(request.headers.get('Authorization') ?? '', `Bearer ${env.ADMIN_TOKEN}`)) return json({ error: 'Wrong password.' }, 401);
  return null;
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/admin/check') return requireOwner(request, env) ?? new Response(null, { status: 204 });
      if (pathname === '/api/suggestions') return await suggestions(request, env);
      if (pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'Something went wrong on the server.' }, 500);
    }
    return page(request, env.ASSETS);
  },
} satisfies ExportedHandler<Env>;
