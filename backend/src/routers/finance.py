from fastapi import APIRouter
from typing import List
import services.finance as finance_services

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.get("/api/calc_cash_on_hand/")
async def calc_cash_on_hand(net_income: float, expenses: float, years: int, interest_rates_and_thresholds: List[tuple] ):
    return await finance_services.calc_cash_on_hand(net_income, expenses, years, interest_rates_and_thresholds)