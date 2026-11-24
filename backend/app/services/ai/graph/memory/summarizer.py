from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.services.llm.provider_factory import get_llm_provider


SUMMARIZATION_PROMPT = """
You are maintaining memory for an invoice-assistant conversation.

Update the existing conversation summary using the older messages provided.

Preserve information that may be important for future conversational
continuity, including:

- The user's ongoing task or objective
- Invoice numbers and invoice IDs
- Selected invoices or entities
- Dates and date ranges
- Filters and search criteria
- Important numerical findings
- Comparisons being performed
- User corrections and preferences relevant to this conversation
- Unresolved questions
- Context necessary to understand follow-up references such as
  "it", "that invoice", "the second one", or "compare it"

Instructions:

1. Merge the existing summary with the new information.
2. Remove redundant and irrelevant information.
3. Do not invent facts.
4. Preserve exact identifiers and important numerical values.
5. Clearly distinguish confirmed facts from unresolved information.
6. Keep the summary concise but sufficiently informative.
7. Do not include internal reasoning.
8. Return only the updated summary.
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


async def summarize_conversation(
    existing_summary: str,
    messages_to_summarize: list[BaseMessage],
) -> str:
    if not messages_to_summarize:
        return existing_summary

    provider = get_llm_provider()
    model = provider.get_chat_model()

    messages = [
        SystemMessage(content=SUMMARIZATION_PROMPT),
        HumanMessage(
            content=(
                f"Existing summary:\n"
                f"{existing_summary or 'No existing summary.'}\n\n"
                f"Messages to incorporate:\n"
                f"{format_messages(messages_to_summarize)}"
            )
        ),
    ]

    response = await model.ainvoke(messages)

    return response.content.strip()