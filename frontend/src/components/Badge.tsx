import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "positive" | "negative";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-border)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent-soft-border)]",
  positive: "bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-transparent",
  negative: "bg-[var(--color-negative-soft)] text-[var(--color-negative)] border-transparent",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
