import { Link } from 'react-router';
import { bookPageById } from '@/data/book';
import { mdxComponents } from './mdx';

/** A Book page's text, for showing in a sheet over another screen (loaded on demand). */
export default function DerivationContent({ pageId }: { pageId: string }) {
  const page = bookPageById.get(pageId);
  if (!page) return null;
  const { Content } = page;
  return (
    <>
      <article className="book-prose text-[1.0625rem]">
        <Content components={mdxComponents} />
      </article>
      <Link to={`/book/${page.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">
        Open in the Book, with quick checks
      </Link>
    </>
  );
}
