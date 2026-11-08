from __future__ import annotations

import ipaddress
import re
import socket
from dataclasses import dataclass
from urllib.parse import urlparse

from providers import DEFAULT_PROVIDER, PROVIDERS, get_provider, litellm_model_name

_MODEL_RE = re.compile(r"^[A-Za-z0-9._:/\-]{1,120}$")


class LLMConfigError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class LLMConfig:
    provider: str
    model: str            # as the user chose it ("" -> provider default)
    api_key: str
    base_url: str | None = None

    @property
    def provider_label(self) -> str:
        return get_provider(self.provider).label

    @property
    def litellm_model(self) -> str:
        return litellm_model_name(self.provider, self.model)


def validate_base_url(url: str) -> str:
    """Only https, no credentials, and never a private/loopback/internal address."""
    parsed = urlparse(url.strip())
    if parsed.scheme != "https":
        raise LLMConfigError("invalid_config", "The base URL must start with https://")
    if not parsed.hostname or parsed.username or parsed.password:
        raise LLMConfigError("invalid_config", "The base URL is not valid.")

    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise LLMConfigError("invalid_config", "Could not resolve the base URL host.") from None

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_reserved or ip.is_multicast or ip.is_unspecified
        ):
            raise LLMConfigError("invalid_config", "That base URL points to a private address, which is not allowed.")
    return url.strip().rstrip("/")


def resolve_llm_config(
    provider: str | None,
    model: str | None,
    api_key: str | None,
    base_url: str | None,
    legacy_gemini_key: str | None = None,
) -> LLMConfig:
    key = (api_key or "").strip()
    provider_id = (provider or "").strip().lower()

    # Backwards compatibility with the old single X-Gemini-Key header.
    if not key and (legacy_gemini_key or "").strip():
        key = legacy_gemini_key.strip()  # type: ignore[union-attr]
        provider_id = provider_id or "gemini"

    provider_id = provider_id or DEFAULT_PROVIDER

    if not key:
        raise LLMConfigError("missing_key", "Add your API key (key icon, top right) to start searching.")
    if provider_id not in PROVIDERS:
        raise LLMConfigError("invalid_config", f"Unknown provider '{provider_id}'.")

    model_clean = (model or "").strip()
    if model_clean and not _MODEL_RE.match(model_clean):
        raise LLMConfigError("invalid_config", "The model name contains invalid characters.")

    resolved_base: str | None = None
    if provider_id == "custom":
        if not model_clean:
            raise LLMConfigError("invalid_config", "The custom provider needs a model name.")
        if not (base_url or "").strip():
            raise LLMConfigError("invalid_config", "The custom provider needs a base URL.")
        resolved_base = validate_base_url(base_url or "")
    # For every other provider a base URL is ignored on purpose (prevents SSRF).

    return LLMConfig(provider=provider_id, model=model_clean, api_key=key, base_url=resolved_base)