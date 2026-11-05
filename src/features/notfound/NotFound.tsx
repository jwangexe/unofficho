import { Link } from 'react-router';
import { Page } from '@/ui/Page';
import { Rad } from '@/ui/Rad';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

/** Any unknown address. The Worker serves this with HTTP 404 (dist/404.html, see scripts/prerender.ts). */
export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <Page>
      <div className="flex flex-col items-center pt-6 text-center">
        <Rad pose="wrong" size={140} />
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">There's nothing at this address. It may have moved, or the link may have a typo.</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-semibold text-accent-ink active:opacity-80"
        >
          Go to the homepage
        </Link>
      </div>
    </Page>
  );
}
