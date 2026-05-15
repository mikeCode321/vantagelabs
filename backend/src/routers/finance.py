# from typing import List

# from fastapi import APIRouter

# from schemas.finance import SimulateRequest, SimYearResult
# from services.finance import simulate

# router = APIRouter(prefix="/api/finance", tags=["Finance"])

# @router.post("/simulate", response_model=List[SimYearResult])
# def run_simulation(req: SimulateRequest) -> List[SimYearResult]:
#     return simulate(req)