/**
 * After `vite build`: write a pre-rendered HTML file for each public page (Home, About, the
 * section pages and every written Book page), each with its own title, description, canonical
 * link and structured data, plus sitemap.xml. Uses Vite's SSR loader so MDX, path aliases and
 * the rest of the app's build setup apply. See src/prerender.tsx.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const DIST = 'dist';
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });

try {
  const mod = await server.ssrLoadModule('/src/prerender.tsx');
  const template = readFileSync(join(DIST, 'index.html'), 'utf8');
  if (!/<!-- seo:start[\s\S]*?seo:end -->/.test(template) || !template.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html is missing the seo markers or the empty root element');
  }

  const pages: { meta: { path: string }; html: string }[] = mod.renderPages();
  for (const { meta, html } of pages) {
    const out = template
      .replace(/<!-- seo:start[\s\S]*?seo:end -->/, mod.headTags(meta))
      // data-path lets index.html, which is also served for routes that are not pre-rendered,
      // drop the home page's markup before it paints on those routes (see index.html).
      .replace('<div id="root"></div>', `<div id="root" data-path="${meta.path}">${html}</div>`);
    // "/book/vsepr" is served from book/vsepr.html (Cloudflare and `vite preview` both look there).
    const file = meta.path === '/' ? 'index.html' : `${meta.path.slice(1)}.html`;
    mkdirSync(dirname(join(DIST, file)), { recursive: true });
    writeFileSync(join(DIST, file), out);
  }

  // Unknown addresses: the Worker answers with this page and status 404. Stub Book pages get the bare app shell, so
  // only addresses with no file at all are 404s. Neither is for search engines.
  const noindex = (title: string) => `<title>${title} · ${mod.APP_NAME}</title>\n    <meta name="robots" content="noindex" />`;
  writeFileSync(
    join(DIST, '404.html'),
    template
      .replace(/<!-- seo:start[\s\S]*?seo:end -->/, noindex('Page not found'))
      .replace('<div id="root"></div>', `<div id="root" data-path="/404">${mod.renderNotFound()}</div>`),
  );
  const stubs: string[] = mod.stubBookPaths();
  for (const path of stubs) {
    writeFileSync(join(DIST, `${path.slice(1)}.html`), template.replace(/<!-- seo:start[\s\S]*?seo:end -->/, noindex('Book')));
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.map(({ meta }) => `  <url><loc>${mod.SITE_URL}${meta.path}</loc><lastmod>${today}</lastmod></url>`);
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  );
  console.log(`prerender: ${pages.length} pages, ${stubs.length} Book stubs, 404.html and sitemap.xml`);
} finally {
  await server.close();
}
