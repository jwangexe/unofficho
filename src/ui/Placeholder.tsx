export function Placeholder({ phase, children }: { phase: number; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
      <p>Coming in phase {phase}.</p>
      {children}
    </div>
  );
}
