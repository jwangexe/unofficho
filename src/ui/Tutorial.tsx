import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Rad, type RadPose } from './Rad';

export interface TourStep {
  pose: RadPose;
  title: string;
  text: string;
  /** `data-tour` value of the element to spotlight; the bubble alone if absent or not on screen. */
  target?: string;
}

const KEY = (id: string) => `unofficho.tutorial.${id}`;

export function tutorialSeen(id: string): boolean {
  try {
    return localStorage.getItem(KEY(id)) === '1';
  } catch {
    // Without storage, do not nag on every visit.
    return true;
  }
}

export function markTutorialSeen(id: string) {
  try {
    localStorage.setItem(KEY(id), '1');
  } catch {
    // Not persisted in private mode; fine.
  }
}

/** The target on screen: in a feed, the card being shown rather than its inert neighbours. */
function findTarget(name: string): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)];
  return all.find((el) => !el.closest('[inert]') && el.getClientRects().length > 0) ?? null;
}

const PAD = 6;

/**
 * A guided tour with Rad: the screen is dimmed except for the element each step is about,
 * and Rad explains it in a speech bubble near the bottom (or the top, if the element is low
 * on the screen). Back / Next / Skip, Esc to close, ← → to move.
 */
export function Tutorial({ steps, label, onClose }: { steps: readonly TourStep[]; label: string; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = steps[i]!;
  const last = i === steps.length - 1;

  useLayoutEffect(() => {
    const el = step.target ? findTarget(step.target) : null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: 'nearest' });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    // Layout can settle a frame later (fonts, KaTeX); follow resizes and scrolling too.
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step.target]);

  useEffect(() => next.current?.focus(), [i]);

  const go = useCallback((d: 1 | -1) => setI((x) => Math.min(steps.length - 1, Math.max(0, x + d))), [steps.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const bubbleOnTop = !!rect && rect.top + rect.height / 2 > window.innerHeight * 0.55;

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-200"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + 2 * PAD,
            height: rect.height + 2 * PAD,
            boxShadow: '0 0 0 9999px rgb(8 10 16 / 0.72)',
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[rgb(8_10_16/0.72)]" />
      )}

      <div
        className={`absolute inset-x-0 mx-auto max-w-xl px-3 ${
          bubbleOnTop ? 'top-0 pt-[max(0.75rem,env(safe-area-inset-top))]' : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
        }`}
      >
        <div className="flex items-end gap-1">
          <Rad pose={step.pose} size={92} className="shrink-0" />
          <div className="animate-pop relative mb-4 min-w-0 flex-1 rounded-2xl bg-surface p-4 shadow-2xl" aria-live="polite">
            {/* speech-bubble tail pointing at Rad */}
            <span aria-hidden className="absolute bottom-5 -left-2 size-4 rotate-45 bg-surface" />
            <p className="text-xs text-muted">
              {i + 1} of {steps.length}
            </p>
            <h2 className="mt-0.5 font-semibold">{step.title}</h2>
            <p className="mt-1 text-[0.95rem] leading-relaxed">{step.text}</p>
            <div className="mt-3 flex items-center gap-2">
              {!last && (
                <button type="button" onClick={onClose} className="min-h-10 px-1 text-sm text-muted">
                  Skip
                </button>
              )}
              <span className="flex-1" />
              {i > 0 && (
                <button type="button" onClick={() => go(-1)} className="min-h-10 rounded-xl bg-surface-2 px-3 text-sm font-medium">
                  Back
                </button>
              )}
              <button
                ref={next}
                type="button"
                onClick={() => (last ? onClose() : go(1))}
                className="min-h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
              >
                {last ? 'Got it' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
