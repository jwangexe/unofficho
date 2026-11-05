import { Link, Route, Routes, useParams } from 'react-router';
import NotFound from '../notfound/NotFound';
import { TITLES } from '@/app/seo';
import { reagents } from '@/data';
import { bookPages } from '@/data/book';
import { LEVELS, reagentInScope, type LevelId } from '@/data/levels';
import { formatNumber } from '@/engine/format';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { useLevelStore } from '../level/store';
import { PRACTICE, practicePath } from '../practice/practice';
import { GUIDE_LIST, guideBySlug, guidePath, type Guide } from './guides';

const link = 'text-accent underline underline-offset-4';

/** What the app has at a level: its own question types, Book pages and reagents (not the warm-ups). */
function levelCoverage(level: LevelId) {
  return {
    practice: PRACTICE.filter((t) => t.levels.includes(level)),
    book: bookPages.filter((p) => !p.stub && p.levels.includes(level)),
    reagents: reagents.filter((r) => reagentInScope(level, r.id)).length,
    scope: LEVELS[level],
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function GuideIndex() {
  useDocumentTitle(TITLES.guides);
  return (
    <Page title="Which competition?">
      <p className="-mt-2 mb-5 text-muted">
        UnoffIChO has a level for each step from A-Level to the International Chemistry Olympiad. Each guide says what the competition
        is, how to prepare for it here, and which questions and pages belong to it.
      </p>
      <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface">
        {GUIDE_LIST.map((g) => (
          <li key={g.slug}>
            <Link to={guidePath(g)} className="flex min-h-12 flex-col justify-center px-4 py-2.5">
              <span>{g.title}</span>
              <span className="text-xs text-muted">{LEVELS[g.level].who}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

const CONSTANT_NAMES = {
  R: 'R',
  NA: (
    <>
      N<sub>A</sub>
    </>
  ),
  F: 'F',
  h: 'h',
  c: 'c',
} as const;
/** As printed: 96485 stays whole; only very large or small values go to standard form. */
const constantText = (v: number) => (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3 ? formatNumber(v, 4) : String(v));

export function GuideView({ g }: { g: Guide }) {
  useDocumentTitle(g.title);
  const setLevel = useLevelStore((s) => s.setLevel);
  const { practice, book, reagents, scope } = levelCoverage(g.level);
  const constants = Object.entries(scope.notation.constants) as [keyof typeof CONSTANT_NAMES, number][];
  const start = (
    <Link
      to="/calc"
      onClick={() => void setLevel(g.level)}
      className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-semibold text-accent-ink"
    >
      Practise at {scope.name} level
    </Link>
  );

  return (
    <Page>
      <Link to="/guides" className="-mx-2 flex min-h-11 items-center px-2 text-sm text-muted">
        <span aria-hidden className="mr-1.5">←</span>
        All competitions
      </Link>
      <h1 className="mt-1 text-2xl leading-tight font-semibold">{g.title}</h1>
      {g.about.map((p) => (
        <p key={p} className="mt-4 leading-relaxed">
          {p}
        </p>
      ))}
      <div className="mt-5">{start}</div>

      <Section title="How to prepare here">
        <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
          {g.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Conventions">
        <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>{scope.notation.sigFigs}</li>
          <li>Units: {scope.notation.units}</li>
          {constants.length > 0 && (
            <li>
              Constants as on the data sheet:{' '}
              {constants.map(([k, v], i) => (
                <span key={k}>
                  {i > 0 && ', '}
                  {CONSTANT_NAMES[k]} = {constantText(v)}
                </span>
              ))}
              .
            </li>
          )}
        </ul>
      </Section>

      {practice.length > 0 && (
        <Section title={`${scope.name} question types (${practice.length})`}>
          <ul className="space-y-1">
            {practice.map((t) => (
              <li key={t.id}>
                <Link to={practicePath(t)} className={link}>
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {book.length > 0 && (
        <Section title="Book pages for this level">
          <ul className="space-y-1">
            {book.map((p) => (
              <li key={p.id}>
                <Link to={`/book/${p.id}`} className={link}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-6 text-muted">
        Plus {reagents} reagents to drill in the{' '}
        <Link to="/reagents" className={link}>
          reagent trainer
        </Link>
        .
      </p>
      <div className="mt-6">{start}</div>

      <Section title="Other competitions">
        <ul className="space-y-1">
          {GUIDE_LIST.filter((o) => o.slug !== g.slug).map((o) => (
            <li key={o.slug}>
              <Link to={guidePath(o)} className={link}>
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}

function BySlug() {
  const { slug } = useParams();
  const g = slug ? guideBySlug.get(slug) : undefined;
  if (!g) return <NotFound />;
  return <GuideView key={g.slug} g={g} />;
}

export default function GuidePages() {
  return (
    <Routes>
      <Route index element={<GuideIndex />} />
      <Route path=":slug" element={<BySlug />} />
    </Routes>
  );
}
