import asyncio
from pydantic import BaseModel
from models import Default_Model
from agents import Agent, GuardrailFunctionOutput, Runner

from models import Default_Model

class jailbreakcheck(BaseModel):
     is_jailbreak : bool
     reasonong : str

guardrail_agent = Agent(
     name = "Guardrail Agent",
     instructions = "",
     model = Default_Model,
     output_type = jailbreakcheck
)


async def block_jailbreak(ctx, agent, input_data) -> GuardrailFunctionOutput:
     result = await Runner.run(guardrail_agent, input_data, context =  ctx.context)
     check = result.final_output
     return GuardrailFunctionOutput(
          output_info = check.reasoning,
          tripwire_triggered = check.is_jailbreak
     )