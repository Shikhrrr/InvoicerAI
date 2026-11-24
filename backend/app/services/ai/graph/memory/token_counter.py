from langchain_core.messages import BaseMessage


def estimate_message_tokens(message: BaseMessage) -> int:
    """assumes 4 chars per token"""

    content = message.content

    if isinstance(content, str):
        text_length = len(content)
    else:
        text_length = len(str(content))

    # Account for message metadata and formatting overhead.
    return (text_length // 4) + 10


def estimate_messages_tokens(
    messages: list[BaseMessage],
) -> int:
    return sum(
        estimate_message_tokens(message)
        for message in messages
    )