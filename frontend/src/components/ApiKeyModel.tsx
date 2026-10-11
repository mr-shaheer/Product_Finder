import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useApiKeys } from "../context/ApiKeyContext";
import { validateKeys, type KeyCheck } from "../api/productFinderApi";
import { Button } from "./Button";

interface KeyFieldProps {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  linkText: string;
  linkHref: string;
  result: KeyCheck | null | undefined;
  autoFocus?: boolean;
}

function KeyField({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  linkText,
  linkHref,
  result,
  autoFocus,
}: KeyFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
        <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span>
      </div>
      
      <div className="flex items-center rounded-[28px] border border-[var(--color-border)] bg-white px-4 py-1.5 shadow-[var(--shadow-float)] transition-colors focus-within:border-[var(--color-accent)] sm:px-5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className="min-h-[40px] flex-1 py-[6px] bg-transparent text-[15px] leading-relaxed text-[var(--color-ink)] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-[var(--color-ink-faint)] sm:text-base"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide key" : "Show key"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
      >
        {linkText}
        <ExternalLink className="h-3 w-3" />
      </a>

      {result && (
        <p
          className={`mt-1 flex items-center gap-1.5 text-xs ${
            result.valid ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
          }`}
        >
          {result.valid ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {result.message}
        </p>
      )}
    </div>
  );
}

function ApiKeyModalContent() {
  const { keys, saveKeys, closeKeyModal } = useApiKeys();
  const [gemini, setGemini] = useState(keys.gemini);
  const [serpapi, setSerpapi] = useState(keys.serpapi);
  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState<{
    gemini: KeyCheck | null;
    serpapi: KeyCheck | null;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeKeyModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeKeyModal]);

  async function handleTest() {
    setTesting(true);
    setTestError(null);
    setChecks(null);
    try {
      const res = await validateKeys({ gemini: gemini.trim(), serpapi: serpapi.trim() });
      setChecks(res);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Could not test the keys.");
    } finally {
      setTesting(false);
    }
  }

  const canSave = gemini.trim().length > 0;
  const canTest = (gemini.trim() || serpapi.trim()) && !testing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={closeKeyModal}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-float)]"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <KeyRound className="h-4 w-4" />
            </span>
            <h2 id="api-key-title" className="text-lg font-medium text-[var(--color-ink)]">
              Your API keys
            </h2>
          </div>
          <button
            onClick={closeKeyModal}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Product Finder runs on your own keys. They are saved only in this browser and
          sent with each search. The server never stores them.
        </p>

        <div className="flex flex-col gap-5">
          <KeyField
            id="gemini-key"
            label="Gemini API key"
            hint="Required"
            placeholder="AIza..."
            value={gemini}
            onChange={setGemini}
            linkText="Get a free Gemini key"
            linkHref="https://aistudio.google.com/apikey"
            result={checks?.gemini}
            autoFocus
          />
          <KeyField
            id="serpapi-key"
            label="SerpApi key"
            hint="Optional, for live products"
            placeholder="Paste your SerpApi key"
            value={serpapi}
            onChange={setSerpapi}
            linkText="Get a SerpApi key"
            linkHref="https://serpapi.com/manage-api-key"
            result={checks?.serpapi}
          />
        </div>

        <p className="mt-4 text-xs text-[var(--color-ink-faint)]">
          Without a SerpApi key you will see sample results instead of live listings.
        </p>

        {testError && (
          <p className="mt-3 text-xs text-[var(--color-negative)]">{testError}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleTest} disabled={!canTest}>
            {testing && <Loader2 className="h-4 w-4 animate-spin" />}
            Test keys
          </Button>
          <Button
            onClick={() => saveKeys({ gemini, serpapi })}
            disabled={!canSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ApiKeyModal() {
  const { modalOpen } = useApiKeys();
  // Mounted only while open, so the inputs reset to the saved keys each time.
  return modalOpen ? <ApiKeyModalContent /> : null;
}