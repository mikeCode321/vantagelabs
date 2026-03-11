from fastapi import APIRouter, Request
from typing import List
import services.finance as finance_services
from schemas.finance import CashOnHandRequest, CashOnHandResponse

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.post("/calc_cash_on_hand/")
async def calc_cash_on_hand(payload: CashOnHandRequest):
    result = finance_services.calc_cash_on_hand(
        years=payload.years,
        cash_on_hand=payload.cash_on_hand,
        net_income_dict=payload.net_income,
        expenses_dict=payload.expenses,
        tiers=payload.tiers
    )
    return result