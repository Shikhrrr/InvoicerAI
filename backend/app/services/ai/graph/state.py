from typing import Annotated, Any, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class InvoiceAgentState(TypedDict):
    # Conversation history
    messages: Annotated[list[BaseMessage], add_messages]

    # Intent identification
    intent: str | None
    is_in_scope: bool | None
    scope_reason: str | None

    # Conversation memory
    conversation_summary: str
    structured_memory: dict[str, Any]

    # Context management
    context_needs_summarization: bool
    messages_to_summarize: list[BaseMessage]

    # Agent execution
    retrieval_results: list[dict[str, Any]]
    final_response: str | None

    # Response validation
    response_valid: bool | None
    response_validation_error: str | None