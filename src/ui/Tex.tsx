import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

/** Render a LaTeX string with KaTeX. Bad LaTeX shows in red instead of throwing. */
export function Tex({ children, display = false, className = '' }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: display, throwOnError: false, output: 'html' }),
    [children, display],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
