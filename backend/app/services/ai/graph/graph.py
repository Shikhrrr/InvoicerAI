from langgraph.graph import StateGraph, START, END

from app.services.ai.context import InvoiceAgentContext
from app.services.ai.graph.state import InvoiceAgentState

from app.services.ai.graph.nodes.intent_identification import intent_identification_node
from app.services.ai.graph.nodes.context_management import context_management_node
from app.services.ai.graph.nodes.analytical import analytical_node
from app.services.ai.graph.nodes.rejection import rejection_node
from app.services.ai.graph.routing import route_by_intent


def build_invoice_graph(checkpointer=None):

    builder = StateGraph(
        InvoiceAgentState,
        context_schema=InvoiceAgentContext,
    )

    builder.add_node(
        "intent_identification",
        intent_identification_node,
    )

    builder.add_node(
        "context_management",
        context_management_node,
    )

    builder.add_node(
        "analytical",
        analytical_node,
    )

    builder.add_node(
        "rejection",
        rejection_node,
    )

    builder.add_edge(
        START,
        "intent_identification",
    )

    builder.add_conditional_edges(
        "intent_identification",
        route_by_intent,
        {
            "upload_rejection": "rejection",
            "unrelated_rejection": "rejection",
            "context_management": "context_management",
        },
    )

    builder.add_edge(
        "context_management",
        "analytical",
    )

    builder.add_edge(
        "analytical",
        END,
    )

    builder.add_edge(
        "rejection",
        END,
    )

    return builder.compile(
        checkpointer=checkpointer,
    )