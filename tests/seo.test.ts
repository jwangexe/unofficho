import { describe, expect, it } from 'vitest';
import { headTags } from '@/app/seo';
import { bookPages } from '@/data/book';
import { renderPages } from '@/prerender';

describe('pre-rendered pages', () => {
  const pages = renderPages();

  it('cover the public sections and every written Book page', () => {
    const paths = pages.map((p) => p.meta.path);
    for (const p of ['/', '/about', '/book', '/calc', '/reagents']) expect(paths).toContain(p);
    for (const p of bookPages.filter((b) => !b.stub)) expect(paths).toContain(`/book/${p.id}`);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('each have a unique title, a description of search-result length, and real content', () => {
    expect(new Set(pages.map((p) => p.meta.title)).size).toBe(pages.length);
    for (const { meta, html } of pages) {
      expect(meta.description.length, meta.path).toBeGreaterThan(50);
      expect(meta.description.length, meta.path).toBeLessThanOrEqual(160);
      // Plain text: no HTML tags or LaTeX commands (a bare "<" is fine; it is escaped in the head).
      expect(meta.description, meta.path).not.toMatch(/<[a-z/]|\\[a-z]+/);
      expect(html.replace(/<[^>]+>/g, '').length, meta.path).toBeGreaterThan(300);
      // Links in the markup are what let crawlers find the other pages.
      expect(html, meta.path).toContain('href="/book"');
    }
  });

  it('escape text in the head and keep JSON-LD from closing its script element', () => {
    const tags = headTags({ path: '/x', title: 'A "quoted" <title>', description: 'd & e', jsonLd: { name: '</script><b>' } });
    expect(tags).toContain('<title>A &quot;quoted&quot; &lt;title&gt; · UnoffIChO</title>');
    expect(tags).toContain('content="d &amp; e"');
    expect(tags).toContain('<link rel="canonical" href="https://unofficho.org/x" />');
    expect(tags).not.toContain('</script><b>');
  });
});
