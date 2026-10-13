from fastapi.testclient import TestClient

from api.app import app
from services.cache import check_cache, set_cache
from services.fetch_layer import fetch_products
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
    assert resp.json() == {"gemini": None, "serpapi": None}