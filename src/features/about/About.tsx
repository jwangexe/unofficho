import { DISCLAIMER, DOMAIN } from '@/app/brand';
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
      <p className="mb-4 rounded-xl border border-warn/40 bg-surface p-4 text-sm">{DISCLAIMER}</p>
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        <p>
          A phone-first revision app for chemistry olympiad preparation. It has three parts: a short-page
          Book, a reagent classification drill, and a Calculations trainer where you build solutions
          from formula operations rather than typing numbers into a calculator.
        </p>
        <p>
          All content is original and stored on your device. Nothing you do is sent anywhere. Items
          marked "unreviewed" have not yet been checked for accuracy, so treat them with care and flag
          anything that looks wrong.
        </p>
        <p>{DOMAIN}</p>
      </div>
    </Page>
  );
}
