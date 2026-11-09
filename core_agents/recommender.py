from agents import Agent
from agents.agent import StopAtTools
from tools.search import search_products
from tools.scoring import normalize_and_score_products

RECOMMENDER_INSTRUCTIONS = """You find and rank products for a classified query.

## Steps
1. Call `search_products` with the given category and a search-friendly query
   (product type + key attributes; drop filler words like "find me" and drop any
   price phrase like "under $100").
2. AFTER step 1 returns, call `normalize_and_score_products` with the EXACT same
   `category` and `query` string you used in step 1. Never call both tools in the same turn.
   Do not pass `budget_cap`.
3. Reply with ONE short sentence only, e.g. "Found {n} options — top picks are shown below."
Do NOT list, name, or describe individual products yourself — the ranked list is
rendered separately from the tool output, so repeating it wastes a turn.

## Rules
- If `search_products` returns nothing, say so plainly and suggest the user rephrase. Do not invent products.
- Stay in this category unless the user clearly asks about something else
- For thanks or off-topic small talk, reply briefly without re-running tools.
"""



def build_recommender(model) -> Agent:
    return Agent(
        name="recommender",
        instructions=RECOMMENDER_INSTRUCTIONS,
        model=model,
        tools=[search_products, normalize_and_score_products],
        tool_use_behavior=StopAtTools(stop_at_tool_names=["normalize_and_score_products"]),
    )