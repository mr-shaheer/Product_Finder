import pytest
from fastapi.testclient import TestClient

from api.app import app
from providers import litellm_model_name
from services.cache import check_cache, set_cache
from services.fetch_layer import fetch_products
from services.llm_config import LLMConfigError, resolve_llm_config
from services.request_context import serpapi_key_var
from tools.classify import classify_query_raw
from tools.scoring import extract_budget

client = TestClient(app)


def test_extract_budget():
    assert extract_budget("wireless headphones under $80") == 80.0
    assert extract_budget("laptop up to 1200") == 1200.0
    assert extract_budget("just a plain query") is None


def test_classify_confident_and_unsure():
    assert classify_query_raw("wireless headphones").confidence >= 0.65
    assert classify_query_raw("something nice").confidence < 0.65


def test_no_serpapi_key_uses_sample_data_and_does_not_cache():
    serpapi_key_var.set(None)
    results = fetch_products("electronics", "unit test query")
    assert results and all(r["source"] == "fallback" for r in results)
    assert check_cache("electronics:unit test query") is None


def test_cache_roundtrip():
    set_cache("k", [{"id": "1"}])
    assert check_cache("k") == [{"id": "1"}]


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_search_without_key_returns_missing_key_event():
    resp = client.post("/api/search/stream", json={"session_id": "t", "query": "headphones"})
    assert resp.status_code == 200
    assert '"code": "missing_key"' in resp.text


def test_validate_without_keys_returns_nulls():
    resp = client.post("/api/keys/validate")
    assert resp.json() == {"llm": None, "serpapi": None}


# ---- multi-provider config ------------------------------------------------

def test_model_name_prefixing():
    assert litellm_model_name("gemini", "") == "gemini/gemini-2.5-flash"
    assert litellm_model_name("openai", "gpt-4o") == "openai/gpt-4o"
    assert litellm_model_name("openrouter", "openai/gpt-4o-mini") == "openrouter/openai/gpt-4o-mini"
    # A user can't hop to another LiteLLM backend by typing its prefix:
    assert litellm_model_name("openai", "bedrock/foo") == "openai/bedrock/foo"


def test_legacy_gemini_header_still_works():
    cfg = resolve_llm_config(None, None, None, None, legacy_gemini_key="AIza-test")
    assert cfg.provider == "gemini" and cfg.api_key == "AIza-test"


def test_missing_key_error():
    with pytest.raises(LLMConfigError) as e:
        resolve_llm_config("openai", None, "", None)
    assert e.value.code == "missing_key"


def test_unknown_provider_rejected():
    with pytest.raises(LLMConfigError):
        resolve_llm_config("nope", None, "k", None)


def test_custom_provider_needs_model_and_url():
    with pytest.raises(LLMConfigError):
        resolve_llm_config("custom", "m", "k", None)
    with pytest.raises(LLMConfigError):
        resolve_llm_config("custom", "", "k", "https://api.example.com/v1")


def test_custom_base_url_blocks_private_and_http():
    with pytest.raises(LLMConfigError):
        resolve_llm_config("custom", "m", "k", "https://127.0.0.1/v1")
    with pytest.raises(LLMConfigError):
        resolve_llm_config("custom", "m", "k", "http://example.com/v1")


def test_base_url_ignored_for_normal_providers():
    cfg = resolve_llm_config("openai", None, "k", "https://evil.example.com")
    assert cfg.base_url is None