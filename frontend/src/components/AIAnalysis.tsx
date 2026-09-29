import { Sparkle } from "lucide-react";
import type { ClassifiedQuery, ScoredProduct } from "../types/product";
import { CATEGORY_LABELS } from "../types/product";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
        <span className="tabular-nums text-sm font-semibold text-[var(--color-ink)]">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AIAnalysis({
  item,
  classification,
}: {
  item: ScoredProduct;
  classification: ClassifiedQuery | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Sparkle className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm font-medium text-[var(--color-ink)]">AI Analysis</p>
      </div>

      <div className="flex flex-col gap-4">
        <ScoreBar label="Overall match" value={item.total_score} />
        <ScoreBar label="Relevance to your search" value={item.relevance_score} />
        <ScoreBar label="Price fit" value={item.price_score} />
      </div>

      {classification && (
        <div className="mt-5 border-t border-[var(--color-border)] pt-4">
          <p className="mb-1 text-xs font-medium text-[var(--color-ink-muted)]">
            Category match — {CATEGORY_LABELS[classification.category]}
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
            {classification.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
