from app.services.ai.tools.query_tool import query_invoice_data
from app.services.ai.tools.data_discovery import get_available_data
from app.services.ai.tools.search_tool import search_invoices
from app.services.ai.tools.invoice_details_tool import get_invoice_details


def get_invoice_tools():
    return [
        query_invoice_data,
        get_available_data,
        search_invoices,
        get_invoice_details,
    ]