
from fastapi import APIRouter
from schemas.tax import TaxRequest, TaxBreakdown, SETaxRequest
from services.tax import TaxService

router = APIRouter(prefix="/api/tax", tags=["Tax"])

@router.post("/calculate", response_model=TaxBreakdown)
def calculate_tax(payload: TaxRequest):
    tax_service = TaxService(payload.filing_status, payload.state)
    return tax_service.calculate_income_taxes(
        gross_income=payload.gross_income,
        pre_tax_deductions=payload.deductions
    )

@router.post("/calculate-se")
def calculate_se_tax(payload: SETaxRequest):
    tax_service = TaxService(payload.filing_status, payload.state)
    return tax_service.calculate_se_income_taxes(
        gross_income=payload.gross_income,
    )