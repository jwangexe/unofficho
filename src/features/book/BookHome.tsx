import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { BOOK_OUTLINE, bookPages } from '@/data/book';
import { CHAPTERS, type Chapter } from '@/data/schemas';
import { Page } from '@/ui/Page';
import { BookPageView } from './BookPageView';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { topicInScope } from '@/data/levels';
import { inLevel } from '@/data/levels/pool';
import { LevelChip } from '../level/LevelChip';
import { useLevelPrefs } from '../level/store';

const CHAPTER_KEY = 'unofficho.bookChapter';

function readChapter(): Chapter {
  try {
    const c = localStorage.getItem(CHAPTER_KEY);
    return CHAPTERS.includes(c as Chapter) ? (c as Chapter) : 'physical';
  } catch {
    return 'physical';
  }
}

function Contents() {
  useDocumentTitle('Book');
  const prefs = useLevelPrefs();
  // Pages at this level (and easier ones, if on); sections and chapters outside the level's syllabus are hidden.
  const pages = bookPages.filter((p) => inLevel(p.levels, prefs));
  const sectionShown = (c: Chapter, s: string) => topicInScope(prefs.level, `${c}/${s}`) || pages.some((p) => p.chapter === c && p.section === s);
  const chapters = CHAPTERS.filter((c) => BOOK_OUTLINE[c].sections.some((s) => sectionShown(c, s.id)));
  const [saved, setChapter] = useState<Chapter>(readChapter);
  const chapter = chapters.includes(saved) ? saved : (chapters[0] ?? saved);
  const pick = (c: Chapter) => {
    setChapter(c);
    try {
      localStorage.setItem(CHAPTER_KEY, c);
    } catch {
      // Not persisted in private mode; fine.
    }
  };
  const written = pages.filter((p) => !p.stub).length;

  return (
    <Page title="Book">
      <div className="-mt-2 mb-4 flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm text-muted">
          {written} pages written · {pages.length - written} outlined
        </p>
        <LevelChip />
      </div>
      <nav aria-label="Chapters" className="mb-4 flex gap-1 overflow-x-auto">
        {chapters.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            aria-current={c === chapter ? 'page' : undefined}
            className={`min-h-9 shrink-0 rounded-full px-3 text-sm ${c === chapter ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}
          >
            {BOOK_OUTLINE[c].title}
          </button>
        ))}
      </nav>
      {BOOK_OUTLINE[chapter].sections.filter((s) => sectionShown(chapter, s.id)).map((s) => {
        const here = pages.filter((p) => p.chapter === chapter && p.section === s.id);
        return (
          <section key={s.id} className="mb-5" aria-labelledby={`sec-${s.id}`}>
            <h2 id={`sec-${s.id}`} className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {s.title}
            </h2>
            {here.length === 0 ? (
              <p className="text-sm text-muted">No pages yet.</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface">
                {here.map((p) => (
                  <li key={p.id}>
                    <Link to={p.id} className="flex min-h-12 items-center gap-3 px-4 py-2.5">
                      <span className={`min-w-0 flex-1 ${p.stub ? 'text-muted' : ''}`}>{p.title}</span>
                      <span className="shrink-0 text-xs text-muted">{p.stub ? 'outline' : `${p.minutes} min`}</span>
                      {!p.reviewed && <span className="size-1.5 shrink-0 rounded-full bg-muted/50" title="Not yet reviewed" aria-label="not yet reviewed" />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </Page>
  );
}

export default function BookHome() {
  return (
    <Routes>
      <Route index element={<Contents />} />
      <Route path=":pageId" element={<BookPageView />} />
    </Routes>
  );
}
