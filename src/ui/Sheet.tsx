import { useEffect, useRef, type ReactNode } from 'react';

/** Bottom sheet: thumb-reachable panel over the current screen. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="animate-sheet-up relative mx-auto flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="min-w-0 font-semibold">{title}</div>
          <button ref={closeRef} type="button" onClick={onClose} className="grid size-11 place-items-center text-muted" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer && <div className="border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
