from langchain.tools import tool

from app.services.ai.tools.semantic_registry import (
    METRICS,
    DIMENSIONS,
    FILTER_FIELDS,
)


@tool
def get_available_data() -> dict:
    """
    Discover available invoice data, metrics, dimensions, filter fields,
    and supported operators.

    Call this tool when you are unsure which fields or metrics can be
    used to answer a user's invoice-related question.
    """

    return {
        "metrics": {
            name: config["description"]
            for name, config in METRICS.items()
        },
        "dimensions": {
            name: config["description"]
            for name, config in DIMENSIONS.items()
        },
        "filter_fields": {
            name: {
                "type": config["type"],
                "operators": config["operators"],
            }
            for name, config in FILTER_FIELDS.items()
        },
    }