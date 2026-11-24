from langchain_core.messages import RemoveMessage

from app.services.ai.graph.state import InvoiceAgentState

from app.services.ai.graph.memory.context_manager import (
    needs_summarization,
    split_messages_for_summarization,
)

from app.services.ai.graph.memory.summarizer import summarize_conversation
from app.services.ai.graph.memory.memory_extractor import extract_structured_memory


async def context_management_node(
    state: InvoiceAgentState,
) -> dict:

    messages = state.get("messages", [])

    existing_summary = state.get("conversation_summary", "")
    existing_memory = state.get("structured_memory", {})

    updated_summary = existing_summary
    updated_memory = existing_memory.copy()

    messages_to_remove = []

    if needs_summarization(messages):

        messages_to_summarize, messages_to_keep = (
            split_messages_for_summarization(messages)
        )

        if messages_to_summarize:

            try:
                updated_summary = await summarize_conversation(
                    existing_summary=existing_summary,
                    messages_to_summarize=messages_to_summarize,
                )

                # Only remove messages if summarization succeeded
                messages_to_remove = [
                    RemoveMessage(id=message.id)
                    for message in messages_to_summarize
                    if message.id is not None
                ]

            except Exception as exc:

                # If summarization fails, preserve original messages.
                updated_summary = existing_summary
                messages_to_remove = []

                print(
                    f"Conversation summarization failed: {exc}"
                )

    # 2. Update structured memory

    try:

        updated_memory = await extract_structured_memory(
            existing_memory=existing_memory,
            conversation_summary=updated_summary,
            messages=messages,
        )

    except Exception as exc:

        updated_memory = existing_memory.copy()

        print(
            f"Structured memory extraction failed: {exc}"
        )

    return {
        "conversation_summary": updated_summary,
        "structured_memory": updated_memory,
        "messages": messages_to_remove,
    }