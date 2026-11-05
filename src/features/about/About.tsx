import { AUTHOR, DOMAIN } from '@/app/brand';
import { Link } from 'react-router';
import { Logo } from '@/ui/Logo';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

export default function About() {
  useDocumentTitle('About');
  return (
    <Page>
      <h1 className="mb-4 text-3xl">
        <Logo />
      </h1>
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        <p>
          An on-the-go revision app for chemistry olympiad preparation. It allows you to: classify reagents, and train calculations by building solutions
          from number tiles and formula operations.
        </p>
        <h2 className="pt-2 text-base font-semibold text-text">Who made it</h2>
        <p>
          UnoffIChO is made by <strong className="font-semibold text-text">{AUTHOR.name}</strong>, {AUTHOR.credentials}, with
          interests in {AUTHOR.interests}.
        </p>
        <p>
          New here? Start with the{' '}
          <Link to="/guides" className="text-accent underline underline-offset-4">
            guide to your competition
          </Link>
          .
        </p>
        <p>
          See{' '}
          <Link to="/changelog" className="text-accent underline underline-offset-4">
            what's new
          </Link>
          , and the{' '}
          <Link to="/credits" className="text-accent underline underline-offset-4">
            reviewers who check the content
          </Link>
          .
        </p>
        <p>{DOMAIN}</p>
      </div>
    </Page>
  );
}
