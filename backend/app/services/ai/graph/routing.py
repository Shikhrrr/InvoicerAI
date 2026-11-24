from app.services.ai.graph.state import InvoiceAgentState


def route_by_intent(state: InvoiceAgentState) -> str:

    intent = state.get("intent")

    if intent == "UPLOAD_REQUEST":
        return "upload_rejection"

    if intent == "UNRELATED":
        return "unrelated_rejection"

    if intent == "INVOICE_QUERY":
        return "context_management"

    return "unrelated_rejection"