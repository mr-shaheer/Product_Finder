import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "../data/faqs";

interface FaqAccordionProps {
  items: FaqItem[];
  /** id of the item that starts expanded. */
  defaultOpenId?: string;
  className?: string;
}

export function FaqAccordion({ items, defaultOpenId, className = "" }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;

    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % items.length;
        break;
      case "ArrowUp":
        next = (index - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    triggerRefs.current[next]?.focus();
  }

  return (
    <div
      className={`divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      {items.map((item, index) => {
        const open = openId === item.id;
        const triggerId = `faq-trigger-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                ref={(element) => {
                  triggerRefs.current[index] = element;
                }}
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className="group flex min-h-12 w-full items-center gap-8 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface)]"
              >
                <span className="flex-1 text-[15px] font-medium text-[var(--color-ink)]">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 motion-reduce:transition-none ${
                    open
                      ? "rotate-180 border-[var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-ink-faint)] group-hover:border-[var(--color-border-strong)] group-hover:text-[var(--color-ink-muted)]"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!open}
              inert={!open}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-5 pt-2 pb-5 pr-12 text-sm leading-relaxed text-[var(--color-ink-muted)] transition-opacity duration-300 motion-reduce:transition-none ${
                    open ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
