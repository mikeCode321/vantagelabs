
"""
finance.py — simulation service
"""

from typing import Dict, List
from schemas.finance import (
    Event,
    Tier,
    LiquidAccount,
    IncomeSource,
    RentalProperty,
    ExpenseSource,
    SimulateRequest,
    SourceSnapshot,
    SimYearResult,
)
from collections import defaultdict

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
    def __init__(self, src: IncomeSource):
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
        self._monthly_rent = src.monthly_income
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


def _get_asset_by_type(source):
    if source.source_type == "rental":
        return _RentalSim(source)
    raise ValueError(f"Unknown asset source_type: {source.source_type}")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_sim_from_payload(payload):
    if payload.source_type == "liquid":
        return _LiquidSim(payload)
    if payload.source_type == "income":
        return _JobSim(payload)
    if payload.source_type == "expense":
        return _ExpenseSim(payload)
    if payload.source_type == "rental":
        return _RentalSim(payload)
    raise ValueError(f"Unknown source_type: {payload.source_type}")




# ─── Main Simulation ──────────────────────────────────────────────────────────

def simulate(req: SimulateRequest) -> List[SimYearResult]:
    periods_per_year = 12
    results: List[SimYearResult] = []

    liquid_sims: Dict[str, _LiquidSim] = {
        acc.id: _LiquidSim(acc) for acc in req.liquid_accounts
    }

    if not liquid_sims:
        fallback = LiquidAccount(
            id="__default__",
            name="Cash",
            balance=0.0,
            interest_tiers=[],
        )
        liquid_sims["__default__"] = _LiquidSim(fallback)

    default_liquid_id = next(iter(liquid_sims))

    income_sims = {s.id: _JobSim(s) for s in req.incomes}
    expense_sims = {s.id: _ExpenseSim(s) for s in req.expenses}
    asset_sims = {s.id: _RentalSim(s) for s in req.assets}

    events_by_year = defaultdict(list)
    for e in req.events:
        events_by_year[e.year].append(e)

    for year in range(req.start_year, req.end_year + 1):
        # ── APPLY EVENTS ──────────────────────────────────────────────
        for event in events_by_year.get(year, []):
            stype = event.source_type
            sid = event.source_id

            if stype == "liquid":
                target = liquid_sims
            elif stype == "income":
                target = income_sims
            elif stype == "expense":
                target = expense_sims
            else:
                target = asset_sims

            if event.action == "remove":
                target.pop(sid, None)
                continue

            if event.action == "add":
                target[sid] = _build_sim_from_payload(event.add_payload)
                continue

            if event.action == "update":
                sim = target.get(sid)
                if not sim:
                    continue

                upd = event.update_payload

                if isinstance(sim, _LiquidSim):
                    if upd.balance is not None:
                        sim._balance = upd.balance
                    if upd.interest_tiers is not None:
                        sim._tiers = upd.interest_tiers

                elif isinstance(sim, _JobSim):
                    if upd.net_income is not None:
                        sim._annual = upd.net_income
                    if upd.income_growth is not None:
                        sim._growth = upd.income_growth

                elif isinstance(sim, _ExpenseSim):
                    if upd.annual_expense is not None:
                        sim._annual = upd.annual_expense
                    if upd.expense_growth is not None:
                        sim._growth = upd.expense_growth

                elif isinstance(sim, _RentalSim):
                    if upd.purchase_price is not None:
                        sim._value = upd.purchase_price
                    if upd.annual_appreciation is not None:
                        sim._appreciation = upd.annual_appreciation
                    if upd.monthly_income is not None:
                        sim._monthly_rent = upd.monthly_income
                    if upd.monthly_expenses is not None:
                        sim._monthly_expenses = upd.monthly_expenses

        # ── SNAPSHOT START VALUES ─────────────────────────────────────
        income_start = {sid: sim._annual for sid, sim in income_sims.items()}
        expense_start = {sid: sim._annual for sid, sim in expense_sims.items()}

        income_cf = {sid: 0.0 for sid in income_sims}
        expense_cf = {sid: 0.0 for sid in expense_sims}
        asset_cf = {sid: 0.0 for sid in asset_sims}

        # ── MONTHLY LOOP ──────────────────────────────────────────────
        for _ in range(periods_per_year):
            for sid, sim in income_sims.items():
                cf = sim.monthly_cashflow()
                liquid_sims[default_liquid_id].deposit(cf)
                income_cf[sid] += cf

            for sid, sim in expense_sims.items():
                d = sim.monthly_drain()
                liquid_sims[default_liquid_id].withdraw(d)
                expense_cf[sid] += d

            for sid, sim in asset_sims.items():
                cf = sim.monthly_cashflow()
                liquid_sims[default_liquid_id].deposit(cf)
                asset_cf[sid] += cf

            for lsim in liquid_sims.values():
                lsim.apply_interest(periods_per_year)

        # ── YEAR END ──────────────────────────────────────────────────
        for sim in income_sims.values():
            sim.end_of_year()
        for sim in expense_sims.values():
            sim.end_of_year()
        for sim in asset_sims.values():
            sim.end_of_year()

        # ── SNAPSHOTS ─────────────────────────────────────────────────
        snapshots = (
            [lsim.snapshot(lsim.flush_interest()) for lsim in liquid_sims.values()]
            + [sim.snapshot(income_cf[sid], income_start[sid]) for sid, sim in income_sims.items()]
            + [sim.snapshot(expense_cf[sid], expense_start[sid]) for sid, sim in expense_sims.items()]
            + [sim.snapshot(asset_cf[sid]) for sid, sim in asset_sims.items()]
        )

        total_cash = sum(lsim.balance() for lsim in liquid_sims.values())
        total_assets = sum(sim.asset_value() for sim in asset_sims.values())

        results.append(SimYearResult(
            year=year,
            net_worth=round(total_cash + total_assets, 2),
            total_cash=round(total_cash, 2),
            total_income=round(sum(income_cf.values()), 2),
            total_expenses=round(sum(expense_cf.values()), 2),
            sources=snapshots,
        ))

    return results