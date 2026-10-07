from __future__ import annotations

import json
import os

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.agent_runtime import reset_session, stream_search
from api.rate_limit import is_rate_limited
from services.key_check import check_gemini_key, check_serpapi_key

load_dotenv(find_dotenv())

app = FastAPI(title="Product Finder API", version="0.2.0")

_origins = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=False,  # no cookies are used anymore
    allow_methods=["*"],
    allow_headers=["*"],      # lets the browser send X-Gemini-Key / X-Serpapi-Key
)


class SearchRequest(BaseModel):
    session_id: str = Field(default="anon", max_length=100)
    query: str = Field(min_length=1, max_length=1000)


class ResetRequest(BaseModel):
    session_id: str = Field(default="anon", max_length=100)


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/session/reset")
def reset(payload: ResetRequest) -> dict:
    reset_session(payload.session_id)
    return {"status": "reset", "session_id": payload.session_id}


@app.post("/api/keys/validate")
async def validate_keys(
    request: Request,
    x_gemini_key: str | None = Header(default=None),
    x_serpapi_key: str | None = Header(default=None),
) -> dict:
    """Lets the key box say 'this key works' before the visitor searches."""
    if is_rate_limited(request):
        return {
            "gemini": {"valid": False, "message": "Too many requests. Wait a minute and try again."},
            "serpapi": None,
        }

    gemini = serpapi = None
    if x_gemini_key and x_gemini_key.strip():
        gemini = await check_gemini_key(x_gemini_key.strip())
    if x_serpapi_key and x_serpapi_key.strip():
        serpapi = await check_serpapi_key(x_serpapi_key.strip())
    return {"gemini": gemini, "serpapi": serpapi}


@app.post("/api/search/stream")
async def search_stream(
    payload: SearchRequest,
    request: Request,
    x_gemini_key: str | None = Header(default=None),
    x_serpapi_key: str | None = Header(default=None),
) -> StreamingResponse:
    """
    Server-Sent Events stream of real backend progress. The visitor's own keys
    arrive in headers, are used for this one request, and are never stored or logged.
    """

    async def event_generator():
        if is_rate_limited(request):
            yield _sse({
                "type": "error",
                "code": "rate_limited",
                "message": "Too many requests. Please wait a minute and try again.",
            })
            return

        gemini_key = (x_gemini_key or "").strip()
        if not gemini_key:
            yield _sse({
                "type": "error",
                "code": "missing_key",
                "message": "Add your Gemini API key (key icon, top right) to start searching.",
            })
            return

        serpapi_key = (x_serpapi_key or "").strip() or None

        async for event in stream_search(payload.session_id, payload.query, gemini_key, serpapi_key):
            yield _sse(event)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )