import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, Star } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { ProductImage } from "../components/ProductImage";
import { AIAnalysis } from "../components/AIAnalysis";
import { RetailerInfo } from "../components/RetailerInfo";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { CATEGORY_LABELS } from "../types/product";

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, classification, compareIds, toggleCompare } = useSearch();

  const item = id ? getProductById(id) : undefined;

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="We don't have that product anymore"
          description="Product details only exist for your current search results. Run a new search to browse products again."
          action={
            <Button size="sm" onClick={() => navigate("/")}>
              Start a new search
            </Button>
          }
        />
      </div>
    );
  }

  const { product } = item;
  const discountPct =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;
  const isComparing = compareIds.includes(product.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <button
        onClick={() => navigate("/results")}
        className="mb-5 flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_320px]">
        <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:col-span-1">
          <ProductImage src={product.image_url} alt={product.title} className="h-full w-full" />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{CATEGORY_LABELS[product.category]}</Badge>
            {product.rating !== null && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)]">
                <Star className="h-4 w-4 fill-current text-[var(--color-ink)]" />
                {product.rating.toFixed(1)}
                {product.reviews_count !== null && (
                  <span className="text-[var(--color-ink-faint)]">
                    ({product.reviews_count} reviews)
                  </span>
                )}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-medium leading-snug text-[var(--color-ink)]">
            {product.title}
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="tabular-nums text-3xl font-semibold text-[var(--color-ink)]">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.old_price && discountPct !== null && (
              <>
                <span className="tabular-nums text-base text-[var(--color-ink-faint)] line-through">
                  {formatPrice(product.old_price, product.currency)}
                </span>
                <Badge tone="negative">-{discountPct}%</Badge>
              </>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border)] p-4 text-sm">
            <div>
              <dt className="text-[var(--color-ink-faint)]">Retailer</dt>
              <dd className="capitalize text-[var(--color-ink)]">{product.source}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-faint)]">Category</dt>
              <dd className="text-[var(--color-ink)]">{CATEGORY_LABELS[product.category]}</dd>
            </div>
            {product.delivery && (
              <div>
                <dt className="text-[var(--color-ink-faint)]">Delivery</dt>
                <dd className="text-[var(--color-ink)]">{product.delivery}</dd>
              </div>
            )}
          </dl>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => window.open(product.url, "_blank", "noopener,noreferrer")}
            >
              Visit product
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant={isComparing ? "secondary" : "outline"}
              onClick={() => toggleCompare(product.id)}
            >
              {isComparing && <Check className="h-4 w-4" />}
              Compare
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <AIAnalysis item={item} classification={classification} />
        </div>
      </div>

      <div className="mt-6">
        <RetailerInfo product={product} />
      </div>
    </div>
  );
}
