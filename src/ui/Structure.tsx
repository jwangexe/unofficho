import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/theme';

/**
 * Skeletal structure drawn from SMILES with SmilesDrawer (loaded on first use, so it
 * stays out of the main bundle). Falls back to the SMILES text if parsing fails.
 */
export function Structure({
  smiles,
  label,
  width = 260,
  height = 160,
  className = '',
}: {
  smiles: string;
  label: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const theme = useTheme((s) => s.theme);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    void import('smiles-drawer').then(({ default: SD }) => {
      if (cancelled || !ref.current) return;
      const drawer = new SD.SvgDrawer({ width, height, bondThickness: 1.1, fontSizeLarge: 11, fontSizeSmall: 7, padding: 12 });
      SD.parse(
        smiles,
        (tree) => {
          if (cancelled || !ref.current) return;
          ref.current.replaceChildren();
          drawer.draw(tree, ref.current, theme);
        },
        () => !cancelled && setFailed(true),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [smiles, theme, width, height]);

  if (failed) return <code className="text-xs text-muted">{smiles}</code>;
  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={`mx-auto block h-auto w-full ${className}`}
      style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
    />
  );
}
