import logging
from collections.abc import Callable

from pydantic import BaseModel

from app.services.llm.base import LLMProvider, LLMResponse
from app.services.llm.groq import GroqProviderError, GroqSchemaValidationError
from app.services.llm.gemini import GeminiProviderError, GeminiSchemaValidationError

logger = logging.getLogger(__name__)

# All provider-level errors that should trigger a fallback attempt.
_PROVIDER_ERRORS = (GroqProviderError, GeminiProviderError)


class FallbackProvider(LLMProvider):

    def __init__(
        self,
        primary: LLMProvider,
        fallback_factory: Callable[[], LLMProvider],
    ):
        self.primary = primary
        self.fallback_factory = fallback_factory

    @property
    def provider_name(self) -> str:
        return self.primary.provider_name

    @property
    def model_name(self) -> str:
        return self.primary.model_name


    def get_chat_model(self):
        primary_model = self.primary.get_chat_model()

        fallback_provider = self.fallback_factory()
        fallback_model = fallback_provider.get_chat_model()

        return primary_model.with_fallbacks(
            [fallback_model],
            exceptions_to_handle=(Exception,),
        )
        

    async def generate_structured(
        self,
        prompt: str,
        image_bytes: bytes,
        mime_type: str,
        response_schema: type[BaseModel],
    ) -> LLMResponse:

        try:
            return await self.primary.generate_structured(
                prompt=prompt,
                image_bytes=image_bytes,
                mime_type=mime_type,
                response_schema=response_schema,
            )

        except _PROVIDER_ERRORS as primary_error:

            # Log the primary failure with its category so it's diagnosable.
            is_schema_error = isinstance(
                primary_error,
                (GroqSchemaValidationError, GeminiSchemaValidationError),
            )
            error_category = "schema_validation" if is_schema_error else "api"
            logger.warning(
                "Primary provider (%s) failed [category=%s]: %s. "
                "Attempting fallback.",
                self.primary.provider_name,
                error_category,
                primary_error,
            )

            fallback = self.fallback_factory()

            try:
                return await fallback.generate_structured(
                    prompt=prompt,
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                    response_schema=response_schema,
                )

            except _PROVIDER_ERRORS as fallback_error:
                is_fallback_schema_error = isinstance(
                    fallback_error,
                    (GroqSchemaValidationError, GeminiSchemaValidationError),
                )
                fallback_category = (
                    "schema_validation" if is_fallback_schema_error else "api"
                )
                logger.error(
                    "Fallback provider (%s) also failed [category=%s]: %s",
                    fallback.provider_name,
                    fallback_category,
                    fallback_error,
                )
                raise RuntimeError(
                    "Both LLM providers failed. "
                    f"Primary ({self.primary.provider_name}) [{error_category}]: "
                    f"{primary_error}. "
                    f"Fallback ({fallback.provider_name}) [{fallback_category}]: "
                    f"{fallback_error}"
                ) from fallback_error