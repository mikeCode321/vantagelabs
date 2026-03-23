from typing import List, Optional
from pydantic import BaseModel


class Tier(BaseModel):
    threshold: float
    annual_rate: float


class SimEvent(BaseModel):
    year: int
    net_income: Optional[float] = None
    income_growth: Optional[float] = None
    expenses: Optional[float] = None
    expense_growth: Optional[float] = None
    tiers: Optional[List[Tier]] = None


class SimulateRequest(BaseModel):
    start_cash: float
    start_year: int
    end_year: int
    net_income: float
    income_growth: float
    expenses: float
    expense_growth: float
    tiers: List[Tier]
    events: List[SimEvent] = []


def apply_tiered_interest(balance: float, tiers: List[Tier], periods_per_year: int) -> float:
    remaining = balance
    total = 0
    prev_threshold = 0
    last_rate = 0

    for tier in tiers:
        tier_size = tier.threshold - prev_threshold
        applied = min(remaining, tier_size)
        monthly_rate = tier.annual_rate / periods_per_year
        total += applied * (1 + monthly_rate)
        remaining -= applied
        prev_threshold = tier.threshold
        last_rate = tier.annual_rate
        if remaining <= 0:
            return total

    if remaining > 0:
        monthly_rate = last_rate / periods_per_year
        total += remaining * (1 + monthly_rate)

    return total


def simulate(req: SimulateRequest) -> list:
    periods_per_year = 12
    snapshots = []

    cash_on_hand = req.start_cash
    net_income = req.net_income
    income_growth = req.income_growth
    expenses = req.expenses
    expense_growth = req.expense_growth
    tiers = req.tiers

    events_by_year = {e.year: e for e in req.events}

    for year in range(req.start_year, req.end_year + 1):
        event = events_by_year.get(year)
        if event:
            if event.net_income is not None:
                net_income = event.net_income
            if event.income_growth is not None:
                income_growth = event.income_growth
            if event.expenses is not None:
                expenses = event.expenses
            if event.expense_growth is not None:
                expense_growth = event.expense_growth
            if event.tiers is not None:
                tiers = event.tiers

        monthly_income = net_income / 12
        monthly_expenses = expenses / 12

        for _ in range(periods_per_year):
            cash_on_hand += monthly_income
            cash_on_hand -= monthly_expenses
            cash_on_hand = apply_tiered_interest(cash_on_hand, tiers, periods_per_year)

        net_income = round(net_income * (1 + income_growth), 2)
        expenses = round(expenses * (1 + expense_growth), 2)

        snapshots.append({
            "year": year,
            "cash_on_hand": round(cash_on_hand, 2),
            "net_income": net_income,
            "expenses": expenses,
        })

    return snapshots