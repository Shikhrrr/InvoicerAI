from langchain_core.messages import BaseMessage

from app.services.ai.graph.memory.token_counter import (
    estimate_messages_tokens,
)


MAX_CONTEXT_TOKENS = 12000
RECENT_CONTEXT_TOKENS = 4000


def needs_summarization(
    messages: list[BaseMessage],
) -> bool:
    return estimate_messages_tokens(messages) > MAX_CONTEXT_TOKENS


def split_messages_for_summarization(
    messages: list[BaseMessage],
) -> tuple[list[BaseMessage], list[BaseMessage]]:
    """
    Splits conversation messages into:
    1. Older messages to summarize
    2. Recent messages to retain

    The latest message is always retained.
    """

    if not messages:
        return [], []

    total_tokens = estimate_messages_tokens(messages)

    if total_tokens <= MAX_CONTEXT_TOKENS:
        return [], messages

    messages_to_keep = []
    messages_to_summarize = []

    recent_tokens = 0

    # Always retain the latest message.
    latest_message = messages[-1]
    messages_to_keep.append(latest_message)

    recent_tokens += estimate_messages_tokens(
        [latest_message]
    )

    # Traverse older messages from newest to oldest.
    for message in reversed(messages[:-1]):
        message_tokens = estimate_messages_tokens([message])

        if recent_tokens + message_tokens <= RECENT_CONTEXT_TOKENS:
            messages_to_keep.insert(0, message)
            recent_tokens += message_tokens
        else:
            messages_to_summarize.insert(0, message)

    return messages_to_summarize, messages_to_keep