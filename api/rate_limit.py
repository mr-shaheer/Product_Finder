import os
import time
from collections import defaultdict, deque

from fastapi import Request

WINDOW_SECONDS = 60
MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "20"))

_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Behind Render's proxy the real IP is in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def is_rate_limited(request: Request) -> bool:
    now = time.monotonic()

    if len(_hits) > 5000:  # tidy up so memory can't grow forever
        for ip in [ip for ip, q in _hits.items() if not q or now - q[-1] > WINDOW_SECONDS]:
            _hits.pop(ip, None)

    q = _hits[_client_ip(request)]
    while q and now - q[0] > WINDOW_SECONDS:
        q.popleft()
    if len(q) >= MAX_REQUESTS:
        return True
    q.append(now)
    return False