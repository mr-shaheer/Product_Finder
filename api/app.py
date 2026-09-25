from __future__ import annotations

import json
import os

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.agent_runtime import reset_session, stream_search

load_dotenv(find_dotenv())

app = FastAPI(title="Product Finder API", version="0.1.0")

_origins = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    session_id: str
    query: str


class ResetRequest(BaseModel):
    session_id: str


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/session/reset")
def reset(payload: ResetRequest) -> dict:
    reset_session(payload.session_id)
    return {"status": "reset", "session_id": payload.session_id}


@app.post("/api/search/stream")
async def search_stream(payload: SearchRequest) -> StreamingResponse:
    """
    Server-Sent Events stream of real backend progress, ending with a `done`
    event that carries the actual structured search results (or a `blocked`
    / `error` event for guardrail / turn-limit failures).
    """

    async def event_generator():
        async for event in stream_search(payload.session_id, payload.query):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
