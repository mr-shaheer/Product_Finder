from agents import AsyncOpenAI, OpenAIChatCompletionsModel

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

DEFAULT_MODEL_NAME = "gemini-2.5-flash"
FRONTIER_MODEL_NAME = "gemini-3.5-flash"


def build_models(api_key: str) -> tuple[OpenAIChatCompletionsModel, OpenAIChatCompletionsModel]:

    client = AsyncOpenAI(api_key=api_key, base_url=GEMINI_BASE_URL)
    default_model = OpenAIChatCompletionsModel(model=DEFAULT_MODEL_NAME, openai_client=client)
    frontier_model = OpenAIChatCompletionsModel(model=FRONTIER_MODEL_NAME, openai_client=client)
    return default_model, frontier_model