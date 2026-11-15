import { useState } from "react";
import { KeyRound } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { SearchSuggestions } from "../components/SearchSuggestions";
import { FaqAccordion } from "../components/FaqAccordion";
import { FAQS, faqJsonLd } from "../data/faqs";
import { useSearch } from "../context/SearchContext";
import { useApiKeys } from "../context/ApiKeyContext";

const STEPS = [
  {
    title: "Describe what you want",
    text: "Type what you need: “wireless headphones under $100 with good battery life” No filters or forms Needed.",
  },
  {
    title: "AI searches and ranks",
    text: "Product Finder's agents search real listings and score every product on price, rating, reviews and how well it fits your request.",
  },
  {
    title: "Compare and decide",
    text: "See the top recommendations, read why each one matched, and compare products side by side before you buy from marketplace.",
  },
];

export default function Home() {
  const { runSearch, status } = useSearch();
  const { hasLlmKey, openKeyModal } = useApiKeys();
  const [value, setValue] = useState("");

  function handleSubmit(q: string) {
    void runSearch(q, { navigateOnResult: true });
  }

  return (
    <>
      <title>Product Finder</title>
      <meta
        name="description"
        content="Describe what you want and Product Finder's AI searches real products, ranks them with a transparent match score, and lets you compare prices and ratings side by side."
      />
      <link rel="canonical" href="https://productfinder-ai.vercel.app/" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 sm:px-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
            Product Finder
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Find the right product.
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
          Smarter product searches start here.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 pb-8 pt-6 max-sm:pb-32 sm:pb-12">
          {!hasLlmKey && (
            <button
              onClick={openKeyModal}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)]"
            >
              <KeyRound className="h-4 w-4" />
              Add your API key to get started
            </button>
          )}
          <SearchBar
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            loading={status === "loading"}
            autoFocus
          />
          <SearchSuggestions onPick={(v) => handleSubmit(v)} />
        </div>
      </div>

      <section
        aria-labelledby="how-it-works"
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      >
        <h2
          id="how-it-works"
          className="mb-8 text-center text-2xl font-medium tracking-tight text-[var(--color-ink)]"
        >
          How Product Finder works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <p className="mb-2 text-xs font-medium text-[var(--color-accent)]">
                Step {i + 1}
              </p>
              <h3 className="mb-1.5 text-base font-medium text-[var(--color-ink)]">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="mx-auto max-w-2xl scroll-mt-24 px-4 pb-16 sm:px-6"
      >
        <h2
          id="faq-heading"
          className="mb-6 text-center text-2xl font-medium tracking-tight text-[var(--color-ink)]"
        >
          Frequently asked questions
        </h2>
        <FaqAccordion items={FAQS} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>
    </>
  );
}