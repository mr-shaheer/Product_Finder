from agents import Agent
from models import Default_Model
from guardrails import block_jailbreak
from tools.classify import classify_query
from core_agents.Recommender import recommender

ORCHESTRATOR_MAXTURNS = 8

orchestrator = Agent(
     name = "orchestrator",
     instructions = """You figure out what product category the user wants, then hand off.

          ## Steps
          1. Call `classify_query` on the user's message.
          2. If confidence >= 0.65, hand off to Recommendation immediately with the category and query.
          3. If confidence < 0.65, ask ONE short clarifying question naming 2-3 likely categories. Do not hand off yet.
          4. On the user's reply, call `classify_query` again on the combined context and repeat steps 2-3.

          ## Rules
          - Never search or recommend products yourself — that's Recommender job.""",
     model = Default_Model,
     tools = [classify_query],
     handoffs = [recommender],
     input_guardrails = [block_jailbreak]
)