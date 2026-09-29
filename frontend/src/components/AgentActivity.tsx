import { Check } from "lucide-react";
import type { SearchStreamEvent } from "../types/product";
import { CATEGORY_LABELS } from "../types/product";

type StepStatus = "pending" | "active" | "done";

interface Step {
  key: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

function deriveSteps(events: SearchStreamEvent[]): Step[] {
  const calledTools = new Set(
    events.filter((e) => e.type === "tool_called").map((e) => e.tool)
  );
  const classified = events.find((e) => e.type === "classified");
  const searched = events.find((e) => e.type === "searched");
  const scored = events.find((e) => e.type === "scored");

  const step1: Step = {
    key: "understand",
    label: "Understanding your request",
    status: classified || calledTools.has("classify_query") ? "done" : "active",
  };

  const step2: Step = {
    key: "classify",
    label: "Identifying product category",
    status: classified
      ? "done"
      : calledTools.has("classify_query")
        ? "active"
        : "pending",
    detail:
      classified && classified.type === "classified"
        ? CATEGORY_LABELS[classified.category]
        : undefined,
  };

  const step3: Step = {
    key: "search",
    label: "Searching available products",
    status: searched
      ? "done"
      : calledTools.has("search_products")
        ? "active"
        : "pending",
    detail: searched && searched.type === "searched" ? `${searched.count} found` : undefined,
  };

  const step4: Step = {
    key: "rank",
    label: "Ranking matching products",
    status: scored
      ? "done"
      : calledTools.has("normalize_and_score_products")
        ? "active"
        : "pending",
    detail: scored && scored.type === "scored" ? `${scored.count} ranked` : undefined,
  };

  return [step1, step2, step3, step4];
}

function StepRow({ step }: { step: Step }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          step.status === "done"
            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
            : step.status === "active"
              ? "border-[var(--color-accent)]"
              : "border-[var(--color-border-strong)]"
        }`}
      >
        {step.status === "done" && <Check className="h-3 w-3" strokeWidth={3} />}
        {step.status === "active" && (
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[var(--color-accent)]" />
        )}
      </span>
      <span
        className={`text-sm ${
          step.status === "pending" ? "text-[var(--color-ink-faint)]" : "text-[var(--color-ink)]"
        }`}
      >
        {step.label}
      </span>
      {step.detail && (
        <span className="ml-auto text-xs text-[var(--color-ink-muted)]">{step.detail}</span>
      )}
    </li>
  );
}

export function AgentActivity({ events }: { events: SearchStreamEvent[] }) {
  const steps = deriveSteps(events);

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">
        Finding products for you
      </p>
      <ul>
        {steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </ul>
    </div>
  );
}
