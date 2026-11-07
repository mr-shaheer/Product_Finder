export type ProviderId =
  | "gemini"
  | "openai"
  | "anthropic"
  | "groq"
  | "openrouter"
  | "mistral"
  | "deepseek"
  | "together"
  | "custom";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  keyPlaceholder: string;
  keyUrl: string;
  keyLinkText: string;
  defaultModel: string;
  models: string[];
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    keyPlaceholder: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey",
    keyLinkText: "Get a free Gemini key",
    defaultModel: "gemini-3.6-flash",
    models: ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"],
  },
  {
    id: "openai",
    label: "OpenAI",
    keyPlaceholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
    keyLinkText: "Get an OpenAI key",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    keyPlaceholder: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyLinkText: "Get an Anthropic key",
    defaultModel: "claude-haiku-4-5",
    models: ["claude-haiku-4-5", "claude-sonnet-4-5"],
  },
  {
    id: "groq",
    label: "Groq",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    keyLinkText: "Get a Groq key",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyPlaceholder: "sk-or-...",
    keyUrl: "https://openrouter.ai/keys",
    keyLinkText: "Get an OpenRouter key",
    defaultModel: "openai/gpt-4o-mini",
    models: ["openai/gpt-4o-mini", "anthropic/claude-haiku-4-5", "google/gemini-2.5-flash"],
  },
  {
    id: "mistral",
    label: "Mistral",
    keyPlaceholder: "Paste your Mistral key",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyLinkText: "Get a Mistral key",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest"],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyPlaceholder: "sk-...",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyLinkText: "Get a DeepSeek key",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat"],
  },
  {
    id: "together",
    label: "Together AI",
    keyPlaceholder: "Paste your Together key",
    keyUrl: "https://api.together.ai/settings/api-keys",
    keyLinkText: "Get a Together key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    keyPlaceholder: "Paste your API key",
    keyUrl: "",
    keyLinkText: "",
    defaultModel: "",
    models: [],
  },
];

export function getProvider(id: ProviderId): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}