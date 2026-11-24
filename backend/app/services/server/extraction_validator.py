from dataclasses import dataclass, field
from decimal import Decimal

from app.schemas.extraction import ExtractedInvoice


# Tolerance for rounding differences in currency calculations.
TOLERANCE = Decimal("0.01")


@dataclass
class ValidationIssue:
    code: str
    message: str
    severity: str


@dataclass
class ExtractionValidationResult:
    is_valid: bool = True
    issues: list[ValidationIssue] = field(default_factory=list)
    warnings: list[ValidationIssue] = field(default_factory=list)


class ExtractionValidator:

    def validate(
        self,
        invoice: ExtractedInvoice,
    ) -> ExtractionValidationResult:

        result = ExtractionValidationResult()

        # 1. Validate invoice-level numeric fields
        self._validate_non_negative(
            invoice.subtotal,
            "subtotal",
            result,
        )

        self._validate_non_negative(
            invoice.tax,
            "tax",
            result,
        )

        self._validate_non_negative(
            invoice.discount,
            "discount",
            result,
        )

        self._validate_non_negative(
            invoice.total_amount,
            "total_amount",
            result,
        )

        # 2. Validate important missing fields
        if invoice.invoice_number is None:
            self._add_warning(
                result,
                "missing_invoice_number",
                "Invoice number was not extracted.",
            )

        if invoice.invoice_date is None:
            self._add_warning(
                result,
                "missing_invoice_date",
                "Invoice date was not extracted.",
            )

        if invoice.total_amount is None:
            self._add_warning(
                result,
                "missing_total_amount",
                "Invoice total amount was not extracted.",
            )

        # 3. Validate line items
        if not invoice.items:
            self._add_warning(
                result,
                "no_line_items",
                "No invoice line items were extracted.",
            )

        for index, item in enumerate(invoice.items):

            prefix = f"Item {index + 1}"

            # Negative values
            self._validate_non_negative(
                item.quantity,
                f"{prefix} quantity",
                result,
            )

            self._validate_non_negative(
                item.unit_price,
                f"{prefix} unit price",
                result,
            )

            self._validate_non_negative(
                item.total_price,
                f"{prefix} total price",
                result,
            )

            # Missing product name
            if not item.product_name.strip():
                self._add_error(
                    result,
                    "missing_product_name",
                    f"{prefix} has no product name.",
                )

            # Quantity × unit price consistency
            expected_total = (
                item.quantity * item.unit_price
            )

            if abs(expected_total - item.total_price) > TOLERANCE:
                self._add_warning(
                    result,
                    "line_item_total_mismatch",
                    (
                        f"{prefix}: quantity × unit price "
                        f"({expected_total}) differs from "
                        f"extracted total ({item.total_price})."
                    ),
                )

        # 4. Subtotal vs line-item sum
        if (
            invoice.subtotal is not None
            and invoice.items
        ):
            calculated_subtotal = sum(
                (
                    item.total_price
                    for item in invoice.items
                ),
                Decimal("0"),
            )

            if (
                abs(
                    calculated_subtotal
                    - invoice.subtotal
                )
                > TOLERANCE
            ):
                self._add_warning(
                    result,
                    "subtotal_mismatch",
                    (
                        f"Extracted subtotal "
                        f"({invoice.subtotal}) differs "
                        f"from line-item sum "
                        f"({calculated_subtotal})."
                    ),
                )

        # 5. Invoice total consistency
        if (
            invoice.subtotal is not None
            and invoice.total_amount is not None
        ):
            tax = invoice.tax or Decimal("0")
            discount = invoice.discount or Decimal("0")

            expected_total = (
                invoice.subtotal
                + tax
                - discount
            )

            if (
                abs(
                    expected_total
                    - invoice.total_amount
                )
                > TOLERANCE
            ):
                self._add_warning(
                    result,
                    "invoice_total_mismatch",
                    (
                        f"Calculated invoice total "
                        f"({expected_total}) differs "
                        f"from extracted total "
                        f"({invoice.total_amount})."
                    ),
                )

        return result

    # --------------------------------------------------
    # Helper methods
    # --------------------------------------------------

    @staticmethod
    def _validate_non_negative(
        value: Decimal | None,
        field_name: str,
        result: ExtractionValidationResult,
    ):

        if value is not None and value < 0:
            ExtractionValidator._add_error(
                result,
                "negative_value",
                f"{field_name} cannot be negative.",
            )

    @staticmethod
    def _add_error(
        result: ExtractionValidationResult,
        code: str,
        message: str,
    ):

        result.is_valid = False

        result.issues.append(
            ValidationIssue(
                code=code,
                message=message,
                severity="error",
            )
        )

    @staticmethod
    def _add_warning(
        result: ExtractionValidationResult,
        code: str,
        message: str,
    ):

        result.warnings.append(
            ValidationIssue(
                code=code,
                message=message,
                severity="warning",
            )
        )