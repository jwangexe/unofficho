import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { BOOK_OUTLINE, bookPageById, bookPages, sectionTitle } from '@/data/book';
import { FlagButton } from '@/ui/FlagButton';
import { Page } from '@/ui/Page';
import { Callout, F, mdxComponents, R } from './mdx';
import { QuickChecks } from './QuickChecks';

export function BookPageView() {
  const { pageId } = useParams();
  const page = pageId ? bookPageById.get(pageId) : undefined;

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0);
  }, [pageId]);

  if (!page) return <Navigate to="/book" replace />;
  const i = bookPages.indexOf(page);
  const prev = bookPages[i - 1];
  const next = bookPages[i + 1];
  const { Content } = page;
  const hasRelated = page.related.reagents.length + page.related.formulas.length > 0;

  return (
    <Page>
      <div className="-mx-2 flex items-center gap-1">
        <Link to="/book" className="flex min-h-11 min-w-0 flex-1 items-center px-2 text-sm text-muted">
          <span aria-hidden className="mr-1.5">←</span>
          <span className="truncate">
            {BOOK_OUTLINE[page.chapter].title} · {sectionTitle(page)}
          </span>
        </Link>
        <FlagButton itemId={`book:${page.id}`} section="book" context={page.title} />
      </div>

      <h1 className="mt-1 text-2xl leading-tight font-semibold">{page.title}</h1>
      <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
        <span>{page.stub ? 'Outline' : `${page.minutes} min read`}</span>
        {!page.reviewed && (
          <span className="text-muted/70" title="Not yet checked for accuracy">
            · unreviewed
          </span>
        )}
      </p>

      <article className="book-prose mt-2 text-[1.0625rem]">
        {page.stub ? (
          <>
            <Callout type="note" title="Not written yet">
              <p>This page is an outline. It will cover:</p>
            </Callout>
            <ul className="my-3 list-disc space-y-1.5 pl-5 leading-relaxed">
              {page.outline.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </>
        ) : (
          <Content components={mdxComponents} />
        )}
      </article>

      {hasRelated && (
        <section aria-labelledby="related-heading" className="mt-6">
          <h2 id="related-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Related
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {page.related.reagents.map((id) => (
              <span key={id} className="rounded-full bg-surface px-2 py-1">
                <R id={id} />
              </span>
            ))}
            {page.related.formulas.map((id) => (
              <span key={id} className="rounded-full bg-surface px-2 py-1">
                <F id={id} />
              </span>
            ))}
          </div>
        </section>
      )}

      <QuickChecks key={page.id} page={page} />

      <nav aria-label="Pages" className="mt-8 grid grid-cols-2 gap-2 text-sm">
        {prev ? (
          <Link to={`/book/${prev.id}`} className="flex min-h-14 flex-col justify-center rounded-xl bg-surface px-3 py-2">
            <span className="text-xs text-muted">← Previous</span>
            <span className="line-clamp-2">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/book/${next.id}`} className="flex min-h-14 flex-col justify-center rounded-xl bg-surface px-3 py-2 text-right">
            <span className="text-xs text-muted">Next →</span>
            <span className="line-clamp-2">{next.title}</span>
          </Link>
        )}
      </nav>
    </Page>
  );
}
