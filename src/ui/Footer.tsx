import { DISCLAIMER } from '@/app/brand';

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border px-4 py-6 text-center text-xs leading-relaxed text-muted">
      {DISCLAIMER}
    </footer>
  );
}

/** Compact disclaimer for full-screen feed cards, which have no page footer. */
export function CardDisclaimer() {
  return <p className="pt-4 text-center text-xs leading-snug text-muted">{DISCLAIMER}</p>;
}
