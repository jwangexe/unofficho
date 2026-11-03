/**
 * Build-time pre-rendering (run by scripts/prerender.ts after `vite build`). Each public page
 * gets its own HTML file with real text and links in it, so search engines and link previews
 * see content without running the app. When the app loads, React replaces this markup.
 */
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { APP_NAME } from '@/app/brand';
import { headTags, SITE_URL, STATIC_PAGES, type PageMeta } from '@/app/seo';
import { reagents } from '@/data';
import { BOOK_OUTLINE, bookPages, type BookPage } from '@/data/book';
import { LEVELS } from '@/data/levels';
import { CHAPTERS } from '@/data/schemas';
import { ALL_TEMPLATES } from '@/data/templates';
import About from '@/features/about/About';
import { BookPageView } from '@/features/book/BookPageView';
import { mdxComponents } from '@/features/book/mdx';
import { TOPIC_TAG } from '@/features/calc/topics';
import Home from '@/features/home/Home';
import { topicLabel } from '@/features/reagents/ReagentHeader';
import { Logo } from '@/ui/Logo';
import { Page } from '@/ui/Page';

export { headTags, SITE_URL };

export interface RenderedPage {
  meta: PageMeta;
  /** Markup for inside <div id="root">. */
  html: string;
}

const NAV: [string, string][] = [
  ['/', 'Home'],
  ['/book', 'Book'],
  ['/reagents', 'Reagents'],
  ['/calc', 'Calculations'],
  ['/about', 'About'],
];

/** A plain version of the app's frame: header, content, and links to every section. */
function Shell({ path, children }: { path: string; children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center border-b border-border bg-surface px-4">
          <Link to="/" className="py-3 text-lg">
            <Logo />
          </Link>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <nav aria-label="Main" className="flex justify-around border-t border-border bg-surface py-3 text-sm">
          {NAV.map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </MemoryRouter>
  );
}

const written = () => bookPages.filter((p) => !p.stub);

function BookIndex() {
  return (
    <Page title="Book">
      <p className="mb-4 text-muted">
        Short revision pages for chemistry olympiad students, written for a phone. Each one takes two to four minutes and ends with
        quick checks.
      </p>
      {CHAPTERS.map((c) => (
        <section key={c} className="mb-5">
          <h2 className="mb-1.5 font-semibold">{BOOK_OUTLINE[c].title} chemistry</h2>
          <ul className="space-y-1">
            {written()
              .filter((p) => p.chapter === c)
              .map((p) => (
                <li key={p.id}>
                  <Link to={`/book/${p.id}`} className="text-accent underline underline-offset-4">
                    {p.title}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}

function CalcIndex() {
  const topics = [...new Set(ALL_TEMPLATES.map((t) => t.topic))];
  return (
    <Page title="Calculations">
      <p className="mb-4 text-muted">
        Chemistry calculation practice for IChO, UKChO, C3L6 and A-Level. Every given value is a chip carrying its unit; you build
        the answer by applying formulas and operations, and the feedback shows where your route went wrong. Numbers are fresh every
        time.
      </p>
      {topics.map((topic) => (
        <section key={topic} className="mb-5">
          <h2 className="mb-1.5 font-semibold">{TOPIC_TAG[topic] ?? topic}</h2>
          <ul className="list-disc space-y-1 pl-5">
            {ALL_TEMPLATES.filter((t) => t.topic === topic).map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}

function ReagentIndex() {
  const topics = [...new Set(reagents.map((r) => r.topic))];
  return (
    <Page title="Reagents">
      <p className="mb-4 text-muted">
        A reagent drill for chemistry olympiads: classify each reagent by what it can do, answer one-tap questions at speed, and
        decide which groups react with it and which product forms.
      </p>
      {topics.map((topic) => (
        <section key={topic} className="mb-5">
          <h2 className="mb-1.5 font-semibold">{topicLabel(topic)}</h2>
          <p>{reagents.filter((r) => r.topic === topic).map((r) => r.name).join(' · ')}</p>
        </section>
      ))}
    </Page>
  );
}

/** Plain text of the page's first paragraph, for its meta description. */
function firstParagraph(page: BookPage): string {
  const { Content } = page;
  const html = renderToString(<Content components={mdxComponents} />);
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
    m[1]!
      // KaTeX writes each formula twice (MathML and HTML); keep the visible copy.
      .replace(/<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&#x27;|&#39;/g, '’')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  // The first real paragraph; one that only leads into an equation or list ("…:") reads badly alone.
  const text = paragraphs.find((p) => p.length > 60 && !p.endsWith(':')) ?? paragraphs[0] ?? page.title;
  if (text.length <= 158) return text;
  return `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`;
}

function bookMeta(page: BookPage): PageMeta {
  const path = `/book/${page.id}`;
  const description = firstParagraph(page);
  return {
    path,
    title: page.title,
    description,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: page.title,
      description,
      url: `${SITE_URL}${path}`,
      inLanguage: 'en-GB',
      isAccessibleForFree: true,
      learningResourceType: 'Revision notes',
      educationalLevel: page.levels.map((l) => LEVELS[l].name),
      about: `${BOOK_OUTLINE[page.chapter].title} chemistry`,
      timeRequired: `PT${page.minutes}M`,
      isPartOf: { '@type': 'WebSite', name: APP_NAME, url: `${SITE_URL}/` },
    },
  };
}

export function renderPages(): RenderedPage[] {
  const meta = (path: string) => STATIC_PAGES.find((p) => p.path === path)!;
  const render = (path: string, body: ReactNode) => renderToString(<Shell path={path}>{body}</Shell>);
  return [
    { meta: meta('/'), html: render('/', <Home />) },
    { meta: meta('/about'), html: render('/about', <About />) },
    { meta: meta('/book'), html: render('/book', <BookIndex />) },
    { meta: meta('/calc'), html: render('/calc', <CalcIndex />) },
    { meta: meta('/reagents'), html: render('/reagents', <ReagentIndex />) },
    ...written().map((p) => ({
      meta: bookMeta(p),
      html: render(
        `/book/${p.id}`,
        <Routes>
          <Route path="/book/:pageId" element={<BookPageView />} />
        </Routes>,
      ),
    })),
  ];
}
