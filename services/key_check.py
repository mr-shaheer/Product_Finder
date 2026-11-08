import httpx
import litellm

from services.llm_config import LLMConfig


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
            timeout=15,
            num_retries=0,
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
    except (litellm.APIConnectionError, litellm.Timeout):
        return {"valid": False, "message": f"Could not reach {label}. Try again in a moment."}
    except Exception:
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