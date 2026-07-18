import os
from agents import OpenAIChatCompletionsModel, AsyncOpenAI
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

external_client = AsyncOpenAI(
     api_key = os.getenv("GEMINI_API_KEY"),
     base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
)

Default_Model = OpenAIChatCompletionsModel(
     model = "gemini-2.5-flash",
     openai_client = external_client
)

Frontier_Model = OpenAIChatCompletionsModel(
     model = "gemini-3.5-flash",
     openai_client = external_client
)