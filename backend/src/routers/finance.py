from fastapi import APIRouter
from services.finance import SimulateRequest, simulate

router = APIRouter(prefix="/api/finance", tags=["finance"])


@router.post("/simulate/")
async def run_simulation(payload: SimulateRequest):
    return simulate(payload)