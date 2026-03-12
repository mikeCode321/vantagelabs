from pydantic import BaseModel
from typing import List

class IncomeConfig(BaseModel):
    net_income: float
    interest_rate: float  # annual growth rate e.g. 0.03 for 3%

class ExpensesConfig(BaseModel):
    expenses: float
    interest_rate: float  # annual growth rate e.g. 0.02 for 2%

class InterestRateTier(BaseModel):
    threshold: float
    annual_rate: float

class CashOnHandRequest(BaseModel):
    years: int
    cash_on_hand: float
    net_income: IncomeConfig
    expenses: ExpensesConfig
    tiers: List[InterestRateTier]

class CashOnHandResponse(BaseModel):
    result: float