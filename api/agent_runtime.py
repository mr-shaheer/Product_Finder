from __future__ import annotations

import os
from typing import Any, AsyncGenerator
from uuid import uuid4

from agents import (
    Agent,
    InputGuardrailTripwireTriggered,
    MaxTurnsExceeded,
    RunConfig,
    Runner,
)
from agents.stream_events import AgentUpdatedStreamEvent, RunItemStreamEvent

from core_agents.orchestrator import ORCHESTRATOR_MAXTURNS, orchestrator
from core_agents.recommender import recommender
from guardrails import guardrail_agent
from tools.classify import classify_query_raw
from schema import ClassifiedQuery, Product, ScoredProduct

SESSION_DB_PATH = os.environ.get("PRODUCT_FINDER_DB", "conversation.db")

_active_agents: dict[str, Agent] = {}
_turn_counts: dict[str, int] = {}

CONFIDENCE_THRESHOLD = 0.65


def reset_session(session_id: str) -> None:
    """Equivalent of the CLI's `/reset` command for a given session."""
    _active_agents[session_id] = orchestrator
    _turn_counts[session_id] = 0


def _build_run_config(session_id: str, turn_num: int) -> RunConfig:
    return RunConfig(
        workflow_name="product-finder-web",
        trace_id="trace_" + uuid4().hex,
        trace_metadata={
            "session_id": session_id,
            "turn": str(turn_num),
            "env": os.environ.get("APP_ENV", "dev"),
        },
        tracing_disabled="OPENAI_API_KEY" not in os.environ,
    )


def _tool_name_from_raw(raw_item: Any) -> str | None:
    if isinstance(raw_item, dict):
        return raw_item.get("name")
    return getattr(raw_item, "name", None)


async def stream_search(session_id: str, query: str) -> AsyncGenerator[dict[str, Any], None]:
    is_first_turn = session_id not in _active_agents
    active_agent = _active_agents.get(session_id, orchestrator)
    turn = _turn_counts.get(session_id, 0) + 1
    _turn_counts[session_id] = turn

    classification: ClassifiedQuery | None = None
    products_found = 0
    scored_products: list[ScoredProduct] = []
    handoff_agent: str | None = None
    last_tool_name: str | None = None

    try:
        if is_first_turn:
            guardrail_result = await Runner.run(guardrail_agent, query)
            check = guardrail_result.final_output
            if check.is_jailbreak:
                yield {
                    "type": "blocked",
                    "message": "This request can't be processed.",
                }
                return

        if active_agent is orchestrator:
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
        else:
            starting_agent = active_agent

        result = Runner.run_streamed(
            starting_agent,
            query,
            max_turns=ORCHESTRATOR_MAXTURNS,
            run_config=_build_run_config(session_id, turn),
        )

        async for event in result.stream_events():
            if isinstance(event, AgentUpdatedStreamEvent):
                handoff_agent = event.new_agent.name
                yield {"type": "handoff", "agent": handoff_agent}

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

        _active_agents[session_id] = result.last_agent

        final_text = result.final_output
        if not isinstance(final_text, str):
            final_text = str(final_text)

        yield {
            "type": "done",
            "session_id": session_id,
            "agent": result.last_agent.name,
            "handed_off": result.last_agent.name != orchestrator.name,
            "classification": classification.model_dump() if classification else None,
            "products_found": products_found,
            "products": [p.model_dump() for p in scored_products],
            "message": final_text,
        }

    except InputGuardrailTripwireTriggered:
        yield {
            "type": "blocked",
            "message": "This request can't be processed.",
        }

    except MaxTurnsExceeded:
        yield {
            "type": "error",
            "message": "Conversation limit reached for this session. Start a new search to continue.",
        }