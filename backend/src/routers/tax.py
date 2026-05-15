
from fastapi import APIRouter
from schemas.tax import TaxRequest, TaxBreakdown
from services.tax import calculate_income_taxes

router = APIRouter(prefix="/api/tax", tags=["Tax"])

@router.post("/calculate", response_model=TaxBreakdown)
def calculate_tax(payload: TaxRequest):
    return calculate_income_taxes(
        gross_income=payload.gross_income,
        year=payload.year,
        filing_status=payload.filing_status,
        state=payload.state,
    )