import logging

from google import genai
from google.genai import types
from pydantic import BaseModel, ValidationError

from app.config.settings import get_settings
from app.services.llm.base import LLMProvider, LLMResponse
from app.schemas.extraction import build_provider_schema
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


class GeminiProviderError(Exception):
    """Raised when Gemini fails to generate a structured response."""


class GeminiSchemaValidationError(GeminiProviderError):
    """
    Raised when Gemini returned a parseable response but it failed
    Pydantic schema validation. This is distinct from API/network
    failures and should NOT trigger a retry.
    """

    def __init__(self, message: str, raw_text: str, validation_error: ValidationError):
        super().__init__(message)
        self.raw_text = raw_text
        self.validation_error = validation_error


class GeminiProvider(LLMProvider):

    def __init__(self):
        settings = get_settings()

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.model = settings.GEMINI_MODEL
        self.api_key = settings.GEMINI_API_KEY

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self.model

    async def generate_structured(
        self,
        prompt: str,
        image_bytes: bytes,
        mime_type: str,
        response_schema: type[BaseModel],
    ) -> LLMResponse:

        raw_text: str | None = None

        try:
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            )

            # Gemini's response_json_schema does NOT support JSON Schema
            # $defs/$ref or anyOf patterns produced by Pydantic for Decimal.
            # We use a fully-inlined, provider-compatible schema instead.
            provider_schema = build_provider_schema()

            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=[
                    prompt,
                    image_part,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=provider_schema,
                    temperature=0,
                ),
            )

            raw_text = response.text

            if not raw_text:
                raise GeminiProviderError(
                    "Gemini returned an empty response."
                )

            logger.debug(
                "Gemini raw response (before validation): %s",
                raw_text,
            )

            try:
                parsed = response_schema.model_validate_json(raw_text)
            except ValidationError as ve:
                logger.error(
                    "Gemini response failed schema validation. "
                    "Raw response: %s | Errors: %s",
                    raw_text,
                    ve.errors(),
                )
                raise GeminiSchemaValidationError(
                    f"Gemini response did not match expected schema: {ve}",
                    raw_text=raw_text,
                    validation_error=ve,
                ) from ve

            return LLMResponse(
                parsed=parsed,
                raw_text=raw_text,
                provider=self.provider_name,
                model=self.model_name,
            )

        except (GeminiProviderError, GeminiSchemaValidationError):
            raise

        except Exception as exc:
            logger.error(
                "Gemini API call failed. Raw text so far: %s | Error: %s",
                raw_text,
                exc,
            )
            raise GeminiProviderError(
                f"Gemini generation failed: {exc}"
            ) from exc

    def get_chat_model(self):
        return ChatGoogleGenerativeAI(
            model=self.model,
            api_key=self.api_key,
            temperature=0
        )