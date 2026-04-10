# from typing import List, Optional
# from pydantic import BaseModel


# class Tier(BaseModel):
#     threshold: float
#     annual_rate: float


# class SimEvent(BaseModel):
#     year: int
#     net_income: Optional[float] = None
#     income_growth: Optional[float] = None
#     expenses: Optional[float] = None
#     expense_growth: Optional[float] = None
#     tiers: Optional[List[Tier]] = None


# class SimulateRequest(BaseModel):
#     start_cash: float
#     start_year: int
#     end_year: int
#     net_income: float
#     income_growth: float
#     expenses: float
#     expense_growth: float
#     tiers: List[Tier]
#     events: List[SimEvent] = []


# def apply_tiered_interest(balance: float, tiers: List[Tier], periods_per_year: int) -> float:
#     remaining = balance
#     total = 0
#     prev_threshold = 0
#     last_rate = 0

#     for tier in tiers:
#         tier_size = tier.threshold - prev_threshold
#         applied = min(remaining, tier_size)
#         monthly_rate = tier.annual_rate / periods_per_year
#         total += applied * (1 + monthly_rate)
#         remaining -= applied
#         prev_threshold = tier.threshold
#         last_rate = tier.annual_rate
#         if remaining <= 0:
#             return total

#     if remaining > 0:
#         monthly_rate = last_rate / periods_per_year
#         total += remaining * (1 + monthly_rate)

#     return total


# def simulate(req: SimulateRequest) -> list:
#     periods_per_year = 12
#     snapshots = []

#     cash_on_hand = req.start_cash
#     net_income = req.net_income
#     income_growth = req.income_growth
#     expenses = req.expenses
#     expense_growth = req.expense_growth
#     tiers = req.tiers

#     events_by_year = {e.year: e for e in req.events}

#     for year in range(req.start_year, req.end_year + 1):
#         event = events_by_year.get(year)
#         if event:
#             if event.net_income is not None:
#                 net_income = event.net_income
#             if event.income_growth is not None:
#                 income_growth = event.income_growth
#             if event.expenses is not None:
#                 expenses = event.expenses
#             if event.expense_growth is not None:
#                 expense_growth = event.expense_growth
#             if event.tiers is not None:
#                 tiers = event.tiers

#         start_net_income = net_income
#         start_expenses = expenses

#         monthly_income = net_income / 12
#         monthly_expenses = expenses / 12

#         for _ in range(periods_per_year):
#             cash_on_hand += monthly_income
#             cash_on_hand -= monthly_expenses
#             cash_on_hand = apply_tiered_interest(cash_on_hand, tiers, periods_per_year)

#         net_income = round(net_income * (1 + income_growth), 2)
#         expenses = round(expenses * (1 + expense_growth), 2)

#         snapshots.append({
#             "year": year,
#             "cash_on_hand": round(cash_on_hand, 2),
#             "start_net_income": start_net_income,
#             "start_expenses": start_expenses,
#             "net_income": net_income,
#             "expenses": expenses,
#         })

#     return snapshots




"""
finance.py — simulation service
"""

from typing import Dict, List
from schemas.finance import (
    Tier,
    LiquidAccount,
    JobIncome,
    RentalProperty,
    ExpenseSource,
    SimulateRequest,
    SourceSnapshot,
    SimYearResult,
)


# ─── Tiered Interest ──────────────────────────────────────────────────────────

def apply_tiered_interest(balance: float, tiers: List[Tier], periods_per_year: int) -> float:
    if balance <= 0 or not tiers:
        return balance

    remaining = balance
    total = 0.0
    prev_threshold = 0.0
    last_rate = 0.0

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


# ─── Liquid Account Simulator ─────────────────────────────────────────────────

