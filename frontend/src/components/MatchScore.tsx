export function MatchScore({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const pct = Math.round(Math.min(Math.max(score, 0), 1) * 100);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`shrink-0 font-medium text-[var(--color-ink-muted)] ${
          size === "sm" ? "text-[11px]" : "text-xs"
        }`}
      >
        AI Match
      </span>
      <div
        className={`flex-1 overflow-hidden rounded-full bg-[var(--color-surface)] ${
          size === "sm" ? "h-1.5 w-16" : "h-2 w-24"
        }`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="AI match score"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums text-xs font-semibold text-[var(--color-ink)]">
        {pct}%
      </span>
    </div>
  );
}
