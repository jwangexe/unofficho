import type { ReactNode } from 'react';
import { Footer } from './Footer';

/** Standard scrolling page: content column plus the disclaimer footer. */
export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4">
      {title && <h1 className="mb-4 text-2xl font-semibold">{title}</h1>}
      {children}
      <Footer />
    </div>
  );
}
