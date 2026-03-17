from fastapi import APIRouter
from typing import List
from schemas.finance import CashOnHandRequest, CashOnHandResponse

import services.finance as finance_services

router = APIRouter(prefix="/api/finance", tags=["finance"])


@router.post("/calc_cash_on_hand/", response_model=List[CashOnHandResponse])
async def calc_cash_on_hand(payload: CashOnHandRequest):
    return finance_services.calc_cash_on_hand(
        years=payload.years,
        cash_on_hand=payload.cash_on_hand,
        net_income_dict=payload.net_income,
        expenses_dict=payload.expenses,
        tiers=payload.tiers,
    )