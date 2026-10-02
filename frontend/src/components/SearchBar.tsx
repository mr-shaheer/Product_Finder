import { useRef, useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = "What are you looking for?",
  autoFocus = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-[28px] border bg-white px-4 py-3 shadow-[var(--shadow-float)] transition-colors sm:px-5 sm:py-3.5 ${
          focused ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
        }`}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={1}
          autoFocus={autoFocus}
          disabled={loading}
          aria-label="Describe the product you're looking for"
          className="max-h-32 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] disabled:opacity-60 sm:text-base"
        />

        <div className="flex shrink-0 items-center gap-1.5">
          {value && !loading && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!value.trim() || loading}
            aria-label="Search"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-ink)] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[var(--color-ink-faint)]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
