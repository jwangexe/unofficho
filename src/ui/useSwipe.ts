import { useEffect, type RefObject } from 'react';

/** Starts inside something that scrolls sideways (wide maths, tables): leave that to the element. */
function inHorizontalScroller(target: EventTarget | null, root: HTMLElement): boolean {
  for (let el = target as HTMLElement | null; el && el !== root; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible') return true;
  }
  return false;
}

/**
 * Horizontal swipe on a touch screen: calls onLeft / onRight after a clear sideways
 * movement (at least 70 px, and mostly horizontal), so vertical scrolling is unaffected.
 */
export function useSwipe(ref: RefObject<HTMLElement | null>, { onLeft, onRight }: { onLeft?: () => void; onRight?: () => void }) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let start: { x: number; y: number } | null = null;
    const down = (e: TouchEvent) => {
      const t = e.touches[0];
      start = e.touches.length === 1 && t && !inHorizontalScroller(e.target, root) ? { x: t.clientX, y: t.clientY } : null;
    };
    const up = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy)) return;
      if (dx < 0) onLeft?.();
      else onRight?.();
    };
    root.addEventListener('touchstart', down, { passive: true });
    root.addEventListener('touchend', up, { passive: true });
    return () => {
      root.removeEventListener('touchstart', down);
      root.removeEventListener('touchend', up);
    };
  }, [ref, onLeft, onRight]);
}
