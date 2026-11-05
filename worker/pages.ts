/** Which page a request gets. Kept apart from index.ts, with no Cloudflare types, so the app's tests can import it. */

/** Routes the app draws in the browser, with no pre-rendered file. Every other page has one (scripts/prerender.ts). */
const APP_ROUTE = /^\/(calc|reagents|progress|settings|inbox|review|debug)(\/|$)/;

/** A file from dist/ if there is one; else the app shell for a client-only route; else dist/404.html with status 404. */
export async function page(request: Request, assets: { fetch: (request: Request) => Promise<Response> }): Promise<Response> {
  const res = await assets.fetch(request);
  if (res.status !== 404 || (request.method !== 'GET' && request.method !== 'HEAD')) return res;
  if (APP_ROUTE.test(new URL(request.url).pathname)) return assets.fetch(new Request(new URL('/', request.url), request));
  const missing = await assets.fetch(new Request(new URL('/404', request.url), request));
  return new Response(missing.body, { status: 404, headers: missing.headers });
}
