import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { calcTemplateById, templateFormulas } from '@/data/templates';
import { db, type Attempt, type Section, type SrsState } from '@/storage/db';
import { downloadJson, exportAll, exportFlags, importAll } from '@/storage/exportImport';
import { parseItemId } from '@/storage/itemIds';
import { DAY } from '@/storage/srs';
import { Page } from '@/ui/Page';
import { focusQuery } from '../focus';
import { formulaHref, formulaName, itemHref, itemLevels, itemName, SECTION_LABEL, SECTION_PATH, topicHref, topicName } from './labels';
import { dueToday, recent, RECENT_DAYS, streaks, tallyBy, weakSpots, type Tally } from './stats';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { LEVEL_LIST, type LevelId } from '@/data/levels';
import { useLevelStore } from '../level/store';

const SECTIONS: Section[] = ['calc', 'reagents', 'book'];
const btn = 'min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium active:opacity-70';
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Accuracy meter: accent fill on a lighter accent track; the number is in normal ink. */
function Meter({ label, tally, href }: { label: string; tally: Tally; href?: string }) {
  const name = href ? (
    <Link to={href} className="underline decoration-border underline-offset-4">
      {label}
    </Link>
  ) : (
    label
  );
  return (
    <div className="py-1.5">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="font-semibold tabular-nums">{pct(tally.accuracy)}</span>
        <span className="w-14 text-right text-xs text-muted tabular-nums">{tally.n} ans.</span>
      </div>
      <div
        className="mt-1 h-1.5 rounded-full bg-accent/15"
        role="meter"
        aria-label={`${label} accuracy`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tally.accuracy * 100)}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, tally.accuracy * 100)}%` }} />
      </div>
    </div>
  );
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="mb-4 rounded-2xl bg-surface p-4" aria-label={title}>
      <h2 className="font-semibold">{title}</h2>
      {note && <p className="mb-1 text-xs text-muted">{note}</p>}
      {children}
    </section>
  );
}

interface Weak {
  key: string;
  kind: 'topic' | 'item' | 'formula';
  label: string;
  sub: string;
  href: string;
  tally: Tally;
}

function useProgress(version: number) {
  const [data, setData] = useState<{ attempts: Attempt[]; srs: SrsState[]; flags: number } | null>(null);
  useEffect(() => {
    void Promise.all([db.attempts.toArray(), db.srs.toArray(), db.flags.count()]).then(([attempts, srs, flags]) => setData({ attempts, srs, flags }));
  }, [version]);
  return data;
}

export default function ProgressHome() {
  useDocumentTitle('Progress');
  const [version, setVersion] = useState(0);
  const data = useProgress(version);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  // Show progress on every item, or only on items tagged with one level.
  const [levelFilter, setLevelFilter] = useState<LevelId | 'all'>('all');

  const stats = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const atLevel = (id: string) => levelFilter === 'all' || !!itemLevels(id)?.includes(levelFilter);
    const attempts = data.attempts.filter((a) => atLevel(a.itemId));
    const srs = data.srs.filter((s) => atLevel(s.itemId));
    const last = recent(attempts, now);
    const bySection = tallyBy(last, (a) => a.section);
    const byTopic = tallyBy(last, (a) => `${a.section}|${a.topic}`);
    const byItem = tallyBy(last, (a) => a.itemId);
    const byFormula = tallyBy(last, (a) => {
      const p = parseItemId(a.itemId);
      const t = p?.kind === 'calc' ? calcTemplateById.get(p.id) : undefined;
      return t ? templateFormulas(t) : undefined;
    });

    const weak: Weak[] = [
      ...weakSpots(byTopic, { minAttempts: 4 }).map(({ key, tally }) => {
        const [section, topic] = key.split('|') as [Section, string];
        return { key, kind: 'topic' as const, label: topicName(section, topic), sub: `${SECTION_LABEL[section]} topic`, href: topicHref(section, topic), tally };
      }),
      ...weakSpots(byFormula, { minAttempts: 3 }).map(({ key, tally }) => ({
        key: `f|${key}`, kind: 'formula' as const, label: formulaName(key), sub: 'Formula', href: formulaHref(key), tally,
      })),
      ...weakSpots(byItem, { minAttempts: 2 }).map(({ key, tally }) => ({
        key, kind: 'item' as const, label: itemName(key), sub: SECTION_LABEL[attempts.find((a) => a.itemId === key)!.section], href: itemHref(key), tally,
      })),
    ]
      // A formula used by only one practised question just repeats that question's row.
      .filter((w, _, all) => w.kind !== 'formula' || !all.some((o) => o.kind === 'item' && o.tally.n === w.tally.n && o.tally.accuracy === w.tally.accuracy && o.key.startsWith('calc:')))
      .sort((a, b) => a.tally.accuracy - b.tally.accuracy || b.tally.n - a.tally.n)
      .slice(0, 8);

    return {
      streak: streaks(attempts, now),
      week: attempts.filter((a) => a.ts > now - 7 * DAY).length,
      due: dueToday(srs, now),
      bySection,
      byTopic,
      weak,
    };
  }, [data, levelFilter]);

  const stamp = () => new Date().toISOString().slice(0, 10);
  async function onImport(file: File) {
    try {
      const res = await importAll(JSON.parse(await file.text()), 'merge');
      setMsg(`Imported ${res.attempts} answers, ${res.flags} flags and ${res.srs} review states.`);
      setVersion((v) => v + 1);
      // The file may carry a level choice.
      await useLevelStore.getState().load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  const dueTotal = stats ? SECTIONS.reduce((n, s) => n + stats.due[s].length, 0) : 0;
  const bookDuePages = stats ? [...new Set(stats.due.book.map((s) => parseItemId(s.itemId)?.id).filter((x): x is string => !!x))] : [];

  return (
    <Page title="Progress">
      <label className="-mt-2 mb-4 flex items-center gap-2 text-sm text-muted">
        Show
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LevelId | 'all')}
          className="min-h-9 rounded-md border border-border bg-surface px-3 text-text"
        >
          <option value="all">All levels</option>
          {LEVEL_LIST.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} items
            </option>
          ))}
        </select>
      </label>
      {!stats ? (
        // Hold the space until the stats load, so the cards below do not jump (layout shift).
        <div className="min-h-[100dvh]" aria-busy="true" />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Tile label="Streak" value={`${stats.streak.current} ${stats.streak.current === 1 ? 'day' : 'days'}`} sub={`best ${stats.streak.best}`} />
            <Tile label="Due today" value={String(dueTotal)} sub="to review" />
            <Tile label="Answered" value={String(stats.week)} sub="last 7 days" />
          </div>
          {!stats.streak.today && stats.streak.current > 0 && (
            <p className="-mt-2 mb-4 text-xs text-muted">Answer one question today to keep your streak.</p>
          )}

          <Card title="Due today" note="Items come back on a spaced-repetition schedule after you answer them.">
            <ul className="divide-y divide-border">
              {(['calc', 'reagents'] as const).map((s) => (
                <li key={s} className="flex min-h-12 items-center gap-3">
                  <span className="flex-1">{SECTION_LABEL[s]}</span>
                  <span className="text-sm text-muted tabular-nums">{stats.due[s].length}</span>
                  {stats.due[s].length > 0 ? (
                    <Link to={`${SECTION_PATH[s]}${focusQuery({ due: true })}`} className="grid min-h-9 place-items-center rounded-md bg-accent px-3 text-sm font-semibold text-accent-ink">
                      Review
                    </Link>
                  ) : (
                    <span className="min-h-9 px-3 text-sm leading-9 text-muted">Done</span>
                  )}
                </li>
              ))}
              <li className="py-2">
                <div className="flex min-h-8 items-center gap-3">
                  <span className="flex-1">Book quick checks</span>
                  <span className="text-sm text-muted tabular-nums">{stats.due.book.length}</span>
                  {stats.due.book.length === 0 && <span className="px-3 text-sm text-muted">Done</span>}
                </div>
                {bookDuePages.length > 0 && (
                  <ul className="mt-1 space-y-1 text-sm">
                    {bookDuePages.map((id) => (
                      <li key={id}>
                        <Link to={`/book/${id}`} className="text-accent underline underline-offset-4">
                          {itemName(`book:${id}:`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </Card>

          <Card title="Weak spots" note={`Lowest accuracy over the last ${RECENT_DAYS} days. Tap one to practise just that.`}>
            {stats.weak.length === 0 ? (
              <p className="py-2 text-sm text-muted">Nothing below 70% yet. Weak spots appear once a topic or item has a few answers.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.weak.map((w) => (
                  <li key={w.key}>
                    <Link to={w.href} className="flex min-h-14 items-center gap-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{w.label}</span>
                        <span className="text-xs text-muted">
                          {w.sub} · {w.tally.n} answers
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums">{pct(w.tally.accuracy)}</span>
                      <span aria-hidden className="text-muted">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Accuracy" note={`Mean score over the last ${RECENT_DAYS} days, with partial credit.`}>
            {stats.bySection.size === 0 ? (
              <p className="py-2 text-sm text-muted">No answers yet. Your accuracy by section and topic will appear here.</p>
            ) : (
              SECTIONS.filter((s) => stats.bySection.has(s)).map((s) => {
                const topics = [...stats.byTopic].filter(([k]) => k.startsWith(`${s}|`)).sort(([, a], [, b]) => a.accuracy - b.accuracy);
                return (
                  <details key={s} className="group border-t border-border first:border-t-0">
                    <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <Meter label={SECTION_LABEL[s]} tally={stats.bySection.get(s)!} />
                      </div>
                      <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <div className="mb-2 border-l-2 border-border pl-3">
                      {topics.map(([k, t]) => {
                        const topic = k.slice(s.length + 1);
                        return <Meter key={k} label={topicName(s, topic)} tally={t} href={topicHref(s, topic)} />;
                      })}
                    </div>
                  </details>
                );
              })
            )}
          </Card>
        </>
      )}

      <Card title="Your data" note="Everything is stored on this device only.">
        <p className="mb-3 text-sm text-muted">
          {data ? `${data.attempts.length} answers recorded · ${data.flags} flagged items` : '…'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={async () => downloadJson(await exportAll(), `unofficho-progress-${stamp()}.json`)}>
            Export progress
          </button>
          <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
            Import progress
          </button>
          <button type="button" className={btn} onClick={async () => downloadJson(await exportFlags(), `unofficho-flags-${stamp()}.json`)}>
            Export flagged list
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">Importing merges with what is here; for each item the more recent review schedule wins.</p>
        {msg && (
          <p className="mt-3 text-sm whitespace-pre-wrap" role="status">
            {msg}
          </p>
        )}
      </Card>
    </Page>
  );
}
