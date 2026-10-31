import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';

export interface FeedHandle {
  scrollTo: (index: number) => void;
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True when a key press belongs to a text field or an open dialog rather than the feed. */
const keyIsTaken = (e: KeyboardEvent) => {
  const t = e.target instanceof Element ? e.target : null;
  return (
    e.defaultPrevented ||
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    !!t?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') ||
    !!document.querySelector('[role="dialog"]')
  );
};

/**
 * Vertical, snap-scrolling feed: one item per screen. Only items near the current one are
 * rendered, so long feeds stay cheap; neighbours are mounted ahead of time so the next card
 * appears instantly. Off-screen cards are inert (no focus, hidden from screen readers).
 * On a keyboard, ↓ / PageDown / J go to the next card and ↑ / PageUp / K to the previous one.
 */
export const Feed = forwardRef(function Feed<T>(
  {
    items,
    getKey,
    render,
    onIndexChange,
    locked = false,
    itemLabel = 'Card',
  }: {
    items: readonly T[];
    getKey: (item: T) => string;
    render: (item: T, index: number, active: boolean) => ReactNode;
    onIndexChange?: (index: number) => void;
    locked?: boolean;
    /** Announced to screen readers as "<itemLabel> 3". */
    itemLabel?: string;
  },
  ref: React.Ref<FeedHandle>,
) {
  const el = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback((i: number) => {
    const node = el.current;
    if (!node) return;
    node.scrollTo({ top: i * node.clientHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);
  useImperativeHandle(ref, () => ({ scrollTo }), [scrollTo]);

  const onScroll = useCallback(() => {
    const node = el.current;
    if (!node || node.clientHeight === 0) return;
    const i = Math.round(node.scrollTop / node.clientHeight);
    if (i !== index) {
      setIndex(i);
      onIndexChange?.(i);
    }
  }, [index, onIndexChange]);

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (keyIsTaken(e)) return;
      const step = ['ArrowDown', 'PageDown', 'j'].includes(e.key) ? 1 : ['ArrowUp', 'PageUp', 'k'].includes(e.key) ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      scrollTo(Math.min(items.length - 1, Math.max(0, index + step)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, index, items.length, scrollTo]);

  return (
    <>
      <div
        ref={el}
        onScroll={onScroll}
        className={`h-full snap-y snap-mandatory overscroll-y-contain ${locked ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        {items.map((item, i) => (
          <section key={getKey(item)} className="h-full snap-start snap-always" inert={i !== index} aria-label={`${itemLabel} ${i + 1}`}>
            {Math.abs(i - index) <= 2 ? render(item, i, i === index) : null}
          </section>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {itemLabel} {index + 1}
      </p>
    </>
  );
}) as <T>(p: {
  items: readonly T[];
  getKey: (item: T) => string;
  render: (item: T, index: number, active: boolean) => ReactNode;
  onIndexChange?: (index: number) => void;
  locked?: boolean;
  itemLabel?: string;
} & { ref?: React.Ref<FeedHandle> }) => ReactNode;
