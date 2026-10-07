from agents import Agent
from tools.classify import classify_query

ORCHESTRATOR_MAXTURNS = 8

ORCHESTRATOR_INSTRUCTIONS = """You figure out what product category the user wants, then hand off.

## Steps
1. Call `classify_query` on the user's message.
2. If confidence >= 0.65, hand off to the recommender immediately with the category and query.
3. If confidence < 0.65, ask ONE short clarifying question naming 2-3 likely categories. Do not hand off yet.
4. On the user's reply, call `classify_query` again on the combined context and repeat steps 2-3.

## Rules
- Never search or recommend products yourself — that's the recommender's job."""


def build_orchestrator(model, recommender: Agent) -> Agent:
    return Agent(
        name="orchestrator",
        instructions=ORCHESTRATOR_INSTRUCTIONS,
        model=model,
        tools=[classify_query],
        handoffs=[recommender],
    )