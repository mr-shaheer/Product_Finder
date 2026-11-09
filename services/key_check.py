import logging

import httpx
import litellm

from services.llm_config import LLMConfig

logger = logging.getLogger("product_finder")

# Gemini 3.x models can spend time "thinking" before the first token, so a
# tiny key-check still needs more than the old 15s. Keep the worst case
# (timeout x attempts) below the Vercel function maxDuration (60s).
KEY_CHECK_TIMEOUT_SECONDS = 25


def _redact(text: str, key: str) -> str:
    return text.replace(key, "***") if key else text


async def check_llm_key(config: LLMConfig) -> dict:
    """
    Provider-agnostic check: a 1-few-token completion. (LiteLLM has no uniform
    'list models' call, so this is the portable way. Costs a negligible amount.)
    """
    label = config.provider_label
    try:
        await litellm.acompletion(
            model=config.litellm_model,
            messages=[{"role": "user", "content": "Reply with: ok"}],
            max_tokens=8,
            api_key=config.api_key,
            api_base=config.base_url,
            timeout=KEY_CHECK_TIMEOUT_SECONDS,
            num_retries=1,
        )
        return {"valid": True, "message": f"{label} key works."}
    except (litellm.AuthenticationError, litellm.PermissionDeniedError):
        return {"valid": False, "message": f"{label} rejected this key. Check that you copied it fully."}
    except litellm.RateLimitError:
        return {"valid": True, "message": f"Key accepted ({label} is rate-limiting right now)."}
    except litellm.NotFoundError:
        return {"valid": False, "message": f"{label} has no model called '{config.model or 'default'}'. Check the model name."}
    except litellm.BadRequestError as e:
        if "api key" in str(e).lower():
            return {"valid": False, "message": f"{label} rejected this key. Check that you copied it fully."}
        return {"valid": False, "message": f"{label} rejected the request. Check the model name."}
    except (litellm.APIConnectionError, litellm.Timeout) as e:
        logger.error(
            "Key check: could not reach %s (%s): %s",
            label,
            type(e).__name__,
            _redact(str(e), config.api_key)[:800],
        )
        return {"valid": False, "message": f"Could not reach {label}. Try again in a moment."}
    except (litellm.ServiceUnavailableError, litellm.InternalServerError) as e:
        logger.error(
            "Key check: %s returned a server error (%s): %s",
            label,
            type(e).__name__,
            _redact(str(e), config.api_key)[:800],
        )
        return {"valid": False, "message": f"{label} is temporarily unavailable. Try again in a moment."}
    except Exception as e:
        logger.error(
            "Key check failed for %s (%s): %s",
            label,
            type(e).__name__,
            _redact(str(e), config.api_key)[:800],
        )
        return {"valid": False, "message": f"Could not verify the key with {label}."}


async def check_serpapi_key(api_key: str) -> dict:
    """SerpApi's account endpoint does not count as a search."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://serpapi.com/account", params={"api_key": api_key})
    except httpx.HTTPError:
        return {"valid": False, "message": "Could not reach SerpApi. Try again in a moment."}

    if resp.status_code == 200:
        return {"valid": True, "message": "SerpApi key works."}
    if resp.status_code in (401, 403):
        return {"valid": False, "message": "SerpApi rejected this key."}
    return {"valid": False, "message": f"Could not verify the key (SerpApi returned {resp.status_code})."}