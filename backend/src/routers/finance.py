"""
routes/finance.py - API endpoints
"""

from fastapi import APIRouter
from schemas.finance import SimulateRequest, SimulationResult
from services.finance import simulate

router = APIRouter(prefix="/api/finance", tags=["Finance"])

# @router.post("/simulate", response_model=SimulationResult)
@router.post("/simulate")
def run_simulation(req: SimulateRequest) :
    return simulate(req)