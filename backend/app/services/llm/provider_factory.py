from functools import lru_cache

from app.config.settings import get_settings
from app.services.llm.base import LLMProvider
from app.services.llm.fallback import FallbackProvider
from app.services.llm.gemini import GeminiProvider
from app.services.llm.groq import GroqProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()

    if settings.LLM_PROVIDER == "groq":
        return FallbackProvider(
            primary=GroqProvider(),
            fallback_factory=GeminiProvider,
        )

    elif settings.LLM_PROVIDER == "gemini":
        return FallbackProvider(
            primary=GeminiProvider(),
            fallback_factory=GroqProvider,
        )

    raise ValueError(
        f"Unsupported LLM provider: {settings.LLM_PROVIDER}"
    )