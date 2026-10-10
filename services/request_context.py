from contextvars import ContextVar

serpapi_key_var: ContextVar[str | None] = ContextVar("serpapi_key", default=None)