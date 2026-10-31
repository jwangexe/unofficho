import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { DISCLAIMER } from '@/app/brand';
import { db } from '@/storage/db';
import { endOfDay } from '@/storage/srs';
import { Footer } from '@/ui/Footer';
import { BookIcon, CalcIcon, ChartIcon, FlaskIcon, MechanismIcon } from '@/ui/icons';
import { Logo } from '@/ui/Logo';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

/** Items due for review today, or null before IndexedDB answers. */
function useDueCount() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    void db.srs
      .where('due')
      .below(endOfDay(Date.now()))
      .count()
      .then(setN, () => setN(0));
  }, []);
  return n;
}

const pill = 'inline-flex min-h-10 items-center rounded-full bg-surface-2 px-3 text-sm font-medium active:opacity-70';

function Feature({ icon, title, to, children, links }: { icon: ReactNode; title: string; to: string; children: ReactNode; links?: { label: string; to: string }[] }) {
  return (
    <li className="flex flex-col rounded-2xl bg-surface p-4">
      <Link to={to} className="group flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">{icon}</span>
        <span className="min-w-0">
          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{title}</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">{children}</span>
        </span>
      </Link>
      {links && (
        <div className="mt-3 flex flex-wrap gap-2 pl-13">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={pill}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

export default function Home() {
  useDocumentTitle('Home');
  const due = useDueCount();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0">
          <section aria-labelledby="home-title">
            <h1 id="home-title" className="text-4xl">
              <Logo />
            </h1>
            <p className="mt-3 text-xl leading-snug font-semibold">Chemistry olympiad practice that feels like scrolling a feed.</p>
            <p className="mt-3 leading-relaxed text-muted">
              Short Book pages, a reagent drill and a Calculations trainer where you build solutions from formula steps
              instead of typing numbers into a calculator. Everything works offline, and missed questions come back
              when you need them.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/calc" className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-semibold text-accent-ink active:opacity-80">
                Start practising
              </Link>
              {due ? (
                <Link to="/progress" className="inline-flex min-h-12 items-center rounded-xl border border-accent px-5 font-semibold text-accent">
                  Review {due} due today
                </Link>
              ) : (
                <Link to="/book" className="inline-flex min-h-12 items-center rounded-xl bg-surface-2 px-5 font-semibold">
                  Read the Book
                </Link>
              )}
            </div>
          </section>

          {/* On a phone the side box sits here, between the introduction and the features. */}
          <div className="mt-6 lg:hidden">
            <SideBox />
          </div>

          <section aria-labelledby="features" className="mt-8">
            <h2 id="features" className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
              What's inside
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              <Feature icon={<CalcIcon />} title="Calculations" to="/calc" links={[
                { label: 'Feed', to: '/calc?mode=feed' },
                { label: 'Approach', to: '/calc?mode=approach' },
                { label: 'Multi-step', to: '/calc?mode=multi' },
                { label: 'Exam', to: '/calc?mode=exam' },
              ]}>
                Build each answer from formulas and operations, with unit checks and feedback on where a route went wrong.
              </Feature>
              <Feature icon={<MechanismIcon />} title="Mechanisms" to="/calc?mode=mechanisms" links={[{ label: 'Derive a rate law', to: '/calc?mode=mechanisms' }]}>
                Put intermediates in steady state or pre-equilibrium and derive the rate law yourself, step by step.
              </Feature>
              <Feature icon={<FlaskIcon />} title="Reagents" to="/reagents" links={[
                { label: 'Classify', to: '/reagents?mode=classify' },
                { label: 'Fast', to: '/reagents?mode=fast' },
                { label: 'Will it react?', to: '/reagents?mode=react' },
              ]}>
                Sort reagents by role, then decide which groups react and which product forms.
              </Feature>
              <Feature icon={<BookIcon />} title="Book" to="/book" links={[{ label: 'Contents', to: '/book' }]}>
                Two-minute pages across the syllabus, each ending in quick checks that feed your reviews.
              </Feature>
              <Feature icon={<ChartIcon />} title="Progress" to="/progress" links={[{ label: 'Weak spots', to: '/progress' }]}>
                Streaks, accuracy by topic, and your weakest areas, each one tap from a targeted feed.
              </Feature>
            </ul>
          </section>

          <section aria-labelledby="privacy" className="mt-8 rounded-2xl border border-border p-4 text-sm leading-relaxed text-muted">
            <h2 id="privacy" className="mb-1 font-semibold text-text">
              Your data stays with you
            </h2>
            Progress is stored on this device only; nothing is sent anywhere. Export it from Progress to move devices. Items marked
            "unreviewed" have not yet been checked for accuracy, so flag anything that looks wrong.{' '}
            <Link to="/about" className="text-accent underline underline-offset-4">
              About UnoffIChO
            </Link>
          </section>
        </div>

        <aside className="hidden lg:sticky lg:top-6 lg:block">
          <SideBox />
        </aside>
      </div>
      <Footer />
    </div>
  );
}

function SideBox() {
  return (
    <div className="rounded-2xl border border-accent/40 bg-surface p-4" role="note" aria-label="About the author">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Made by a medallist</p>
      <p className="mt-2 leading-relaxed">
        UnoffIChO was created by an <strong className="font-semibold">IChO gold medallist</strong>, built around the practice that
        actually helps: deriving rather than memorising, short focused drills, and reviewing what you got wrong.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
    </div>
  );
}
