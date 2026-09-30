import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-ink-faint)]">
        {icon ?? <SearchX className="h-5 w-5" />}
      </div>
      <p className="text-[15px] font-medium text-[var(--color-ink)]">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">{description}</p>
      )}
      {action}
    </div>
  );
}
