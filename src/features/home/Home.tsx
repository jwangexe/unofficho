import { Link } from 'react-router';
import { AUTHOR } from '@/app/brand';
import { Footer } from '@/ui/Footer';
import { Rad } from '@/ui/Rad';
import { useSuggest } from '../feedback/Suggest';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { TITLES } from '@/app/seo';
import { LEVELS } from '@/data/levels';
import { useLevelPrefs } from '../level/store';
import { GUIDE_LIST, guidePath } from '../guides/guides';

const pill = 'inline-flex min-h-10 items-center rounded-md bg-surface-2 px-3 text-sm font-medium active:opacity-70';
const link = 'font-semibold text-accent underline-offset-4 hover:underline';

export default function Home() {
  useDocumentTitle(TITLES.home);
  // Only the modes the student's level has.
  const { modes } = LEVELS[useLevelPrefs().level];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6">
      <section
        aria-labelledby="home-title"
        className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left"
      >
        <Rad pose="idle" size={176} className="shrink-0" />
        <div className="min-w-0">
          <h1 id="home-title" className="text-xl leading-snug font-semibold">
            {AUTHOR.intro}
          </h1>
          <p className="mt-1.5 text-xs text-muted">
            <Link to="/about" className="font-medium text-text underline underline-offset-4">
              {AUTHOR.name}
            </Link>{' '}
            · {AUTHOR.byline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">Interactive practice for A-Level, C3L6, UKChO and IChO.</p>
          <Link
            to="/calc"
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-semibold text-accent-ink active:opacity-80"
          >
            Start practising
          </Link>
        </div>
      </section>

      <section aria-label="Sections" className="mt-8">
        <ul className="space-y-2 leading-relaxed">
          <li>
            <Link to="/calc" className={link}>
              Calculations
            </Link>
            : build answers from formulas.
          </li>
          {modes.calc.includes('mechanisms') && (
            <li>
              <Link to="/calc?mode=mechanisms" className={link}>
                Mechanisms
              </Link>
              : derive rate laws step by step.
            </li>
          )}
          <li>
            <Link to="/reagents" className={link}>
              Reagents
            </Link>
            : what each reagent does.
          </li>
          <li>
            <Link to="/book" className={link}>
              Book
            </Link>
            : quick revision pages.
          </li>
          <li>
            <Link to="/practice" className={link}>
              Worked examples
            </Link>
            : for every question type.
          </li>
        </ul>
      </section>

      <section aria-labelledby="competitions" className="mt-8">
        <h2 id="competitions" className="mb-3 text-lg font-semibold">
          Guides by competition
        </h2>
        <div className="flex flex-wrap gap-2">
          {GUIDE_LIST.map((g) => (
            <Link key={g.slug} to={guidePath(g)} className={pill}>
              {g.title.replace(/ (calculation )?practice$/, '')}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="mistakes" className="mt-8 rounded-2xl border border-border p-4 text-sm leading-relaxed text-muted">
        <h2 id="mistakes" className="mb-1 text-lg font-semibold text-text">
          Spotted a mistake?
        </h2>
        <p>
          Questions marked 'unreviewed' haven't been checked yet. Tap the flag on any question, or{' '}
          <button type="button" onClick={() => useSuggest.getState().setOpen(true)} className="text-accent underline underline-offset-4">
            send me a suggestion
          </button>
          .
        </p>
        <p className="mt-2">
          Your progress stays on this device. No accounts, no tracking.{' '}
          <Link to="/about" className="text-accent underline underline-offset-4">
            About UnoffIChO
          </Link>
        </p>
      </section>
      <Footer />
    </div>
  );
}