class _LiquidSim:
    def __init__(self, src: LiquidAccount):
        self.id = src.id
        self.name = src.name
        self.source_type = src.source_type
        self._balance = src.balance
        self._tiers = src.interest_tiers
        self._interest_earned = 0.0

    def deposit(self, amount: float):
        self._balance += amount

    def withdraw(self, amount: float):
        self._balance -= amount

    def apply_interest(self, periods_per_year: int):
        new_balance = apply_tiered_interest(self._balance, self._tiers, periods_per_year)
        self._interest_earned += new_balance - self._balance
        self._balance = new_balance

    def balance(self) -> float:
        return self._balance

    def flush_interest(self) -> float:
        """Return interest earned this year and reset the accumulator."""
        earned = self._interest_earned
        self._interest_earned = 0.0
        return earned

    def snapshot(self, annual_interest: float) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type=self.source_type,
            asset_value=round(self._balance, 2),
            annual_cashflow=round(annual_interest, 2),
            start_value=None,
            end_value=None,
        )


# ─── Income Simulator ─────────────────────────────────────────────────────────

class _JobSim:
    def __init__(self, src: JobIncome):
        self.id = src.id
        self.name = src.name
        self._annual = src.net_income
        self._growth = src.income_growth

    def monthly_cashflow(self) -> float:
        return self._annual / 12

    def end_of_year(self):
        self._annual = round(self._annual * (1 + self._growth), 2)

    def snapshot(self, annual_cashflow: float, start: float) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type="job",
            asset_value=0.0,
            annual_cashflow=round(annual_cashflow, 2),
            start_value=round(start, 2),
            end_value=round(start * (1 + self._growth), 2),
        )


# ─── Expense Simulator ────────────────────────────────────────────────────────

class _ExpenseSim:
    def __init__(self, src: ExpenseSource):
        self.id = src.id
        self.name = src.name
        self._annual = src.annual_expense
        self._growth = src.expense_growth

    def monthly_drain(self) -> float:
        return self._annual / 12

    def end_of_year(self):
        self._annual = round(self._annual * (1 + self._growth), 2)

    def snapshot(self, annual_drain: float, start: float) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type="expense",
            asset_value=0.0,
            annual_cashflow=round(-annual_drain, 2),
            start_value=round(start, 2),
            end_value=round(start * (1 + self._growth), 2),
        )


# ─── Asset Simulators ─────────────────────────────────────────────────────────

class _RentalSim:
    def __init__(self, src: RentalProperty):
        self.id = src.id
        self.name = src.name
        self._value = src.purchase_price
        self._appreciation = src.annual_appreciation
        self._monthly_rent = src.monthly_rent
        self._monthly_expenses = src.monthly_expenses

    def monthly_cashflow(self) -> float:
        return self._monthly_rent - self._monthly_expenses

    def asset_value(self) -> float:
        return self._value

    def end_of_year(self):
        # Annual appreciation applied once at year end — matches how rates are quoted
        self._value = round(self._value * (1 + self._appreciation), 2)

    def snapshot(self, annual_cashflow: float) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type="rental",
            asset_value=round(self._value, 2),
            annual_cashflow=round(annual_cashflow, 2),
            start_value=None,
            end_value=None,
        )


def _make_asset_sim(source):
    if source.source_type == "rental":
        return _RentalSim(source)
    raise ValueError(f"Unknown asset source_type: {source.source_type}")


# ─── Main Simulation ──────────────────────────────────────────────────────────

