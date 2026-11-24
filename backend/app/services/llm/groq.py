import base64
import json
import logging

from groq import AsyncGroq
from langchain_groq import ChatGroq
from pydantic import BaseModel, ValidationError

from app.config.settings import get_settings
from app.services.llm.base import LLMProvider, LLMResponse
from app.schemas.extraction import build_provider_schema

logger = logging.getLogger(__name__)


class GroqProviderError(Exception):
    """Raised when Groq fails to generate a structured response."""


class GroqSchemaValidationError(GroqProviderError):
    """
    Raised when Groq returned a parseable response but it failed
    Pydantic schema validation. This is distinct from API/network
    failures and should NOT trigger a retry.
    """

    def __init__(self, message: str, raw_text: str, validation_error: ValidationError):
        super().__init__(message)
        self.raw_text = raw_text
        self.validation_error = validation_error


class GroqProvider(LLMProvider):

    def __init__(self):
        settings = get_settings()

        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")

        self.client = AsyncGroq(
            api_key=settings.GROQ_API_KEY
        )

        self.model = settings.GROQ_MODEL
        self.api_key = settings.GROQ_API_KEY

    @property
    def provider_name(self) -> str:
        return "groq"

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
            encoded_image = base64.b64encode(
                image_bytes
            ).decode("utf-8")

            image_data_url = (
                f"data:{mime_type};base64,{encoded_image}"
            )

            # Use the provider-compatible schema (fully inlined, no $defs/$ref,
            # Decimal fields as plain "number") instead of model_json_schema()
            # which uses anyOf and $ref patterns that Groq may mis-handle.
            provider_schema = build_provider_schema()

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_data_url,
                                },
                            },
                        ],
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": response_schema.__name__.lower(),
                        "schema": provider_schema,
                        "strict": False,
                    },
                },
                temperature=0,
            )

            raw_text = response.choices[0].message.content

            if not raw_text:
                raise GroqProviderError(
                    "Groq returned an empty response."
                )

            logger.debug(
                "Groq raw response (before validation): %s",
                raw_text,
            )

            try:
                parsed = response_schema.model_validate_json(raw_text)
            except ValidationError as ve:
                logger.error(
                    "Groq response failed schema validation. "
                    "Raw response: %s | Errors: %s",
                    raw_text,
                    ve.errors(),
                )
                raise GroqSchemaValidationError(
                    f"Groq response did not match expected schema: {ve}",
                    raw_text=raw_text,
                    validation_error=ve,
                ) from ve

            return LLMResponse(
                parsed=parsed,
                raw_text=raw_text,
                provider=self.provider_name,
                model=self.model_name,
            )

        except (GroqProviderError, GroqSchemaValidationError):
            raise

        except Exception as exc:
            logger.error(
                "Groq API call failed. Raw text so far: %s | Error: %s",
                raw_text,
                exc,
            )
            raise GroqProviderError(
                f"Groq generation failed: {exc}"
            ) from exc

    def get_chat_model(self):
        return ChatGroq(
            model=self.model,
            api_key=self.api_key,
            temperature=0,
        )