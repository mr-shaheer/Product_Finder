from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import os
from api.agent_runtime import stream_search, reset_session
from schema import ScoredProduct
from services.llm_config import LLMConfigError, resolve_llm_config

SESSION_ID = "default-cli"


def _format_product_line(rank: int, scored: ScoredProduct, featured: bool) -> str:
    p = scored.product
    label = f"[TOP RECOMMENDATION #{rank}]" if featured else f"  {rank}."
    price = f"${p.price:.2f}"
    if p.old_price and p.old_price > p.price:
        price += f" (was ${p.old_price:.2f})"
    rating = f" | * {p.rating:.1f} ({p.reviews_count} reviews)" if p.rating is not None else ""
    return (
        f"{label} {p.title}\n"
        f"      {price} - {p.source}{rating} - match {scored.total_score:.0%}\n"
        f"      {p.url}"
    )


def print_scored_products(scored: list[ScoredProduct]) -> None:
    if not scored:
        return
    top, rest = scored[:3], scored[3:]

    if all(sp.product.source.lower() == "fallback" for sp in scored):
        print("\n[!] Live search unavailable right now — showing generic placeholder results.")

    print(f"\n{'=' * 64}\n  {len(scored)} product(s) found\n{'=' * 64}")
    print("\n** TOP RECOMMENDATIONS **\n" + "-" * 64)
    for i, product in enumerate(top, start=1):
        print(_format_product_line(i, product, featured=True))
        print()

    if rest:
        print("ALL OTHER RESULTS\n" + "-" * 64)
        for i, product in enumerate(rest, start=len(top) + 1):
            print(_format_product_line(i, product, featured=False))
            print()


def load_llm_from_env():
    """LLM_PROVIDER / LLM_MODEL / LLM_API_KEY / LLM_BASE_URL (GEMINI_API_KEY still works)."""
    return resolve_llm_config(
        os.environ.get("LLM_PROVIDER"),
        os.environ.get("LLM_MODEL"),
        os.environ.get("LLM_API_KEY"),
        os.environ.get("LLM_BASE_URL"),
        os.environ.get("GEMINI_API_KEY"),
    )


async def main():
    try:
        llm = load_llm_from_env()
    except LLMConfigError as exc:
        print(f"Config error: {exc.message}\nSet LLM_PROVIDER, LLM_MODEL and LLM_API_KEY in .env")
        return

    print(f"Product Finder CLI ({llm.provider_label}: {llm.model or 'default model'})")
    print("Type /reset to start over & /exit to quit")

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

        if not user_input:
            continue
        if user_input == "/exit":
            break
        if user_input == "/reset":
            reset_session(SESSION_ID)
            print("Session Reset.\n")
            continue

        print("Assistant: ", end="", flush=True)

        try:
            async for event in stream_search(SESSION_ID, user_input, llm, os.environ.get("SERPAPI_KEY")):
                t = event.get("type")

                if t == "classified":
                    print(f"\n  [classified → {event.get('category', 'unknown')} ({event.get('confidence', 0):.0%})]", flush=True)
                elif t == "handoff":
                    print(f"\n  [handoff → {event.get('agent', 'unknown')}]", flush=True)
                elif t == "tool_called":
                    print(f"\n  [calling {event.get('tool', 'unknown')}]", flush=True)
                elif t == "searched":
                    print(f"\n  [products found → {event.get('count', 0)}]", flush=True)
                elif t == "scored":
                    print(f"\n  [products scored → {event.get('count', 0)}]", flush=True)
                elif t == "blocked":
                    print(f"\n{event.get('message', 'Request blocked.')}", flush=True)
                elif t == "error":
                    print(f"\n{event.get('message', 'An error occurred.')}", flush=True)
                elif t == "done":
                    if event.get("message"):
                        print(f"\n{event['message']}", flush=True)
                    products: list[ScoredProduct] = []
                    for raw in event.get("products", []):
                        try:
                            products.append(ScoredProduct.model_validate(raw))
                        except Exception:
                            continue
                    print_scored_products(products)
            print()
        except Exception as exc:
            print(f"\n[CLI ERROR] {exc}", flush=True)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())