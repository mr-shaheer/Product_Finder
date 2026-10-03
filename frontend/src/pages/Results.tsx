import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { AgentActivity } from "../components/AgentActivity";
import { ClarifyCard } from "../components/ClarifyCard";
import { ProductGrid } from "../components/ProductGrid";
import { ProductGridSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { CompareBar } from "../components/CompareBar";
import { Button } from "../components/Button";
import type { ScoredProduct } from "../types/product";

type SortKey = "match" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "match", label: "Best Match" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Rating" },
];

function sortProducts(products: ScoredProduct[], key: SortKey): ScoredProduct[] {
  const copy = [...products];
  switch (key) {
    case "price-asc":
      return copy.sort((a, b) => a.product.price - b.product.price);
    case "price-desc":
      return copy.sort((a, b) => b.product.price - a.product.price);
    case "rating":
      return copy.sort((a, b) => (b.product.rating ?? -1) - (a.product.rating ?? -1));
    case "match":
    default:
      return copy.sort((a, b) => b.total_score - a.total_score);
  }
}

export default function Results() {
  const navigate = useNavigate();
  const {
    status,
    query,
    events,
    products,
    message,
    errorMessage,
    compareIds,
    toggleCompare,
    clearCompare,
    runSearch,
    startNewSearch,
  } = useSearch();
  const [sortBy, setSortBy] = useState<SortKey>("match");

  const sorted = useMemo(() => sortProducts(products, sortBy), [products, sortBy]);

  if (status === "idle") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="No search yet"
          description="Start a search from the home page to see ranked product results here."
          action={
            <Button size="sm" onClick={() => navigate("/")}>
              Go to search
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-6">
        <p className="text-xs font-medium text-[var(--color-ink-faint)]">Search query</p>
        <h1 className="text-xl font-medium leading-snug text-[var(--color-ink)] sm:text-2xl">
          “{query}”
        </h1>
        {status === "done" && (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>
        )}
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-6 py-10">
          <AgentActivity events={events} />
          <ProductGridSkeleton count={3} />
        </div>
      )}

      {status === "clarifying" && message && (
        <div className="flex justify-center py-6">
          <ClarifyCard
            message={message}
            loading={false}
            onReply={(reply) => void runSearch(reply)}
          />
        </div>
      )}

      {status === "blocked" && (
        <ErrorState kind="blocked" message={errorMessage ?? "This request can't be processed."} />
      )}

      {status === "error" && (
        <ErrorState
          kind="limit"
          message={errorMessage ?? "Something went wrong."}
          onRetry={startNewSearch}
          retryLabel="Start a new search"
        />
      )}

      {status === "done" && products.length === 0 && (
        <EmptyState
          title="No products found for this search."
          description="Try rephrasing your query — a different brand, budget, or a more general term can help."
          action={
            <Button size="sm" onClick={() => navigate("/")}>
              Try another search
            </Button>
          }
        />
      )}

      {status === "done" && products.length > 0 && (
        <>
          {(() => {
            const byScore = [...products].sort((a, b) => b.total_score - a.total_score);
            const top = byScore.slice(0, 3);
            const topIds = new Set(top.map((p) => p.product.id));
            const rest = sorted.filter((p) => !topIds.has(p.product.id));

            return (
              <>
                {top.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-3 text-sm font-medium text-[var(--color-ink)]">
                      Top Recommendations
                    </h2>
                    <ProductGrid
                      products={top}
                      compareIds={compareIds}
                      onToggleCompare={toggleCompare}
                      ranked
                    />
                  </div>
                )}

                {rest.length > 0 && (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-medium text-[var(--color-ink)]">
                        All results
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setSortBy(opt.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              sortBy === opt.key
                                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ProductGrid
                      products={rest}
                      compareIds={compareIds}
                      onToggleCompare={toggleCompare}
                    />
                  </>
                )}
              </>
            );
          })()}
          
        </>
      )}

      <CompareBar count={compareIds.length} onClear={clearCompare} />
    </div>
  );
}
