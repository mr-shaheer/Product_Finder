import { Check, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ScoredProduct } from "../types/product";
import { ProductImage } from "./ProductImage";
import { MatchScore } from "./MatchScore";
import { Badge } from "./Badge";
import { Button } from "./Button";

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

export function ProductCard({
  item,
  compareChecked,
  onToggleCompare,
  rank,
}: {
  item: ScoredProduct;
  compareChecked: boolean;
  onToggleCompare: (id: string) => void;
  /** 1-based rank. When set, the card renders as one of the AI's top picks. */
  rank?: number;
}) {
  const navigate = useNavigate();
  const { product } = item;
  const discountPct =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;
  const isFeatured = typeof rank === "number";

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-[var(--shadow-card)] ${
        isFeatured
          ? "border-[var(--color-accent-soft-border)] ring-1 ring-[var(--color-accent-soft-border)]"
          : "border-[var(--color-border)]"
      }`}
    >
      <button
        onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface)] text-left"
        aria-label={`View details for ${product.title}`}
      >
        <ProductImage
          src={product.image_url}
          alt={product.title}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {isFeatured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-soft-border)] bg-white/95 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Top Recommendation #{rank}
          </span>
        )}
        {discountPct !== null && (
          <span className="absolute right-3 top-3">
            <Badge tone="negative">-{discountPct}%</Badge>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="h-[61px]">
        <button
          onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`)}
          className="line-clamp-2 text-left text-[15px] font-medium leading-snug text-[var(--color-ink)] hover:underline"
        >
          {product.title}
        </button>

        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          {product.source}
        </p>
      </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="tabular-nums text-lg font-semibold text-[var(--color-ink)]">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="tabular-nums text-xs text-[var(--color-ink-faint)] line-through">
                {formatPrice(product.old_price, product.currency)}
              </span>
            )}
          </div>
          {product.rating !== null && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
              <Star className="h-3.5 w-3.5 fill-current text-[var(--color-ink)]" />
              {product.rating.toFixed(1)}
              {product.reviews_count !== null && (
                <span className="text-[var(--color-ink-faint)]">({product.reviews_count})</span>
              )}
            </span>
          )}
        </div>

        <MatchScore score={item.total_score} size="sm" />

        <div className="mt-1 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
          <button
            onClick={() => onToggleCompare(product.id)}
            aria-pressed={compareChecked}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
              compareChecked
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
            }`}
          >
            {compareChecked && <Check className="h-3.5 w-3.5" />}
            Compare
          </button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`)}
          >
            View product
          </Button>
        </div>
      </div>
    </div>
  );
}
