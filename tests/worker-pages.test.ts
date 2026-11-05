import { describe, expect, it } from 'vitest';
import { page } from '../worker/pages';

/** A stand-in for the assets layer: these files exist, everything else is a 404. */
const FILES: Record<string, string> = { '/': 'home', '/about': 'about', '/book/vsepr': 'vsepr', '/404': 'not found' };
const assets = {
  fetch: async (req: Request) => {
    const path = new URL(req.url).pathname;
    return path in FILES ? new Response(FILES[path], { status: 200 }) : new Response('', { status: 404 });
  },
};

const get = async (path: string, method = 'GET') => {
  const res = await page(new Request(`https://unofficho.org${path}`, { method }), assets);
  return [res.status, await res.text()] as const;
};

describe('Worker page routing', () => {
  it('serves files that exist as they are', async () => {
    expect(await get('/about')).toEqual([200, 'about']);
    expect(await get('/book/vsepr')).toEqual([200, 'vsepr']);
  });

  it('serves the app shell for client-only routes', async () => {
    for (const p of ['/calc', '/calc/anything', '/reagents/react', '/progress', '/settings', '/review'])
      expect(await get(p)).toEqual([200, 'home']);
  });

  it('answers unknown addresses with the 404 page and status 404', async () => {
    for (const p of ['/nope', '/book/nope', '/practice/nope', '/calculator', '/settings-old'])
      expect(await get(p)).toEqual([404, 'not found']);
  });

  it('leaves non-page methods alone', async () => {
    expect((await get('/nope', 'POST'))[0]).toBe(404);
  });
});
