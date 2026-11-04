import { AUTHOR, DISCLAIMER, DOMAIN, NOT_AFFILIATED } from '@/app/brand';
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
      <div className="mb-4 space-y-2 rounded-xl border border-warn/40 bg-surface p-4 text-sm">
        <p>{DISCLAIMER}</p>
        <p>{NOT_AFFILIATED}</p>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        <p>
          A phone-first revision app for chemistry olympiad preparation. It has three parts: a short-page
          Book, a reagent classification drill, and a Calculations trainer where you build solutions
          from formula operations rather than typing numbers into a calculator.
        </p>
        <p>
          All content is original and your progress is stored on your device. Nothing you do is sent anywhere,
          except a suggestion when you choose to send one (the speech-bubble button at the top). Items
          marked "unreviewed" have not yet been checked for accuracy, so treat them with care and flag
          anything that looks wrong.
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
        <p>{DOMAIN}</p>
      </div>
    </Page>
  );
}
