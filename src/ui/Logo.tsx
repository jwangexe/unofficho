export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`} aria-label="UnoffIChO">
      Unoff<span className="text-accent">IChO</span>
    </span>
  );
}
