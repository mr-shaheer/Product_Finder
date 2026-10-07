from __future__ import annotations

import logging
import os
from typing import Any, AsyncGenerator
from uuid import uuid4

from agents import MaxTurnsExceeded, RunConfig, Runner
from agents.stream_events import AgentUpdatedStreamEvent, RunItemStreamEvent
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    OpenAIError,
    PermissionDeniedError,
    RateLimitError,
)

from core_agents.orchestrator import ORCHESTRATOR_MAXTURNS, build_orchestrator
from core_agents.recommender import build_recommender
from guardrails import build_guardrail_agent
from models import build_models
from schema import ClassifiedQuery, ScoredProduct
from services.request_context import serpapi_key_var
from tools.classify import classify_query_raw

logger = logging.getLogger("product_finder")

CONFIDENCE_THRESHOLD = 0.65
MAX_QUERY_CHARS = 300


def reset_session(session_id: str) -> None:
    """Kept so the frontend's 'new search' call still works. The backend is
    stateless now (nothing is remembered between requests), so nothing to reset."""
    return None


def _build_run_config(session_id: str) -> RunConfig:
    return RunConfig(
        workflow_name="product-finder-web",
        trace_id="trace_" + uuid4().hex,
        trace_metadata={"session_id": session_id, "env": os.environ.get("APP_ENV", "dev")},
        tracing_disabled="OPENAI_API_KEY" not in os.environ,
    )


def _tool_name_from_raw(raw_item: Any) -> str | None:
    if isinstance(raw_item, dict):
        return raw_item.get("name")
    return getattr(raw_item, "name", None)


def _friendly_error(exc: Exception) -> dict[str, Any]:
    """Turn provider errors into messages the visitor can act on."""
    text = str(exc).lower()

    if isinstance(exc, (AuthenticationError, PermissionDeniedError)) or (
        isinstance(exc, BadRequestError) and "api key" in text
    ):
        return {
            "type": "error",
            "code": "invalid_key",
            "message": "Gemini rejected your API key. Open the key icon (top right) and check it.",
        }
    if isinstance(exc, RateLimitError):
        return {
            "type": "error",
            "code": "rate_limited",
            "message": "Your Gemini key hit its rate limit (common on the free tier). Wait a minute and try again.",
        }
    if isinstance(exc, (APIConnectionError, APITimeoutError)):
        return {
            "type": "error",
            "code": "provider_error",
            "message": "Could not reach Gemini. Please try again in a moment.",
        }
    return {
        "type": "error",
        "code": "server_error",
        "message": "Something went wrong while searching. Please try again.",
    }


async def stream_search(
    session_id: str,
    query: str,
    gemini_key: str,
    serpapi_key: str | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    query = query.strip()[:MAX_QUERY_CHARS]

    # Make the SerpApi key visible to the search tools for THIS request only.
    serpapi_key_var.set(serpapi_key)

    classification: ClassifiedQuery | None = None
    products_found = 0
    scored_products: list[ScoredProduct] = []
    last_tool_name: str | None = None

    try:
        default_model, frontier_model = build_models(gemini_key)
        guardrail_agent = build_guardrail_agent(default_model)
        recommender = build_recommender(frontier_model)
        orchestrator = build_orchestrator(default_model, recommender)
        run_config = _build_run_config(session_id)

        guardrail_result = await Runner.run(guardrail_agent, query, run_config=run_config)
        if guardrail_result.final_output.is_jailbreak:
            yield {"type": "blocked", "message": "This request can't be processed."}
            return

        # Every request is independent: classify, then start at the right agent.
        classification = classify_query_raw(query)
        if classification.confidence >= CONFIDENCE_THRESHOLD:
            starting_agent = recommender
            yield {
                "type": "classified",
                "category": classification.category.value,
                "confidence": classification.confidence,
            }
        else:
            starting_agent = orchestrator
            classification = None

        result = Runner.run_streamed(
            starting_agent,
            query,
            max_turns=ORCHESTRATOR_MAXTURNS,
            run_config=run_config,
        )

        async for event in result.stream_events():
            if isinstance(event, AgentUpdatedStreamEvent):
                yield {"type": "handoff", "agent": event.new_agent.name}

            elif isinstance(event, RunItemStreamEvent):
                if event.name == "tool_called":
                    last_tool_name = _tool_name_from_raw(event.item.raw_item)
                    yield {"type": "tool_called", "tool": last_tool_name}

                elif event.name == "tool_output":
                    output = event.item.output

                    if last_tool_name == "classify_query" and isinstance(output, ClassifiedQuery):
                        classification = output
                        yield {
                            "type": "classified",
                            "category": output.category.value,
                            "confidence": output.confidence,
                        }

                    elif last_tool_name == "search_products" and isinstance(output, list):
                        products_found = len(output)
                        yield {"type": "searched", "count": products_found}

                    elif last_tool_name == "normalize_and_score_products" and isinstance(output, list):
                        scored_products = [o for o in output if isinstance(o, ScoredProduct)]
                        yield {"type": "scored", "count": len(scored_products)}

        final_text = result.final_output
        if not isinstance(final_text, str):
            final_text = str(final_text)

        used_fallback = bool(scored_products) and all(
            sp.product.source.lower() == "fallback" for sp in scored_products
        )

        yield {
            "type": "done",
            "session_id": session_id,
            "agent": result.last_agent.name,
            "handed_off": result.last_agent.name != orchestrator.name,
            "classification": classification.model_dump() if classification else None,
            "products_found": products_found,
            "products": [p.model_dump() for p in scored_products],
            "used_fallback": used_fallback,
            "message": final_text,
        }

    except MaxTurnsExceeded:
        yield {
            "type": "error",
            "code": "max_turns",
            "message": "This search took too many steps. Try rephrasing it.",
        }

    except OpenAIError as exc:
        logger.warning("Provider error: %s", type(exc).__name__)
        yield _friendly_error(exc)

    except Exception as exc:  # never leak internals (or keys) to the browser
        logger.exception("Unexpected error in stream_search: %s", type(exc).__name__)
        yield _friendly_error(exc)