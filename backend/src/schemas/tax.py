from pydantic import BaseModel
from typing import Optional, Literal


class TaxRequest(BaseModel):
    gross_income: float
    deductions: int = 0
    filing_status: Literal["single", "married_filing_jointly", "head_of_household",] = "single" 
    state: Optional[str] = None

class SETaxRequest(BaseModel):
    gross_income: float
    filing_status: Literal["single", "married_filing_jointly", "head_of_household",] = "single" 
    state: Optional[str] = None

class TaxBreakdown(BaseModel):
    federal: float
    fica: float
    state: float
    total: float