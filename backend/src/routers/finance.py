# from fastapi import APIRouter
# from services.finance import SimulateRequest, simulate

# router = APIRouter(prefix="/api/finance", tags=["finance"])


# @router.post("/simulate/")
# async def run_simulation(payload: SimulateRequest):
#     return simulate(payload)

from typing import List

from fastapi import APIRouter

from schemas.finance import SimulateRequest, SimYearResult
from services.finance import simulate

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.post("/simulate", response_model=List[SimYearResult])
def run_simulation(req: SimulateRequest) -> List[SimYearResult]:
    return simulate(req)