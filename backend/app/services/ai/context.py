from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class InvoiceAgentContext:
    """
    Runtime context supplied to the AI agent and its tools.

    This context is request-specific and must not be stored globally
    inside the agent instance.
    """

    user_id: str
    session_factory: Any