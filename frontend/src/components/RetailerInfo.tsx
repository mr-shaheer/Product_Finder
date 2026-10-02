import { ExternalLink, Star, Truck } from "lucide-react";
import type { Product } from "../types/product";
import { Button } from "./Button";
import { Badge } from "./Badge";

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

export function RetailerInfo({ product }: { product: Product }) {
  const discountPct =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">Sold by</p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-medium capitalize text-[var(--color-ink)]">
            {product.source}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            {product.rating !== null && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-[var(--color-ink)]" />
                {product.rating.toFixed(1)}
                {product.reviews_count !== null && <span>({product.reviews_count})</span>}
              </span>
            )}
            {product.delivery && (
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                {product.delivery}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="tabular-nums text-xl font-semibold text-[var(--color-ink)]">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.old_price && discountPct !== null && (
              <span className="flex items-center gap-1.5">
                <span className="tabular-nums text-xs text-[var(--color-ink-faint)] line-through">
                  {formatPrice(product.old_price, product.currency)}
                </span>
                <Badge tone="negative">-{discountPct}%</Badge>
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        className="mt-4 w-full"
        onClick={() => window.open(product.url, "_blank", "noopener,noreferrer")}
      >
        Visit product
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}
