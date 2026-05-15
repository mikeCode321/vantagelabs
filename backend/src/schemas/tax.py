from pydantic import BaseModel
from typing import Optional, Literal


class TaxRequest(BaseModel):
    gross_income: float
    year: int = 2025
    filing_status: Literal["single", "married_filing_jointly", "head_of_household",] = "single" 
    state: Optional[str] = None


class TaxBreakdown(BaseModel):
    federal: float
    fica: float
    state: float
    total: float
    net: float