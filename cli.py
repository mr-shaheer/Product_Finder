from dotenv import load_dotenv, find_dotenv
import os
import asyncio
from uuid import uuid4
from core_agents.orchestrator import orchestrator, ORCHESTRATOR_MAXTURNS
from agents import SQLiteSession, SessionSettings,  RunConfig, Agent, MaxTurnsExceeded, InputGuardrailTripwireTriggered
from agents.stream_events import RawResponsesStreamEvent, RunItemStreamEvent, AgentUpdatedStreamEvent
from agents import Runner
from openai.types.responses import ResponseTextDeltaEvent



load_dotenv(find_dotenv())


def build_run_config(session_id: str, turn_num: int) -> RunConfig:
    return RunConfig(
        workflow_name="product-finder",
        trace_id="trace_" + uuid4().hex,
        trace_metadata={
            "session_id": session_id,
            "turn": str(turn_num),
            "env": os.environ.get("APP_ENV", "dev"),
        },
        tracing_disabled="OPENAI_API_KEY" not in os.environ,
    )

async def main():
    active_agent: Agent = orchestrator
    session = SQLiteSession("default-cli", "conversation.db", session_settings = SessionSettings(limit = 10))
    turn = 0    
    
    print("Product Finder CLI, type /reset to start over & /exit to quit")

    while True:
        user_input = input("You: ").strip()

        if user_input == "/exit":
            break
        if user_input =="/reset":
            active_agent = orchestrator
            print("Session Reset.\n")
            continue

        print("Assistant: ", end = "", flush = True) 
        
        turn += 1

        try :

            result = Runner.run_streamed(
                active_agent,
                user_input,
                max_turns = ORCHESTRATOR_MAXTURNS,
                run_config=build_run_config(session.session_id, turn),
                session=session,
            )

            async for event in result.stream_events():
                if isinstance(event, AgentUpdatedStreamEvent):
                    agent_name = event.new_agent.name
                    print(f"\n  [handoff → {agent_name}]", flush=True)

                elif isinstance(event, RawResponsesStreamEvent):
                    if isinstance(event.data, ResponseTextDeltaEvent):
                        chunk: str | None = getattr(event.data, "delta", None)
                        if chunk :
                            print(chunk, end="", flush=True)

                elif isinstance(event, RunItemStreamEvent):
                    if event.name == "tool_called":
                        tool_name: str = getattr(event.item.raw_item, "name", "?")
                        print(f"\n  [calling {tool_name}]", flush=True)
            active_agent = result.last_agent
            print("\n")

        except InputGuardrailTripwireTriggered:
            print("I can't Process this Request")

        except MaxTurnsExceeded:
            print("Conversation Limit Reached. Type /reset to start over")


if __name__ == "__main__":
    asyncio.run(main())