def simulate(req: SimulateRequest) -> List[SimYearResult]:
    periods_per_year = 12
    results: List[SimYearResult] = []

    # ── Build simulators ──────────────────────────────────────────────────────
    liquid_sims: Dict[str, _LiquidSim] = {
        acc.id: _LiquidSim(acc) for acc in req.liquid_accounts
    }
    if not liquid_sims:
        fallback = LiquidAccount(
            source_type="bank_account",
            id="__default__",
            name="Cash",
            balance=0.0,
            interest_tiers=[],
        )
        liquid_sims["__default__"] = _LiquidSim(fallback)

    default_liquid_id = next(iter(liquid_sims))

    income_sims:  Dict[str, _JobSim]     = {s.id: _JobSim(s)         for s in req.incomes}
    expense_sims: Dict[str, _ExpenseSim] = {s.id: _ExpenseSim(s)     for s in req.expenses}
    asset_sims:   Dict[str, _RentalSim]  = {s.id: _make_asset_sim(s) for s in req.assets}

    events_by_year = {e.year: e for e in req.events}

    for year in range(req.start_year, req.end_year + 1):

        # ── Apply year-level events ────────────────────────────────────────
        event = events_by_year.get(year)
        if event:
            for ie in event.income_events:
                sim = income_sims.get(ie.source_id)
                if ie.action == "remove":
                    income_sims.pop(ie.source_id, None)
                elif ie.action == "update" and sim:
                    if ie.net_income    is not None: sim._annual  = ie.net_income
                    if ie.income_growth is not None: sim._growth  = ie.income_growth

            for ee in event.expense_events:
                sim = expense_sims.get(ee.source_id)
                if ee.action == "remove":
                    expense_sims.pop(ee.source_id, None)
                elif ee.action == "update" and sim:
                    if ee.annual_expense is not None: sim._annual = ee.annual_expense
                    if ee.expense_growth is not None: sim._growth = ee.expense_growth

            for ae in event.asset_events:
                sid = ae.source.id
                if ae.action == "add":
                    asset_sims[sid] = _make_asset_sim(ae.source)
                elif ae.action == "remove":
                    asset_sims.pop(sid, None)
                elif ae.action == "update":
                    asset_sims[sid] = _make_asset_sim(ae.source)

        # ── Capture start values BEFORE anything mutates ──────────────────
        income_start:  Dict[str, float] = {sid: sim._annual for sid, sim in income_sims.items()}
        expense_start: Dict[str, float] = {sid: sim._annual for sid, sim in expense_sims.items()}

        income_cashflows: Dict[str, float] = {sid: 0.0 for sid in income_sims}
        expense_drains:   Dict[str, float] = {sid: 0.0 for sid in expense_sims}
        asset_cashflows:  Dict[str, float] = {sid: 0.0 for sid in asset_sims}

        # ── Monthly loop ──────────────────────────────────────────────────
        for _ in range(periods_per_year):
            for sid, sim in income_sims.items():
                cf = sim.monthly_cashflow()
                liquid_sims[default_liquid_id].deposit(cf)
                income_cashflows[sid] += cf

            for sid, sim in expense_sims.items():
                drain = sim.monthly_drain()
                liquid_sims[default_liquid_id].withdraw(drain)
                expense_drains[sid] += drain

            for sid, sim in asset_sims.items():
                cf = sim.monthly_cashflow()
                liquid_sims[default_liquid_id].deposit(cf)
                asset_cashflows[sid] += cf

            for lsim in liquid_sims.values():
                lsim.apply_interest(periods_per_year)

        # ── End-of-year growth (annual, after monthly loop) ───────────────
        for sim in income_sims.values():
            sim.end_of_year()
        for sim in expense_sims.values():
            sim.end_of_year()
        for sim in asset_sims.values():
            sim.end_of_year()

        # ── Snapshots ─────────────────────────────────────────────────────
        liquid_snapshots = [
            lsim.snapshot(lsim.flush_interest())
            for lsim in liquid_sims.values()
        ]
        income_snapshots = [
            sim.snapshot(income_cashflows[sid], income_start[sid])
            for sid, sim in income_sims.items()
        ]
        expense_snapshots = [
            sim.snapshot(expense_drains[sid], expense_start[sid])
            for sid, sim in expense_sims.items()
        ]
        asset_snapshots = [
            sim.snapshot(asset_cashflows[sid])
            for sid, sim in asset_sims.items()
        ]

        all_snapshots = liquid_snapshots + income_snapshots + expense_snapshots + asset_snapshots

        total_cash        = sum(lsim.balance() for lsim in liquid_sims.values())
        total_asset_value = sum(sim.asset_value() for sim in asset_sims.values())

        results.append(SimYearResult(
            year=year,
            net_worth=round(total_cash + total_asset_value, 2),
            total_cash=round(total_cash, 2),
            total_income=round(sum(income_cashflows.values()), 2),
            total_expenses=round(sum(expense_drains.values()), 2),
            sources=all_snapshots,
        ))

    return results