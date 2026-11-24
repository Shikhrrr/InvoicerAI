import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.messages import HumanMessage

from app.api.dependencies.auth import get_current_user
from app.db.session import get_db, AsyncSessionLocal
from app.db.models.user import User
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.enums import MessageRole

from app.schemas.chat import ChatRequest

from app.services.ai.context import InvoiceAgentContext


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


def format_sse(event: str, data: dict) -> str:
    return (
        f"event: {event}\n"
        f"data: {json.dumps(data, default=str)}\n\n"
    )


@router.post("")
async def chat(
    data: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    message_content = data.message.strip()

    if not message_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    # Create or validate conversation
    if data.conversation_id is None:

        conversation = Conversation(
            user_id=current_user.id,
            title=message_content[:50],
        )

        db.add(conversation)
        await db.flush()

    else:

        result = await db.execute(
            select(Conversation).where(
                Conversation.id == data.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )

        conversation = result.scalar_one_or_none()

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

    conversation_id = conversation.id

    # Persist user message before AI execution
    user_message = Message(
        conversation_id=conversation_id,
        role=MessageRole.USER,
        content=message_content,
    )

    db.add(user_message)

    await db.commit()

    # Get compiled graph from application lifespan
    graph = request.app.state.invoice_graph

    # Graph execution configuration
    config = {
        "configurable": {
            "thread_id": str(conversation_id),
        }
    }

    # Runtime context for invoice tools
    context = InvoiceAgentContext(
        user_id=str(current_user.id),
        session_factory=AsyncSessionLocal,
    )

    async def event_generator():

        final_response = None

        try:

            # Send conversation ID immediately
            yield format_sse(
                "conversation",
                {
                    "conversation_id": str(conversation_id),
                },
            )

            # Invoke graph and stream events
            async for event in graph.astream(
                {
                    "messages": [
                        HumanMessage(content=message_content)
                    ]
                },
                config=config,
                context=context,
                stream_mode=["updates", "custom"],
                version="v2",
            ):

                # Custom events from analytical node
                if event["type"] == "custom":

                    custom_event = event["data"]

                    event_type = custom_event.get("type")

                    if event_type == "token":

                        yield format_sse(
                            "token",
                            {
                                "content": custom_event.get(
                                    "content",
                                    "",
                                ),
                            },
                        )

                    elif event_type == "tool_start":

                        yield format_sse(
                            "tool_start",
                            {
                                "tool": custom_event.get(
                                    "tool",
                                    "unknown",
                                ),
                            },
                        )

                    elif event_type == "tool_end":

                        yield format_sse(
                            "tool_end",
                            {
                                "tool": custom_event.get(
                                    "tool",
                                    "unknown",
                                ),
                            },
                        )

                    elif event_type == "error":

                        yield format_sse(
                            "error",
                            {
                                "message": custom_event.get(
                                    "message",
                                    "An error occurred.",
                                ),
                            },
                        )

                # Node-level updates
                elif event["type"] == "updates":

                    updates = event["data"]

                    for node_name, node_update in updates.items():

                        yield format_sse(
                            "status",
                            {
                                "node": node_name,
                                "status": "completed",
                            },
                        )

                        if node_update.get("final_response"):
                            final_response = (
                                node_update["final_response"]
                            )

            # Fallback if no final response was captured
            if not final_response:

                final_response = (
                    "I couldn't generate a response."
                )

            # Persist assistant response
            async with AsyncSessionLocal() as session:

                assistant_message = Message(
                    conversation_id=conversation_id,
                    role=MessageRole.ASSISTANT,
                    content=final_response,
                )

                session.add(assistant_message)

                await session.flush()

                # Update conversation timestamp
                result = await session.execute(
                    select(Conversation).where(
                        Conversation.id == conversation_id,
                    )
                )

                conversation_record = result.scalar_one_or_none()

                if conversation_record:
                    conversation_record.updated_at = (
                        assistant_message.created_at
                    )

                await session.commit()


            yield format_sse(
                "complete",
                {
                    "conversation_id": str(conversation_id),
                    "response": final_response,
                },
            )

        except Exception as exc:

            print(f"Chat streaming error: {exc}")

            yield format_sse(
                "error",
                {
                    "message": (
                        "An error occurred while processing "
                        "your message."
                    ),
                },
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )