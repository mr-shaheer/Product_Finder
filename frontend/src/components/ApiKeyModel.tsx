import { useCallback, useEffect, useState } from "react";
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
import { PROVIDERS, getProvider, type ProviderId } from "../lib/providers";
import { Button } from "./Button";
import { Dropdown, ComboBox } from "./Dropdown";

const FIELD_SHELL =
  "flex items-center rounded-[28px] border border-[var(--color-border)] bg-white px-4 py-1.5 shadow-[var(--shadow-float)] transition-colors focus-within:border-[var(--color-accent)] sm:px-5";

const INPUT_CLASS =
  "min-h-[40px] flex-1 py-[6px] bg-transparent text-[15px] leading-relaxed text-[var(--color-ink)] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-[var(--color-ink-faint)] sm:text-base";

function FieldHeader({ id, label, hint }: { id: string; label: string; hint: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span>
    </div>
  );
}

function ResultLine({ result }: { result: KeyCheck | null | undefined }) {
  if (!result) return null;
  return (
    <p
      className={`mt-1 flex items-center gap-1.5 text-xs ${
        result.valid ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
      }`}
    >
      {result.valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {result.message}
    </p>
  );
}

interface KeyFieldProps {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  linkText?: string;
  linkHref?: string;
  result?: KeyCheck | null;
  autoFocus?: boolean;
}

function KeyField({
  id, label, hint, placeholder, value, onChange, linkText, linkHref, result, autoFocus,
}: KeyFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <FieldHeader id={id} label={label} hint={hint} />
      <div className={FIELD_SHELL}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={INPUT_CLASS}
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

      {linkHref && linkText && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
        >
          {linkText}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <ResultLine result={result} />
    </div>
  );
}

function TextField({
  id, label, hint, placeholder, value, onChange, listId, children,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  listId?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <FieldHeader id={id} label={label} hint={hint} />
      <div className={FIELD_SHELL}>
        <input
          id={id}
          type="text"
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={INPUT_CLASS}
        />
      </div>
      {children}
    </div>
  );
}

function ApiKeyModalContent() {
  const { keys, saveKeys, saveModel, closeKeyModal } = useApiKeys();
  const [provider, setProvider] = useState<ProviderId>(keys.provider);
  const [model, setModel] = useState(keys.model);
  const [baseUrl, setBaseUrl] = useState(keys.baseUrl);
  const [llmKeys, setLlmKeys] = useState(keys.llmKeys);
  const [serpapi, setSerpapi] = useState(keys.serpapi);

  // Closing must not discard a cleared model: blank = provider default.
  const closeAndKeepModel = useCallback(() => {
    if (provider === keys.provider) saveModel(model);
    closeKeyModal();
  }, [provider, keys.provider, model, saveModel, closeKeyModal]);

  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState<{
    llm: KeyCheck | null;
    serpapi: KeyCheck | null;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const info = getProvider(provider);
  const isCustom = provider === "custom";
  const llmKey = llmKeys[provider] ?? "";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAndKeepModel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAndKeepModel]);

  function currentSettings() {
    return { provider, model, baseUrl, llmKeys, serpapi };
  }

  function handleProviderChange(next: ProviderId) {
    setProvider(next);
    setModel("");     // go back to the new provider's default model
    setChecks(null);
    setTestError(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestError(null);
    setChecks(null);
    try {
      const res = await validateKeys(currentSettings());
      setChecks(res);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Could not test the keys.");
    } finally {
      setTesting(false);
    }
  }

  const canSave =
    llmKey.trim().length > 0 &&
    (!isCustom || (model.trim().length > 0 && baseUrl.trim().length > 0));
  const canTest = (llmKey.trim() || serpapi.trim()) && !testing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={closeAndKeepModel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[var(--shadow-float)]"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <KeyRound className="h-4 w-4" />
            </span>
            <h2 id="api-key-title" className="text-lg font-medium text-[var(--color-ink)]">
              Your AI model &amp; keys
            </h2>
          </div>
          <button
            onClick={closeAndKeepModel}
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
        <div>
          <FieldHeader id="llm-provider" label="AI provider" hint="Required" />
          <Dropdown
            id="llm-provider"
            value={provider}
            onChange={(v) => handleProviderChange(v as ProviderId)}
            options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
          />
        </div>

        <div>
          <FieldHeader
            id="llm-model"
            label="Model"
            hint={isCustom ? "Required" : "Optional, blank = default"}
          />
          <ComboBox
            id="llm-model"
            value={model}
            onChange={setModel}
            suggestions={info.models}
            placeholder={info.defaultModel || "e.g. llama-3.1-70b"}
          />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
            Pick a suggestion or type any model name. It must support tool calling.
          </p>
        </div>

          {isCustom && (
            <TextField
              id="llm-base-url"
              label="Base URL"
              hint="Required, https only"
              placeholder="https://your-server.example.com/v1"
              value={baseUrl}
              onChange={setBaseUrl}
            />
          )}

          <KeyField
            id="llm-key"
            label={`${info.label} API key`}
            hint="Required"
            placeholder={info.keyPlaceholder}
            value={llmKey}
            onChange={(v) => setLlmKeys((prev) => ({ ...prev, [provider]: v }))}
            linkText={info.keyLinkText}
            linkHref={info.keyUrl}
            result={checks?.llm}
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

        {testError && <p className="mt-3 text-xs text-[var(--color-negative)]">{testError}</p>}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleTest} disabled={!canTest}>
            {testing && <Loader2 className="h-4 w-4 animate-spin" />}
            Test keys
          </Button>
          <Button onClick={() => saveKeys(currentSettings())} disabled={!canSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ApiKeyModal() {
  const { modalOpen } = useApiKeys();
  return modalOpen ? <ApiKeyModalContent /> : null;
}