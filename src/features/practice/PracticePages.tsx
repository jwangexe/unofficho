import { Link, Route, Routes, useParams } from 'react-router';
import NotFound from '../notfound/NotFound';
import { templateFormulas } from '@/data/templates';
import { describeNode } from '@/engine/approach';
import { formulaById } from '@/engine/formulas';
import { formatQuantity } from '@/engine/quantity';
import type { CalcTemplate } from '@/engine/template';
import { Page } from '@/ui/Page';
import { Tex } from '@/ui/Tex';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { TITLES } from '@/app/seo';
import { DerivationLink } from '../book/DerivationLink';
import { TOPIC_TAG } from '../calc/topics';
import { levelNames, PRACTICE, practiceBySlug, practiceLead, practicePath, practiseHref, workedExample } from './practice';

const topicName = (topic: string) => TOPIC_TAG[topic] ?? topic;
const topics = () => [...new Set(PRACTICE.map((t) => t.topic))];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PracticeButton({ t }: { t: CalcTemplate }) {
  return (
    <Link to={practiseHref(t)} className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-semibold text-accent-ink">
      Practise this with fresh numbers
    </Link>
  );
}

export function PracticeIndex() {
  useDocumentTitle(TITLES.practice);
  return (
    <Page title="Question types">
      <p className="-mt-2 mb-5 text-muted">
        Every kind of calculation in UnoffIChO, from A-Level to IChO. Each page has a worked example, the method and the mistakes
        people usually make; then practise it in the app with new numbers every time.
      </p>
      {topics().map((topic) => (
        <section key={topic} className="mb-6" aria-labelledby={`topic-${topic}`}>
          <h2 id={`topic-${topic}`} className="mb-1.5 text-xs font-semibold text-muted">
            {topicName(topic)}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface">
            {PRACTICE.filter((t) => t.topic === topic).map((t) => (
              <li key={t.id}>
                <Link to={practicePath(t)} className="flex min-h-12 flex-col justify-center px-4 py-2.5">
                  <span>{t.title}</span>
                  <span className="text-xs text-muted">{levelNames(t)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}

export function PracticeView({ t }: { t: CalcTemplate }) {
  useDocumentTitle(t.title);
  const inst = workedExample(t);
  const formulas = templateFormulas(t);
  const related = PRACTICE.filter((o) => o.topic === t.topic && o.id !== t.id);
  const answer = inst.referenceValues[t.answer.node] ?? inst.expected;

  return (
    <Page>
      <Link to="/practice" className="-mx-2 flex min-h-11 items-center px-2 text-sm text-muted">
        <span aria-hidden className="mr-1.5">←</span>
        All question types · {topicName(t.topic)}
      </Link>
      <h1 className="mt-1 text-2xl leading-tight font-semibold">{t.title}</h1>
      <p className="mt-1.5 text-xs text-muted">
        {levelNames(t)}
        {!t.reviewed && ' · unreviewed'}
      </p>
      <p className="mt-4 leading-relaxed">{practiceLead(t)}</p>
      <div className="mt-4">
        <PracticeButton t={t} />
      </div>

      <Section title="Worked example">
        <p className="rounded-xl bg-surface p-4 leading-relaxed">{inst.text}</p>
        <ol className="mt-3 space-y-2">
          {t.reference.map((n, i) => {
            const step = describeNode(t, n);
            const value = inst.referenceValues[n.id];
            return (
              <li key={n.id} className="rounded-xl bg-surface-2 p-3 text-sm">
                <p className="text-muted">
                  {i + 1}. {step.caption}
                </p>
                {step.latex && (
                  <div className="my-1 overflow-x-auto overflow-y-hidden">
                    <Tex>{step.latex}</Tex>
                  </div>
                )}
                {value && <p className="font-semibold">= {formatQuantity(value, 4)}</p>}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 rounded-xl border border-good/50 p-3">
          <span className="text-muted">Answer: </span>
          <span className="font-semibold">
            {t.answer.label} = {formatQuantity(answer, 3)}
          </span>
        </p>
      </Section>

      <Section title="Method">
        <p className="leading-relaxed">{t.explanation}</p>
      </Section>

      {t.misconceptions?.length ? (
        <Section title="Common mistakes">
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
            {t.misconceptions.map((m) => (
              <li key={m.message}>{m.message}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {formulas.length > 0 && (
        <Section title="Formulas used">
          <ul className="space-y-2">
            {formulas.map((id) => {
              const f = formulaById.get(id)!;
              return (
                <li key={id} className="rounded-xl bg-surface p-3">
                  <p className="text-sm text-muted">{f.name}</p>
                  <div className="my-1 overflow-x-auto overflow-y-hidden">
                    <Tex>{f.latex}</Tex>
                  </div>
                  <DerivationLink formula={id} />
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <div className="mt-6">
        <PracticeButton t={t} />
      </div>

      {related.length > 0 && (
        <Section title={`More ${topicName(t.topic).toLowerCase()} questions`}>
          <ul className="space-y-1">
            {related.map((o) => (
              <li key={o.id}>
                <Link to={practicePath(o)} className="text-accent underline underline-offset-4">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Page>
  );
}

function BySlug() {
  const { slug } = useParams();
  const t = slug ? practiceBySlug.get(slug) : undefined;
  if (!t) return <NotFound />;
  return <PracticeView key={t.id} t={t} />;
}

export default function PracticePages() {
  return (
    <Routes>
      <Route index element={<PracticeIndex />} />
      <Route path=":slug" element={<BySlug />} />
    </Routes>
  );
}
