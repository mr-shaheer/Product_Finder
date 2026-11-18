from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class Provider:
    id: str
    label: str
    prefix: str        
    default_model: str
    models: tuple[str, ...]


PROVIDERS: dict[str, Provider] = {
    p.id: p
    for p in [
        Provider(
            "gemini", "Google Gemini", "gemini/", "gemini-3.5-flash-lite",
            ("gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"),
        ),
        Provider(
            "openai", "OpenAI", "openai/", "gpt-4o-mini",
            ("gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"),
        ),
        Provider(
            "anthropic", "Anthropic", "anthropic/", "claude-haiku-4-5",
            ("claude-haiku-4-5", "claude-sonnet-4-5"),
        ),
        Provider(
            "groq", "Groq", "groq/", "llama-3.3-70b-versatile",
            ("llama-3.3-70b-versatile", "llama-3.1-8b-instant"),
        ),
        Provider(
            "openrouter", "OpenRouter", "openrouter/", "openai/gpt-4o-mini",
            ("openai/gpt-4o-mini", "anthropic/claude-haiku-4-5", "google/gemini-2.5-flash"),
        ),
        Provider(
            "mistral", "Mistral", "mistral/", "mistral-small-latest",
            ("mistral-small-latest", "mistral-large-latest"),
        ),
        Provider(
            "deepseek", "DeepSeek", "deepseek/", "deepseek-chat",
            ("deepseek-chat",),
        ),
        Provider(
            "together", "Together AI", "together_ai/",
            "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            ("meta-llama/Llama-3.3-70B-Instruct-Turbo",),
        ),
        Provider("custom", "Custom (OpenAI-compatible)", "openai/", "", ()),
    ]
}

DEFAULT_PROVIDER = "gemini"

def get_provider(provider_id: str) -> Provider:
    return PROVIDERS[provider_id]


def litellm_model_name(provider_id: str, model: str) -> str:

    p = get_provider(provider_id)
    model = model.strip() or p.default_model
    if model.startswith(p.prefix):
        return model
    return f"{p.prefix}{model}"