from app.schemas.extraction import ExtractedInvoice
from app.services.server.image_service import ImageService
from app.services.llm.provider_factory import get_llm_provider


class InvoiceExtractionService:

    def __init__(self):
        self.image_service = ImageService()
        self.llm_provider = get_llm_provider()

    async def extract_invoice(
        self,
        image_url: str,
        user_id: str,
        invoice_id: str,
        invoice_repository,
    ) -> tuple[ExtractedInvoice, dict]:

        # 1. Retrieve image
        image_bytes, mime_type, image_hash = (
            await self.image_service.retrieve_image(image_url)
        )

        # 2. Extraction prompt
        prompt = """
        You are an invoice data extraction system.

        Carefully examine the provided invoice image and extract all available information.

        Extract:
        - Invoice number
        - Invoice date
        - Customer name
        - Customer phone
        - Subtotal
        - Tax
        - Discount
        - Total amount
        - Currency
        - All invoice line items

        Rules:
        1. Extract only information visible in the image.
        2. Never invent or assume missing values.
        3. Return null for unavailable optional fields.
        4. Preserve product names as written.
        5. Extract quantities, unit prices, and line totals accurately.
        6. Use INR when the invoice clearly uses Indian Rupees.
        7. Do not calculate missing values yourself.
        8. Do not confuse subtotal with total amount.
        9. Do not include payment information as invoice line items.
        10. Return data matching the provided structured schema.
        """

        # 3. Call LLM
        response = await self.llm_provider.generate_structured(
            prompt=prompt,
            image_bytes=image_bytes,
            mime_type=mime_type,
            response_schema=ExtractedInvoice,
        )

        extracted_invoice = response.parsed

        # 4. Invoice-number duplicate detection
        duplicate_invoice = None

        if extracted_invoice.invoice_number:

            duplicate_invoice = (
                await invoice_repository.find_by_invoice_number(
                    user_id=user_id,
                    invoice_number=extracted_invoice.invoice_number,
                )
            )

            # Avoid marking the current invoice as a duplicate of itself
            if (
                duplicate_invoice
                and str(duplicate_invoice.id) == str(invoice_id)
            ):
                duplicate_invoice = None

        # 5. Duplicate metadata
        duplicate_info = {
            "is_duplicate": duplicate_invoice is not None,
            "duplicate_type": (
                "invoice_number"
                if duplicate_invoice
                else None
            ),
            "duplicate_of_invoice_id": (
                str(duplicate_invoice.id)
                if duplicate_invoice
                else None
            ),
        }

        # 6. Return extracted data and metadata
        return extracted_invoice, {
            "raw_text": response.raw_text,
            "provider": response.provider,
            "model": response.model,
            "image_hash": image_hash,
            **duplicate_info,
        }