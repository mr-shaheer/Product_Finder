import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { ComparisonTable } from "../components/ComparisonTable";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/Button";

export default function Compare() {
  const navigate = useNavigate();
  const { products, compareIds, toggleCompare, clearCompare } = useSearch();

  const items = products.filter((p) => compareIds.includes(p.product.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <button
        onClick={() => navigate("/results")}
        className="mb-5 flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-[var(--color-ink)] sm:text-2xl">Compare</h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            <X className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {items.length < 2 ? (
        <EmptyState
          title="Select at least 2 products to compare"
          description="Go back to your results and tap Compare on the products you want to line up side by side."
          action={
            <Button size="sm" onClick={() => navigate("/results")}>
              Back to results
            </Button>
          }
        />
      ) : (
        <>
          <ComparisonTable items={items} />
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.product.id}
                onClick={() => toggleCompare(item.product.id)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-3 w-3" />
                Remove {item.product.title.slice(0, 24)}
                {item.product.title.length > 24 ? "…" : ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
