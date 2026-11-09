from __future__ import annotations

import litellm
from agents.extensions.models.litellm_model import LitellmModel

from services.llm_config import LLMConfig

_acompletion = litellm.acompletion


async def _acompletion_without_mcp(*args, **kwargs):
    kwargs.setdefault("_skip_mcp_handler", True)
    return await _acompletion(*args, **kwargs)


litellm.acompletion = _acompletion_without_mcp  # type: ignore[assignment]


def build_model(llm: LLMConfig) -> LitellmModel:
    """One model object, routed through LiteLLM for whichever provider the visitor chose."""
    return LitellmModel(
        model=llm.litellm_model,
        api_key=llm.api_key,
        base_url=llm.base_url,
    )


def known_no_tool_support(llm: LLMConfig) -> bool:
    """True only when LiteLLM explicitly says the model can't call tools.

    Unknown models (custom endpoints, brand-new releases) return False so we
    let them try rather than block them.
    """
    info = litellm.model_cost.get(llm.litellm_model)
    return bool(info) and info.get("supports_function_calling") is False