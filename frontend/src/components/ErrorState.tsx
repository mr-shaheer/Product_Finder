import type { ReactNode } from "react";
import { AlertTriangle, ServerCrash, ShieldAlert } from "lucide-react";
import { Button } from "./Button";

type Kind = "network" | "blocked" | "limit" | "generic";

const ICONS: Record<Kind, ReactNode> = {
  network: <ServerCrash className="h-5 w-5" />,
  blocked: <ShieldAlert className="h-5 w-5" />,
  limit: <AlertTriangle className="h-5 w-5" />,
  generic: <AlertTriangle className="h-5 w-5" />,
};

export function ErrorState({
  kind = "generic",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  kind?: Kind;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-negative-soft)] bg-[var(--color-negative-soft)] px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-negative)]">
        {ICONS[kind]}
      </div>
      <p className="max-w-sm text-sm text-[var(--color-ink)]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
