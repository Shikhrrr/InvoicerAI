from typing import Any

from langchain.tools import tool
from langchain.tools import ToolRuntime
from dataclasses import dataclass
from sqlalchemy.exc import SQLAlchemyError

from app.services.ai.tools.query_schema import InvoiceQueryPlan
from app.services.ai.tools.query_validator import (
    validate_query_plan,
    QueryValidationError,
)
from app.services.ai.tools.query_compiler import (
    compile_invoice_query,
    QueryCompilationError,
)

from app.services.ai.context import InvoiceAgentContext


def serialize_value(value: Any) -> Any:
    """Convert database values into JSON-serializable values."""

    if value is None:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    if hasattr(value, "value"):
        return value.value

    if isinstance(value, (int, float, str, bool)):
        return value

    return str(value)


@tool
async def query_invoice_data(
    plan: InvoiceQueryPlan,
    runtime: ToolRuntime[InvoiceAgentContext],
) -> dict:
    """
    Query invoice data using supported metrics, dimensions, filters,
    and sorting.

    Use this tool for questions involving revenue, invoice counts,
    average invoice value, quantities sold, product performance,
    customer performance, trends, and comparisons.

    The query is automatically restricted to the authenticated user.
    """

    try:
        # ----------------------------------------------------
        # 1. Validate the AI-generated query plan
        # ----------------------------------------------------

        validated_plan = validate_query_plan(plan)

        # ----------------------------------------------------
        # 2. Get authenticated execution context
        # ----------------------------------------------------

        context = runtime.context

        user_id = context.user_id
        session_factory = context.session_factory

        # ----------------------------------------------------
        # 3. Compile the query
        # ----------------------------------------------------

        query = compile_invoice_query(
            plan=validated_plan,
            user_id=user_id,
        )

        # ----------------------------------------------------
        # 4. Execute query
        # ----------------------------------------------------

        async with session_factory() as session:
            result = await session.execute(query)

            rows = result.mappings().all()

        # ----------------------------------------------------
        # 5. Serialize results
        # ----------------------------------------------------

        serialized_rows = []

        for row in rows:
            serialized_rows.append(
                {
                    key: serialize_value(value)
                    for key, value in row.items()
                }
            )

        return {
            "success": True,
            "query": {
                "metrics": validated_plan.metrics,
                "dimensions": validated_plan.dimensions,
                "filters": [
                    query_filter.model_dump()
                    for query_filter in validated_plan.filters
                ],
            },
            "row_count": len(serialized_rows),
            "results": serialized_rows,
        }

    except QueryValidationError as exc:
        return {
            "success": False,
            "error": "Invalid query",
            "message": str(exc),
        }

    except QueryCompilationError as exc:
        return {
            "success": False,
            "error": "Query compilation failed",
            "message": str(exc),
        }

    except SQLAlchemyError:
        return {
            "success": False,
            "error": "Database query failed",
            "message": "The query could not be executed.",
        }

    except Exception:
        return {
            "success": False,
            "error": "Unexpected query error",
            "message": "An unexpected error occurred while querying invoice data.",
        }