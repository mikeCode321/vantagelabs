"""
finance.py — simulation service
"""

from typing import Dict, List, Optional
from schemas.finance import (
    Tier,
    LiquidAccount,
    IncomeSource,
    RentalProperty,
    StockPortfolio,
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
        self.start_year = src.start_year
        self.end_year = src.end_year
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
        )


# ─── Income Simulator ─────────────────────────────────────────────────────────

class _JobSim:
    def __init__(self, src: IncomeSource):
        self.id = src.id
        self.name = src.name
        self.start_year = src.start_year
        self.end_year = src.end_year
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
            source_type="income",
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
        self.start_year = src.start_year
        self.end_year = src.end_year
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
        self.source_type = src.source_type
        self.start_year = src.start_year
        self.end_year = src.end_year
        self._value = src.purchase_price
        self._appreciation = src.annual_appreciation
        self._monthly_rent = src.monthly_income
        self._monthly_expenses = src.monthly_expenses

    def monthly_cashflow(self) -> float:
        return self._monthly_rent - self._monthly_expenses

    def asset_value(self) -> float:
        return self._value

    def sale_proceeds(self) -> float:
        """Return current asset value as sale proceeds."""
        return self._value

    def end_of_year(self):
        self._value = round(self._value * (1 + self._appreciation), 2)

    def snapshot(self, annual_cashflow: float, sale_proceeds: Optional[float] = None) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type="rental",
            asset_value=round(self._value, 2),
            annual_cashflow=round(annual_cashflow, 2),
            sale_proceeds=round(sale_proceeds, 2) if sale_proceeds is not None else None,
        )


class _StockSim:
    def __init__(self, src: StockPortfolio):
        self.id = src.id
        self.name = src.name
        self.source_type = src.source_type
        self.start_year = src.start_year
        self.end_year = src.end_year
        self._value = src.initial_value
        self._annual_return = src.annual_return
        self._monthly_contribution = src.monthly_contribution
        self._dividend_yield = src.dividend_yield

    def monthly_cashflow(self) -> float:
        # Dividends paid out as cash; contributions are deposits into the asset, not net cashflow
        return (self._value * self._dividend_yield) / 12

    def monthly_contribution(self) -> float:
        return self._monthly_contribution

    def asset_value(self) -> float:
        return self._value

    def sale_proceeds(self) -> float:
        """Return current asset value as sale proceeds."""
        return self._value

    def end_of_year(self):
        # Apply annual return to the full year's average balance (simplified: apply to end value)
        self._value = round(self._value * (1 + self._annual_return), 2)

    def snapshot(self, annual_cashflow: float, sale_proceeds: Optional[float] = None) -> SourceSnapshot:
        return SourceSnapshot(
            id=self.id,
            name=self.name,
            source_type="stock",
            asset_value=round(self._value, 2),
            annual_cashflow=round(annual_cashflow, 2),
            sale_proceeds=round(sale_proceeds, 2) if sale_proceeds is not None else None,
        )


# ─── Main Simulation ──────────────────────────────────────────────────────────

