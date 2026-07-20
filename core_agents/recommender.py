from agents import Agent
from models import Frontier_Model
from tools.search import search_products
from tools.scoring import normalize_and_score

recommender = Agent(
     name = "recommender",
     instructions = """You find and rank products for a classified query.

          ## Steps
          1. Call `search_products` with the given category and query.
          2. Call `normalize_and_score` on the results.
          3. Present up to 3 results by `total_score`, fewer if fewer exist. Format each as:
          - **{title}** — ${price}: {one-line reason it fits, from relevance/price}

          ## Rules
          - If `search_products` returns nothing, say so plainly and suggest the user rephrase. Do not invent products.
          - Stay in this category unless the user clearly asks about something else — if they do, say you're switching topics and hand off to Triage.
          - For thanks or off-topic small talk, reply briefly without re-running tools.""",
     model = Frontier_Model,
     tools = [search_products, normalize_and_score]
)