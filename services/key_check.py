import httpx
from openai import (
    APIConnectionError,
    APIStatusError,
    AsyncOpenAI,
    AuthenticationError,
    BadRequestError,
    PermissionDeniedError,
    RateLimitError,
)

from models import GEMINI_BASE_URL


async def check_gemini_key(api_key: str) -> dict:
    """Cheap check: listing models does not use up your chat quota."""
    client = AsyncOpenAI(
        api_key=api_key, base_url=GEMINI_BASE_URL, timeout=10.0, max_retries=0
    )
    try:
        await client.models.list()
        return {"valid": True, "message": "Gemini key works."}
    except (AuthenticationError, PermissionDeniedError, BadRequestError):
        return {"valid": False, "message": "Gemini rejected this key. Check that you copied it fully."}
    except RateLimitError:
        return {"valid": True, "message": "Key accepted (Gemini is rate-limiting right now)."}
    except APIConnectionError:
        return {"valid": False, "message": "Could not reach Gemini. Try again in a moment."}
    except APIStatusError as e:
        return {"valid": False, "message": f"Could not verify the key (Gemini returned {e.status_code})."}
    finally:
        await client.close()


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