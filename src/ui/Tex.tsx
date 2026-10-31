import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

/**
 * Render a LaTeX string with KaTeX. Bad LaTeX shows in red instead of throwing. The default
 * output includes hidden MathML, which is what screen readers read.
 */
export function Tex({ children, display = false, className = '' }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: display, throwOnError: false }),
    [children, display],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
