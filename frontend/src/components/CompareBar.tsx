import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "./Button";

export function CompareBar({
  count,
  onClear,
}: {
  count: number;
  onClear: () => void;
}) {
  const navigate = useNavigate();
  if (count === 0) return null;

  return (
    <div className="animate-fade-up fixed inset-x-0 bottom-24 z-20 flex justify-center px-4 sm:bottom-28">
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 shadow-[var(--shadow-float)]">
        <span className="text-sm text-[var(--color-ink)]">
          {count} {count === 1 ? "product" : "products"} selected
        </span>
        <button
          onClick={onClear}
          aria-label="Clear comparison selection"
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Button size="sm" onClick={() => navigate("/compare")} disabled={count < 2}>
          Compare
        </Button>
      </div>
    </div>
  );
}
