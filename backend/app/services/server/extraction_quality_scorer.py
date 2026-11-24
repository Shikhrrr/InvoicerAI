from dataclasses import dataclass

from app.services.server.extraction_validator import ExtractionValidationResult


@dataclass
class ExtractionQualityResult:
    score: int
    label: str


class ExtractionQualityScorer:
    MAX_SCORE = 100

    DEDUCTIONS = {
        "missing_invoice_number": 5,
        "missing_invoice_date": 5,
        "missing_total_amount": 15,
        "empty_items": 15,
        "missing_product_name": 5,
        "negative_value": 10,
        "item_total_mismatch": 10,
        "subtotal_mismatch": 10,
        "total_calculation_mismatch": 10,
    }

    def calculate(
        self,
        validation_result: ExtractionValidationResult,
    ) -> ExtractionQualityResult:

        score = self.MAX_SCORE

        all_issues = (
            validation_result.issues
            + validation_result.warnings
        )

        for issue in all_issues:
            deduction = self.DEDUCTIONS.get(issue.code, 0)
            score -= deduction

        score = max(0, min(self.MAX_SCORE, score))

        return ExtractionQualityResult(
            score=score,
            label=self._get_label(score),
        )

    @staticmethod
    def _get_label(score: int) -> str:
        if score >= 90:
            return "HIGH"
        elif score >= 70:
            return "ACCEPTABLE"
        elif score >= 50:
            return "LOW"
        else:
            return "VERY_LOW"