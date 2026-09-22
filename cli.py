from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from api.agent_runtime import stream_search, reset_session
from schema import ScoredProduct


SESSION_ID = "default-cli"


def _format_product_line(
    rank: int,
    scored: ScoredProduct,
    featured: bool,
) -> str:
    p = scored.product

    label = (
        f"[TOP RECOMMENDATION #{rank}]"
        if featured
        else f"  {rank}."
    )

    price = f"${p.price:.2f}"

    if p.old_price and p.old_price > p.price:
        price += f" (was ${p.old_price:.2f})"

    rating = (
        f" | * {p.rating:.1f} ({p.reviews_count} reviews)"
        if p.rating is not None
        else ""
    )

    return (
        f"{label} {p.title}\n"
        f"      {price} - {p.source}{rating} "
        f"- match {scored.total_score:.0%}\n"
        f"      {p.url}"
    )


def print_scored_products(scored: list[ScoredProduct]) -> None:
    """Display the products returned by the shared agent runtime."""

    if not scored:
        return

    top = scored[:3]
    rest = scored[3:]

    if all(
        sp.product.source.lower() == "fallback"
        for sp in scored
    ):
        print(
            "\n[!] Live search unavailable right now "
            "— showing generic placeholder results."
        )

    print(f"\n{'=' * 64}")
    print(f"  {len(scored)} product(s) found")
    print(f"{'=' * 64}")

    print("\n** TOP RECOMMENDATIONS **")
    print("-" * 64)

    for i, product in enumerate(top, start=1):
        print(_format_product_line(i, product, featured=True))
        print()

    if rest:
        print("ALL OTHER RESULTS")
        print("-" * 64)

        for i, product in enumerate(
            rest,
            start=len(top) + 1,
        ):
            print(_format_product_line(i, product, featured=False))
            print()


async def main():
    print(
        "Product Finder CLI, "
        "type /reset to start over & /exit to quit"
    )

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
            async for event in stream_search(
                SESSION_ID,
                user_input,
            ):
                event_type = event.get("type")

                if event_type == "classified":
                    category = event.get("category", "unknown")
                    confidence = event.get("confidence", 0)

                    print(
                        f"\n  [classified → {category} "
                        f"({confidence:.0%})]",
                        flush=True,
                    )

                elif event_type == "handoff":
                    agent_name = event.get(
                        "agent",
                        "unknown",
                    )

                    print(
                        f"\n  [handoff → {agent_name}]",
                        flush=True,
                    )

                elif event_type == "tool_called":
                    tool_name = event.get(
                        "tool",
                        "unknown",
                    )

                    print(
                        f"\n  [calling {tool_name}]",
                        flush=True,
                    )

                elif event_type == "searched":
                    count = event.get("count", 0)

                    print(
                        f"\n  [products found → {count}]",
                        flush=True,
                    )

                elif event_type == "scored":
                    count = event.get("count", 0)

                    print(
                        f"\n  [products scored → {count}]",
                        flush=True,
                    )

                elif event_type == "blocked":
                    print(
                        f"\n{event.get('message', 'Request blocked.')}",
                        flush=True,
                    )

                elif event_type == "error":
                    print(
                        f"\n{event.get('message', 'An error occurred.')}",
                        flush=True,
                    )

                elif event_type == "done":
                    message = event.get("message", "")

                    if message:
                        print(f"\n{message}", flush=True)

                    raw_products = event.get("products", [])

                    products: list[ScoredProduct] = []

                    for raw_product in raw_products:
                        try:
                            products.append(
                                ScoredProduct.model_validate(
                                    raw_product
                                )
                            )
                        except Exception:
                            continue

                    print_scored_products(products)

            print()

        except Exception as exc:
            print(
                f"\n[CLI ERROR] {exc}",
                flush=True,
            )


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())