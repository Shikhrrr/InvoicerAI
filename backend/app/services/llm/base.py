from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel


@dataclass
class LLMResponse:
    parsed: BaseModel
    raw_text: str
    provider: str
    model: str


class LLMProvider(ABC):

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        image_bytes: bytes,
        mime_type: str,
        response_schema: type[BaseModel],
    ) -> LLMResponse:
        pass

    @abstractmethod
    def get_chat_model(
        self
    ):
        pass
