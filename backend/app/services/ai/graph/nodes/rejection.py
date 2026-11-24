from langchain_core.messages import AIMessage

from app.services.ai.graph.state import InvoiceAgentState


async def rejection_node(
    state: InvoiceAgentState,
) -> dict:
    intent = state.get("intent")

    if intent == "UPLOAD_REQUEST":
        response = (
            "To process an invoice, please use the invoice upload button. "
            "Upload the image or document there, and I'll extract the "
            "invoice details for you."
        )

    else:
        response = (
            "I can help you with invoice-related queries, "
            "invoice searches, and analytics. "
            "Please ask me something related to your invoices."
        )

    return {
        "final_response": response,
        "messages": [
            AIMessage(content=response)
        ],
    }