import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ReactNode } from 'react';

export interface FeedHandle {
  scrollTo: (index: number) => void;
}

/**
 * Vertical, snap-scrolling feed: one item per screen. Only items near the current one are
 * rendered, so long feeds stay cheap; neighbours are mounted ahead of time so the next card
 * appears instantly.
 */
export const Feed = forwardRef(function Feed<T>(
  {
    items,
    getKey,
    render,
    onIndexChange,
    locked = false,
  }: {
    items: readonly T[];
    getKey: (item: T) => string;
    render: (item: T, index: number, active: boolean) => ReactNode;
    onIndexChange?: (index: number) => void;
    locked?: boolean;
  },
  ref: React.Ref<FeedHandle>,
) {
  const el = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (i: number) => el.current?.scrollTo({ top: i * el.current.clientHeight, behavior: 'smooth' }),
  }));

  const onScroll = useCallback(() => {
    const node = el.current;
    if (!node || node.clientHeight === 0) return;
    const i = Math.round(node.scrollTop / node.clientHeight);
    if (i !== index) {
      setIndex(i);
      onIndexChange?.(i);
    }
  }, [index, onIndexChange]);

  return (
    <div
      ref={el}
      onScroll={onScroll}
      className={`h-full snap-y snap-mandatory overscroll-y-contain ${locked ? 'overflow-hidden' : 'overflow-y-auto'}`}
    >
      {items.map((item, i) => (
        <section key={getKey(item)} className="h-full snap-start snap-always" aria-hidden={i !== index}>
          {Math.abs(i - index) <= 2 ? render(item, i, i === index) : null}
        </section>
      ))}
    </div>
  );
}) as <T>(p: {
  items: readonly T[];
  getKey: (item: T) => string;
  render: (item: T, index: number, active: boolean) => ReactNode;
  onIndexChange?: (index: number) => void;
  locked?: boolean;
} & { ref?: React.Ref<FeedHandle> }) => ReactNode;