def simulate(req: SimulateRequest) -> List[SimYearResult]:
    periods_per_year = 12
    results: List[SimYearResult] = []

    # Build all sim objects up front — start_year/end_year gates their activity per year
    all_liquid: List[_LiquidSim] = [_LiquidSim(acc) for acc in req.liquid_accounts]
    all_income: List[_JobSim] = [_JobSim(s) for s in req.incomes]
    all_expense: List[_ExpenseSim] = [_ExpenseSim(s) for s in req.expenses]
    all_assets: List[_RentalSim | _StockSim] = [
        _RentalSim(s) if s.source_type == "rental" else _StockSim(s)
        for s in req.assets
    ]

    # Fallback cash account if no liquid accounts provided
    if not all_liquid:
        fallback = LiquidAccount(
            id="__default__",
            name="Cash",
            start_year=req.start_year,
            end_year=req.end_year,
            balance=0.0,
            interest_tiers=[],
        )
        all_liquid = [_LiquidSim(fallback)]

    # Cash flows always deposit/withdraw into the first active liquid account
    def default_liquid(year: int) -> _LiquidSim:
        for lsim in all_liquid:
            if lsim.start_year <= year <= lsim.end_year:
                return lsim
        # Fall back to first account if none are in range
        return all_liquid[0]

    for year in range(req.start_year, req.end_year + 1):

        # ── ACTIVE SETS FOR THIS YEAR ─────────────────────────────────────────
        liquid_active = [s for s in all_liquid if s.start_year <= year <= s.end_year]
        income_active = [s for s in all_income if s.start_year <= year <= s.end_year]
        expense_active = [s for s in all_expense if s.start_year <= year <= s.end_year]
        asset_active = [s for s in all_assets if s.start_year <= year <= s.end_year]

        cash_sink = default_liquid(year)

        # ── SNAPSHOT START VALUES ─────────────────────────────────────────────
        income_start = {s.id: s._annual for s in income_active}
        expense_start = {s.id: s._annual for s in expense_active}

        income_cf: Dict[str, float] = {s.id: 0.0 for s in income_active}
        expense_cf: Dict[str, float] = {s.id: 0.0 for s in expense_active}
        asset_cf: Dict[str, float] = {s.id: 0.0 for s in asset_active}

        # ── MONTHLY LOOP ──────────────────────────────────────────────────────
        for _ in range(periods_per_year):
            for sim in income_active:
                cf = sim.monthly_cashflow()
                cash_sink.deposit(cf)
                income_cf[sim.id] += cf

            for sim in expense_active:
                d = sim.monthly_drain()
                cash_sink.withdraw(d)
                expense_cf[sim.id] += d

            for sim in asset_active:
                cf = sim.monthly_cashflow()
                cash_sink.deposit(cf)
                asset_cf[sim.id] += cf

                # Stock: monthly contributions come out of cash
                if isinstance(sim, _StockSim):
                    contrib = sim.monthly_contribution()
                    cash_sink.withdraw(contrib)
                    sim._value += contrib

            for lsim in liquid_active:
                lsim.apply_interest(periods_per_year)

        # ── YEAR END ──────────────────────────────────────────────────────────
        for sim in income_active:
            sim.end_of_year()
        for sim in expense_active:
            sim.end_of_year()
        for sim in asset_active:
            sim.end_of_year()

        # ── ASSET SALES ───────────────────────────────────────────────────────
        # Assets reaching end_year are sold; proceeds deposited into default liquid
        assets_sold = set()
        for sim in asset_active:
            if sim.end_year == year:
                proceeds = sim.sale_proceeds()
                cash_sink.deposit(proceeds)
                assets_sold.add(sim.id)

        # ── SNAPSHOTS ─────────────────────────────────────────────────────────
        # For sold assets: set asset_value to 0 (liquidated) and show sale_proceeds
        def make_asset_snapshot(sim):
            if sim.id in assets_sold:
                # Asset was sold - show as liquidated with sale proceeds
                snapshot = sim.snapshot(asset_cf[sim.id], sale_proceeds=sim.sale_proceeds())
                # Override asset_value to 0 since we no longer own it
                snapshot.asset_value = 0.0
                return snapshot
            else:
                # Normal asset snapshot
                return sim.snapshot(asset_cf[sim.id], sale_proceeds=None)

        snapshots = (
            [lsim.snapshot(lsim.flush_interest()) for lsim in liquid_active]
            + [sim.snapshot(income_cf[sim.id], income_start[sim.id]) for sim in income_active]
            + [sim.snapshot(expense_cf[sim.id], expense_start[sim.id]) for sim in expense_active]
            + [make_asset_snapshot(sim) for sim in asset_active]
        )

        total_cash = sum(lsim.balance() for lsim in liquid_active)
        # Exclude sold assets from total_assets - their value is now in cash
        total_assets = sum(
            sim.asset_value() for sim in asset_active 
            if sim.id not in assets_sold
        )

        results.append(SimYearResult(
            year=year,
            net_worth=round(total_cash + total_assets, 2),
            total_cash=round(total_cash, 2),
            total_income=round(sum(income_cf.values()), 2),
            total_expenses=round(sum(expense_cf.values()), 2),
            sources=snapshots,
        ))

    return results