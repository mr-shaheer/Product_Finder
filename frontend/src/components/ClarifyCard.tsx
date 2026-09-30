import { useState } from "react";
import { Sparkle } from "lucide-react";
import { Button } from "./Button";

export function ClarifyCard({
  message,
  onReply,
  loading,
}: {
  message: string;
  onReply: (reply: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onReply(value.trim());
    setValue("");
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkle className="h-4 w-4 text-[var(--color-accent)]" />
        <p className="text-sm font-medium text-[var(--color-accent)]">Quick question</p>
      </div>
      <p className="mb-4 text-[15px] leading-relaxed text-[var(--color-ink)]">{message}</p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your answer..."
          disabled={loading}
          className="flex-1 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
        />
        <Button type="submit" size="sm" disabled={!value.trim() || loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
