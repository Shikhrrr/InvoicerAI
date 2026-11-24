
from typing import Any, Literal

from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.services.llm.provider_factory import get_llm_provider


MemoryField = Literal[
    "active_date_range",
    "last_query_type",
    "selected_invoice_id",
    "selected_invoice_number",
    "selected_customer",
    "active_filters",
    "unresolved_question",
]


class ExtractedMemory(BaseModel):
    active_date_range: str | None = Field(default=None)
    last_query_type: str | None = Field(default=None)

    selected_invoice_id: str | None = Field(default=None)
    selected_invoice_number: str | None = Field(default=None)
    selected_customer: str | None = Field(default=None)

    active_filters: dict[str, Any] = Field(default_factory=dict)

    unresolved_question: str | None = Field(default=None)

    # Explicit memory-clearing instructions
    clear_fields: list[MemoryField] = Field(default_factory=list)

    # Whether existing filters should be replaced entirely
    replace_filters: bool = False


MEMORY_EXTRACTION_PROMPT = """
You extract structured conversational memory for an invoice assistant.

Your task is to update existing memory based on the conversation.

Rules:

1. Never invent invoice IDs, invoice numbers, customers, dates,
   filters, or user preferences.

2. Preserve existing memory when the conversation does not
   explicitly change or invalidate it.

3. UPDATE:
   - Extract new values when the user explicitly introduces them.
   - New date ranges replace old date ranges.
   - New invoice selections replace previous invoice selections.
   - New customer selections replace previous customer selections.
   - Query type should reflect the current query.

4. CLEAR:
   - Clear active_date_range when the user changes to a query
     that is no longer dependent on the previous date range.
   - Clear selected_invoice_id and selected_invoice_number
     when the user explicitly switches to another invoice.
   - Clear selected_customer when the user explicitly switches
     to a different customer or abandons customer-specific context.
   - Clear active_filters when the user starts a query that
     does not depend on the old filters.
   - Clear unresolved_question when it has been answered or
     abandoned.

5. CONTEXT PRESERVATION:
   - Follow-ups such as "what about September?", "show me more",
     "compare them", "what about the previous one?" should preserve
     relevant existing context.
   - Do not clear memory merely because the latest message is short.
   - If the user is continuing the same query, preserve applicable
     filters and context.

6. FILTERS:
   - If the user changes a filter, replace the conflicting filter.
   - If the user adds a new compatible filter, merge it.
   - Set replace_filters=true when the current filter set should
     replace the existing filter set completely.
   - Do not retain filters that are no longer relevant.

7. CLEAR_FIELDS:
   - Return fields that must explicitly be cleared.
   - Clearing a field means its previous value is no longer valid.
   - Do not clear a field simply because you could not extract
     a new value for it.
   - When changing invoice selection, clear conflicting invoice
     references before updating them.

8. Memory is conversational context, NOT a source of truth for
   invoice data. Actual invoice details must be retrieved from
   database tools.

Return only structured output.
"""


def format_messages(messages: list[BaseMessage]) -> str:
    formatted = []

    for message in messages:
        role = message.type.upper()
        content = message.content

        if not isinstance(content, str):
            content = str(content)

        formatted.append(f"{role}: {content}")

    return "\n".join(formatted)


def apply_memory_updates(
    existing_memory: dict[str, Any],
    extracted_memory: ExtractedMemory,
) -> dict[str, Any]:
    """
    Apply extracted updates and explicit clearing instructions
    to existing structured memory.
    """

    updated_memory = existing_memory.copy()

    # 1. Clear explicitly invalidated fields
    for field in extracted_memory.clear_fields:
        updated_memory.pop(field, None)

    # 2. Update scalar fields only when a new value exists
    scalar_fields = [
        "active_date_range",
        "last_query_type",
        "selected_invoice_id",
        "selected_invoice_number",
        "selected_customer",
        "unresolved_question",
    ]

    for field in scalar_fields:
        value = getattr(extracted_memory, field)

        if value is not None:
            updated_memory[field] = value

    # 3. Handle filters
    new_filters = extracted_memory.active_filters

    if extracted_memory.replace_filters:
        updated_memory["active_filters"] = new_filters.copy()

    elif new_filters:
        existing_filters = updated_memory.get("active_filters", {})
        updated_memory["active_filters"] = {
            **existing_filters,
            **new_filters,
        }

    return updated_memory


async def extract_structured_memory(
    existing_memory: dict[str, Any],
    conversation_summary: str,
    messages: list[BaseMessage],
) -> dict[str, Any]:

    if not messages:
        return existing_memory

    provider = get_llm_provider()
    model = provider.get_chat_model()

    extractor = model.with_structured_output(ExtractedMemory)

    extraction_messages = [
        SystemMessage(content=MEMORY_EXTRACTION_PROMPT),
        HumanMessage(
            content=(
                f"Existing structured memory:\n"
                f"{existing_memory}\n\n"
                f"Conversation summary:\n"
                f"{conversation_summary}\n\n"
                f"Messages:\n"
                f"{format_messages(messages)}"
            )
        ),
    ]

    extracted = await extractor.ainvoke(extraction_messages)

    return apply_memory_updates(
        existing_memory=existing_memory,
        extracted_memory=extracted,
    )
