from typing import Dict, List
from schemas.finance import (
    Tier,
    LiquidAccount,
    CheckingAccount,
    TaxableInvestmentAccount,
    EmployerRetirementAccount,
    IncomeSource,
    SalaryIncome,
    HourlyWageIncome,
    SideHustleIncome,
    AssetSource,
    HouseAsset,
    CarAsset,
    ExpenseSource,
    HouseLoanExpense,
    CarLoanExpense,
    LivingExpense,
    RentExpense,
    DebtExpense,
    SimulateRequest,
    SimYearResult,
    SimulationResult,
    SimulationMetrics,
    AccountSnapshot,
    IncomeSnapshot,
    ExpenseSnapshot,
    AssetSnapshot,
    LiquidAccountsSummary,
    IncomesSummary,
    ExpensesSummary,
    AssetsSummary,
)
from services.tax import calculate_income_taxes

# ─── Tiered Interest ──────────────────────────────────────────────────────────

def apply_tiered_interest(balance: float, tiers: List[Tier],
                          periods_per_year: int) -> float:
    """Apply tiered interest to balance"""
    if balance <= 0 or not tiers:
        return balance

    remaining = balance
    total = 0.0
    prev_threshold = 0.0
    last_rate = 0.0

    for tier in tiers:
        tier_size = tier.threshold - prev_threshold
        applied = min(remaining, tier_size)
        period_rate = tier.annual_rate / periods_per_year
        total += applied * (1 + period_rate)
        remaining -= applied
        prev_threshold = tier.threshold
        last_rate = tier.annual_rate
        if remaining <= 0:
            return total

    if remaining > 0:
        period_rate = last_rate / periods_per_year
        total += remaining * (1 + period_rate)

    return total


# ─── Loan Amortization ────────────────────────────────────────────────────────

def calculate_loan_balance( original_principal: float, interest_rate: float, loan_term_months: int, months_elapsed: int, ) -> float:
    if months_elapsed >= loan_term_months:
        return 0.0

    monthly_rate = interest_rate / 12

    if monthly_rate == 0:
        monthly_payment = original_principal / loan_term_months
        return max(0, original_principal - monthly_payment * months_elapsed)

    monthly_payment = (original_principal * (monthly_rate * (1 + monthly_rate)**loan_term_months) / ((1 + monthly_rate)**loan_term_months - 1))

    remaining_payments = loan_term_months - months_elapsed

    balance = (monthly_payment * ((1 + monthly_rate)**remaining_payments - 1) / (monthly_rate * (1 + monthly_rate)**remaining_payments))

    return max(0, balance)


# ─── Liquid Account Simulators ────────────────────────────────────────────────


class CheckingAccountSim:

    def __init__(self, src: CheckingAccount):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.balance_amount = src.starting_balance
        self.tiers = src.interest_tiers
        self.interest_earned = 0.0

    def deposit(self, amount: float):
        self.balance_amount += amount

    def withdraw(self, amount: float):
        self.balance_amount = max(0, self.balance_amount - amount) # maybe we can change this to allow going negative 

    def apply_interest(self, periods_per_year: int):
        new_balance = apply_tiered_interest(self.balance_amount, self.tiers, periods_per_year)
        interest = new_balance - self.balance_amount
        self.interest_earned += interest
        self.balance_amount = new_balance

    def apply_dividends(self, periods_per_year: int):
        return 0.0

    def balance(self) -> float:
        return self.balance_amount

    def flush_interest(self) -> float:
        earned = self.interest_earned
        self.interest_earned = 0.0
        return earned

    def snapshot(self, annual_interest: float, growth_rate: float) -> AccountSnapshot:
        return AccountSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            balance=round(self.balance_amount, 2),
            annual_interest_earned=round(annual_interest, 2),
            growth_rate=growth_rate,
        )


class TaxableInvestmentAccountSim:

    def __init__(self, src: TaxableInvestmentAccount):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.balance_amount = src.starting_balance
        self.expected_return = src.expected_return
        self.dividend_yield = src.dividend_yield
        self.dividend_reinvestment = src.dividend_reinvestment
        self.contribution_mode = src.contribution_mode
        self.monthly_contribution = src.monthly_contribution
        self.contribution_percentage = src.contribution_percentage
        self.linked_income_id = src.linked_income_id
        self.interest_earned = 0.0
        self.dividends_earned = 0.0

    def deposit(self, amount: float):
        self.balance_amount += amount

    def withdraw(self, amount: float):
        self.balance_amount = max(0, self.balance_amount - amount)

    def apply_interest(self, periods_per_year: int):
        """Apply expected return"""
        period_return = self.expected_return / periods_per_year
        gains = self.balance_amount * period_return
        self.balance_amount += gains
        self.interest_earned += gains

    def apply_dividends(self, periods_per_year: int):
        """Apply dividend yield"""
        period_dividend = (self.balance_amount * self.dividend_yield) / periods_per_year
        self.dividends_earned += period_dividend

        if self.dividend_reinvestment == "drip":
            self.balance_amount += period_dividend
            return 0.0
        else:
            return period_dividend

    def balance(self) -> float:
        return self.balance_amount

    def flush_interest(self) -> float:
        earned = self.interest_earned
        self.interest_earned = 0.0
        return earned

    def snapshot(self, annual_interest: float, growth_rate: float) -> AccountSnapshot:
        return AccountSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            balance=round(self.balance_amount, 2),
            annual_interest_earned=round(annual_interest, 2),
            growth_rate=growth_rate,
        )


class EmployerRetirementAccountSim:

    def __init__(self, src: EmployerRetirementAccount):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.balance_amount = src.starting_balance
        self.expected_return = src.expected_return
        self.dividend_yield = src.dividend_yield
        self.dividend_reinvestment = src.dividend_reinvestment
        self.contribution_mode = src.contribution_mode
        self.monthly_contribution = src.monthly_contribution
        self.contribution_percentage = src.contribution_percentage
        self.linked_income_id = src.linked_income_id
        self.employer_match = src.employer_match
        self.interest_earned = 0.0
        self.dividends_earned = 0.0

    def deposit(self, amount: float):
        self.balance_amount += amount

    def withdraw(self, amount: float):
        self.balance_amount = max(0, self.balance_amount - amount)

    def apply_interest(self, periods_per_year: int):
        """Apply expected return"""
        period_return = self.expected_return / periods_per_year
        gains = self.balance_amount * period_return
        self.balance_amount += gains
        self.interest_earned += gains

    def apply_dividends(self, periods_per_year: int):
        """Apply dividend yield"""
        period_dividend = (self.balance_amount *
                           self.dividend_yield) / periods_per_year
        self.dividends_earned += period_dividend

        if self.dividend_reinvestment == "drip":
            self.balance_amount += period_dividend
            return 0.0
        else:
            return period_dividend

    def balance(self) -> float:
        return self.balance_amount

    def flush_interest(self) -> float:
        earned = self.interest_earned
        self.interest_earned = 0.0
        return earned

    def snapshot(self, annual_interest: float, growth_rate: float) -> AccountSnapshot:
        return AccountSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            balance=round(self.balance_amount, 2),
            annual_interest_earned=round(annual_interest, 2),
            growth_rate=growth_rate,
        )


# ─── Income Simulators ────────────────────────────────────────────────────────

class SalaryIncomeSim:

    def __init__(self, src: SalaryIncome):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.gross_annual = src.gross_income
        self.growth = src.income_growth
        self.net_annual = 0.0
        self.federal_tax = 0.0
        self.fica_tax = 0.0
        self.state_tax = 0.0
        self.total_tax = 0.0

    def calculate_taxes(self, year: int, filing_status: str, state: str | None):
        tax_breakdown = calculate_income_taxes(
            gross_income=self.gross_annual,
            year=year,
            filing_status=filing_status,
            state=state,
        )

        self.net_annual = tax_breakdown.net
        self.federal_tax = tax_breakdown.federal
        self.fica_tax = tax_breakdown.fica
        self.state_tax = tax_breakdown.state
        self.total_tax = tax_breakdown.total

    def monthly_cashflow(self) -> float:
        return self.net_annual / 12

    def gross_monthly(self) -> float:
        return self.gross_annual / 12

    def end_of_year(self):
        self.gross_annual = round(self.gross_annual * (1 + self.growth), 2)

    def snapshot( self, annual_cashflow: float, start_gross: float, is_active: bool, ) -> IncomeSnapshot:
        return IncomeSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            gross_annual=round(self.gross_annual, 2),
            federal_tax=round(self.federal_tax, 2),
            fica_tax=round(self.fica_tax, 2),
            state_tax=round(self.state_tax, 2),
            total_tax=round(self.total_tax, 2),
            net_annual=round(self.net_annual, 2),
            growth_rate=self.growth,
            start_value=round(start_gross, 2),
            end_value=round(start_gross * (1 + self.growth), 2),
            is_active=is_active,
        )


class HourlyWageIncomeSim:

    def __init__(self, src: HourlyWageIncome):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.gross_annual = src.gross_income
        self.growth = src.income_growth
        self.hourly_rate = src.hourly_rate
        self.hours_per_week = src.hours_per_week
        self.net_annual = 0.0
        self.federal_tax = 0.0
        self.fica_tax = 0.0
        self.state_tax = 0.0
        self.total_tax = 0.0

    def calculate_taxes(self, year: int, filing_status: str, state: str | None):
        tax_breakdown = calculate_income_taxes(
            gross_income=self.gross_annual,
            year=year,
            filing_status=filing_status,
            state=state,
        )

        self.net_annual = tax_breakdown.net
        self.federal_tax = tax_breakdown.federal
        self.fica_tax = tax_breakdown.fica
        self.state_tax = tax_breakdown.state
        self.total_tax = tax_breakdown.total

    def monthly_cashflow(self) -> float:
        return self.net_annual / 12

    def gross_monthly(self) -> float:
        return self.gross_annual / 12

    def end_of_year(self):
        self.gross_annual = round(self.gross_annual * (1 + self.growth), 2)

    def snapshot( self, annual_cashflow: float, start_gross: float, is_active: bool, ) -> IncomeSnapshot:
        return IncomeSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            gross_annual=round(self.gross_annual, 2),
            federal_tax=round(self.federal_tax, 2),
            fica_tax=round(self.fica_tax, 2),
            state_tax=round(self.state_tax, 2),
            total_tax=round(self.total_tax, 2),
            net_annual=round(self.net_annual, 2),
            growth_rate=self.growth,
            start_value=round(start_gross, 2),
            end_value=round(start_gross * (1 + self.growth), 2),
            is_active=is_active,
        )


class SideHustleIncomeSim:

    def __init__(self, src: SideHustleIncome):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.gross_annual = src.gross_income
        self.growth = src.income_growth
        self.net_annual = 0.0
        self.federal_tax = 0.0
        self.fica_tax = 0.0
        self.state_tax = 0.0
        self.total_tax = 0.0

    def calculate_taxes(self, year: int, filing_status: str,
                        state: str | None):
        tax_breakdown = calculate_income_taxes(
            gross_income=self.gross_annual,
            year=year,
            filing_status=filing_status,
            state=state,
        )

        self.net_annual = tax_breakdown.net
        self.federal_tax = tax_breakdown.federal
        self.fica_tax = tax_breakdown.fica
        self.state_tax = tax_breakdown.state
        self.total_tax = tax_breakdown.total

    def monthly_cashflow(self) -> float:
        return self.net_annual / 12

    def gross_monthly(self) -> float:
        return self.gross_annual / 12

    def end_of_year(self):
        self.gross_annual = round(self.gross_annual * (1 + self.growth), 2)

    def snapshot( self, annual_cashflow: float, start_gross: float, is_active: bool, ) -> IncomeSnapshot:
        return IncomeSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            gross_annual=round(self.gross_annual, 2),
            federal_tax=round(self.federal_tax, 2),
            fica_tax=round(self.fica_tax, 2),
            state_tax=round(self.state_tax, 2),
            total_tax=round(self.total_tax, 2),
            net_annual=round(self.net_annual, 2),
            growth_rate=self.growth,
            start_value=round(start_gross, 2),
            end_value=round(start_gross * (1 + self.growth), 2),
            is_active=is_active,
        )


# ─── Expense Simulators ───────────────────────────────────────────────────────


class LivingExpenseSim:

    def __init__(self, src: LivingExpense):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.annual = src.monthly_expense * 12
        self.growth = src.expense_growth

    def monthly_drain(self) -> float:
        return self.annual / 12

    def end_of_year(self):
        if self.growth > 0:
            self.annual = round(self.annual * (1 + self.growth), 2)

    def snapshot(
        self,
        annual_drain: float,
        start: float,
    ) -> ExpenseSnapshot:
        return ExpenseSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            annual_expense=round(self.annual, 2),
            annual_cashflow=round(-annual_drain, 2),
            growth_rate=self.growth,
            start_value=round(start, 2),
            end_value=round(start * (1 + self.growth), 2),
            remaining_balance=None,
        )


class RentExpenseSim:

    def __init__(self, src: RentExpense):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.annual = src.monthly_expense * 12
        self.growth = src.rent_growth

    def monthly_drain(self) -> float:
        return self.annual / 12

    def end_of_year(self):
        if self.growth > 0:
            self.annual = round(self.annual * (1 + self.growth), 2)

    def snapshot(
        self,
        annual_drain: float,
        start: float,
    ) -> ExpenseSnapshot:
        return ExpenseSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            annual_expense=round(self.annual, 2),
            annual_cashflow=round(-annual_drain, 2),
            growth_rate=self.growth,
            start_value=round(start, 2),
            end_value=round(start * (1 + self.growth), 2),
            remaining_balance=None,
        )


class DebtExpenseSim:

    def __init__(self, src: DebtExpense):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.annual = src.monthly_expense * 12
        self.growth = 0
        self.debt_amount = src.debt_amount
        self.interest_rate = src.interest_rate or 0

    def monthly_drain(self) -> float:
        return self.annual / 12

    def end_of_year(self):
        pass

    def snapshot(
        self,
        annual_drain: float,
        start: float,
    ) -> ExpenseSnapshot:
        return ExpenseSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            annual_expense=round(self.annual, 2),
            annual_cashflow=round(-annual_drain, 2),
            growth_rate=self.growth,
            start_value=round(start, 2),
            end_value=round(start, 2),
            remaining_balance=None,
        )


class HouseLoanExpenseSim:

    def __init__(self, src: HouseLoanExpense):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.annual = src.monthly_expense * 12
        self.growth = 0
        self.original_principal = src.original_principal
        self.interest_rate = src.interest_rate
        self.loan_term_years = src.loan_term_years
        self.months_elapsed = 0

    def monthly_drain(self) -> float:
        return self.annual / 12

    def end_of_year(self):
        self.months_elapsed += 12

    def snapshot( self, annual_drain: float, start: float, ) -> ExpenseSnapshot:
        remaining_balance = calculate_loan_balance(
            self.original_principal,
            self.interest_rate,
            self.loan_term_years * 12,
            self.months_elapsed,
        )

        return ExpenseSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            annual_expense=round(self.annual, 2),
            annual_cashflow=round(-annual_drain, 2),
            growth_rate=self.growth,
            start_value=round(start, 2),
            end_value=round(start, 2),
            remaining_balance=round(remaining_balance, 2),
        )


class CarLoanExpenseSim:

    def __init__(self, src: CarLoanExpense):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.annual = src.monthly_expense * 12
        self.growth = 0
        self.original_principal = src.original_principal
        self.interest_rate = src.interest_rate
        self.loan_term_years = src.loan_term_years
        self.months_elapsed = 0

    def monthly_drain(self) -> float:
        return self.annual / 12

    def end_of_year(self):
        self.months_elapsed += 12

    def snapshot(
        self,
        annual_drain: float,
        start: float,
    ) -> ExpenseSnapshot:
        remaining_balance = calculate_loan_balance(
            self.original_principal,
            self.interest_rate,
            self.loan_term_years * 12,
            self.months_elapsed,
        )

        return ExpenseSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            annual_expense=round(self.annual, 2),
            annual_cashflow=round(-annual_drain, 2),
            growth_rate=self.growth,
            start_value=round(start, 2),
            end_value=round(start, 2),
            remaining_balance=round(remaining_balance, 2),
        )


# ─── Asset Simulators ─────────────────────────────────────────────────────────


class HouseAssetSim:

    def __init__(self, src: HouseAsset):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.value = src.asset_value
        self.rate = src.annual_appreciation

    def monthly_cashflow(self) -> float:
        return 0.0

    def asset_value(self) -> float:
        return self.value

    def sale_proceeds(self) -> float:
        return self.value

    def end_of_year(self):
        self.value = round(self.value * (1 + self.rate), 2)
        self.value = max(0, self.value)

    def snapshot(
        self,
        annual_cashflow: float,
        sale_proceeds: float | None = None,
    ) -> AssetSnapshot:
        return AssetSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            current_value=round(self.value, 2),
            annual_appreciation_rate=self.rate,
            annual_cashflow=round(annual_cashflow, 2),
            was_sold=sale_proceeds is not None,
            sale_proceeds=round(sale_proceeds, 2)
            if sale_proceeds is not None else None,
        )


class CarAssetSim:

    def __init__(self, src: CarAsset):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age if src.end_age is not None else 999
        self.value = src.asset_value
        self.rate = -src.annual_depreciation

    def monthly_cashflow(self) -> float:
        return 0.0

    def asset_value(self) -> float:
        return self.value

    def sale_proceeds(self) -> float:
        return self.value

    def end_of_year(self):
        self.value = round(self.value * (1 + self.rate), 2)
        self.value = max(0, self.value)

    def snapshot(
        self,
        annual_cashflow: float,
        sale_proceeds: float | None = None,
    ) -> AssetSnapshot:
        return AssetSnapshot(
            id=self.id,
            name=self.name,
            variant=self.variant,
            current_value=round(self.value, 2),
            annual_appreciation_rate=self.rate,
            annual_cashflow=round(annual_cashflow, 2), 
            was_sold=sale_proceeds is not None,
            sale_proceeds=round(sale_proceeds, 2) if sale_proceeds is not None else None,
        )


# ─── Main Simulation ──────────────────────────────────────────────────────────

def simulate(req: SimulateRequest) -> SimulationResult:
    periods_per_year = 12
    results: List[SimYearResult] = []

    all_liquid = []
    for variant, accounts in req.accounts:
        for acc in accounts:
            if variant == "checking":
                all_liquid.append(CheckingAccountSim(acc))
            elif variant == "taxable_investments":
                all_liquid.append(
                    TaxableInvestmentAccountSim(acc))
            elif variant == "employer_retirement":
                all_liquid.append(
                    EmployerRetirementAccountSim(acc))

    all_incomes = []
    for variant, incomes in req.incomes:
        for inc in incomes:
            if variant == "salary":
                all_incomes.append(SalaryIncomeSim(inc))
            elif variant == "hourly":
                all_incomes.append(HourlyWageIncomeSim(inc))
            elif variant == "side":
                all_incomes.append(SideHustleIncomeSim(inc))

    all_expenses = []
    for variant, expenses in req.expenses:
        for exp in expenses:
            if variant == "living":
                all_expenses.append(LivingExpenseSim(exp))
            elif variant == "rent":
                all_expenses.append(RentExpenseSim(exp))
            elif variant == "debt":
                all_expenses.append(DebtExpenseSim(exp))
            elif variant == "house_loan":
                all_expenses.append(HouseLoanExpenseSim(exp))
            elif variant == "car_loan":
                all_expenses.append(CarLoanExpenseSim(exp))

    all_assets = []
    for variant, assets in req.assets:
        for ast in assets:
            if variant == "house":
                all_assets.append(HouseAssetSim(ast))
            elif variant == "car":
                all_assets.append(CarAssetSim(ast))

    cash_sink = None
    for lsim in all_liquid:
        if lsim.variant == "checking":
            cash_sink = lsim
            break

    if cash_sink is None:
        raise ValueError("No checking account found as cash sink")

    starting_net_worth = sum(lsim.balance() for lsim in all_liquid) + sum(
        asim.asset_value() for asim in all_assets) # subtract libilities 

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    for year_offset in range(req.user_end_age - req.user_start_age + 1):
        current_age = req.user_start_age + year_offset
        calendar_year = req.start_year + year_offset

        # Filter active entities
        liquid_active = [
            lsim for lsim in all_liquid
            if lsim.start_age <= current_age <= lsim.end_age
        ]
        income_active = [
            sim for sim in all_incomes
            if sim.start_age <= current_age <= sim.end_age
        ]
        expense_active = [
            sim for sim in all_expenses
            if sim.start_age <= current_age <= sim.end_age
        ]
        asset_active = [
            sim for sim in all_assets
            if sim.start_age <= current_age <= sim.end_age
        ]

        # ── TAX CALCULATION ───────────────────────────────────────────────────

        # Remove 401k and deductions from gross income then take the tax 
        for sim in income_active:
            sim.calculate_taxes(calendar_year, req.filing_status, req.state)

        # ── TRACK CASHFLOWS ───────────────────────────────────────────────────
        income_cf = {}
        income_start = {}
        expense_cf = {}
        expense_start = {}
        asset_cf = {}

        total_federal = 0.0
        total_fica = 0.0
        total_state = 0.0
        total_taxes = 0.0

        for sim in income_active:
            income_cf[sim.id] = sim.net_annual
            income_start[sim.id] = sim.gross_annual
            total_federal += sim.federal_tax
            total_fica += sim.fica_tax
            total_state += sim.state_tax
            total_taxes += sim.total_tax

        for sim in expense_active:
            expense_cf[sim.id] = -sim.annual
            expense_start[sim.id] = sim.annual

        for sim in asset_active:
            asset_cf[sim.id] = sim.monthly_cashflow() * 12

        # ── MONTHLY SIMULATION ────────────────────────────────────────────────
        for month in range(periods_per_year):
            for sim in income_active:
                cash_sink.deposit(sim.monthly_cashflow())

            for sim in expense_active:
                cash_sink.withdraw(sim.monthly_drain())

            for lsim in liquid_active:
                if isinstance( lsim, ( TaxableInvestmentAccountSim, EmployerRetirementAccountSim, ), ):
                    contrib = 0.0

                    linked_income = None

                    if lsim.linked_income_id:
                        linked_income = next( (s for s in income_active if s.id == lsim.linked_income_id), None, )

                    elif isinstance( lsim, EmployerRetirementAccountSim, ):
                        linked_income = next( (s for s in income_active if getattr( s, "linked_401k_id", None, ) == lsim.id), None, )

                    if lsim.contribution_mode == "dollar":
                        contrib = lsim.monthly_contribution

                    elif (lsim.contribution_mode == "percentage" and linked_income):
                        gross_monthly = (linked_income.gross_monthly())
                        
                        print("TEST:", gross_monthly)
                        contrib = (gross_monthly * (lsim.contribution_percentage or 0))

                    # Employer match
                    if isinstance( lsim, EmployerRetirementAccountSim,):
                        contrib += (contrib * lsim.employer_match)

                    cash_sink.withdraw(contrib)
                    lsim.deposit(contrib)

            # Interest and dividends
            for lsim in liquid_active:
                lsim.apply_interest(periods_per_year)
                dividend_cashout = lsim.apply_dividends(periods_per_year)
                if dividend_cashout > 0:
                    cash_sink.deposit(dividend_cashout)

        # ── YEAR END ──────────────────────────────────────────────────────────
        for sim in income_active:
            sim.end_of_year()
        for sim in expense_active:
            sim.end_of_year()
        for sim in asset_active:
            sim.end_of_year()

        # ── ASSET SALES ───────────────────────────────────────────────────────
        assets_sold = set()
        for sim in asset_active:
            if sim.end_age == current_age:
                proceeds = sim.sale_proceeds()
                cash_sink.deposit(proceeds)
                assets_sold.add(sim.id)

        # ── BUILD SNAPSHOTS ───────────────────────────────────────────────────
        account_snapshots = [
            lsim.snapshot(lsim.flush_interest(),  0.05)  # TODO: compute actual growth
            for lsim in liquid_active
        ]

        income_snapshots = [
            sim.snapshot(income_cf[sim.id], income_start[sim.id], True)
            for sim in income_active
        ]

        expense_snapshots = [
            sim.snapshot(expense_cf[sim.id], expense_start[sim.id])
            for sim in expense_active
        ]

        asset_snapshots = [
            sim.snapshot( asset_cf[sim.id], sale_proceeds=sim.sale_proceeds() if sim.id in assets_sold else None, ) 
            for sim in asset_active
        ]

        
        total_cash = sum(lsim.balance() for lsim in liquid_active)
        total_assets = sum(sim.asset_value() for sim in asset_active if sim.id not in assets_sold)

        net_worth = total_cash + total_assets # subtract liabilities if we add them in the future

        total_gross_income = sum(s.gross_annual for s in income_active)

        if results:
            net_worth_change = net_worth - results[-1].net_worth
            net_worth_change_percent = ((net_worth_change / results[-1].net_worth * 100) if results[-1].net_worth != 0 else 0)
        else:
            net_worth_change = net_worth - starting_net_worth
            net_worth_change_percent = ((net_worth_change / starting_net_worth * 100) if starting_net_worth != 0 else 0)

        effective_tax_rate = ((total_taxes / total_gross_income * 100) if total_gross_income > 0 else 0)

        accounts_summary = LiquidAccountsSummary(
            total_balance=total_cash,
            total_interest_earned=sum(s.annual_interest_earned for s in account_snapshots),
            by_variant={
                "checking":
                sum(s.balance for s in account_snapshots if s.variant == "checking"),
                "taxable_investments":
                sum(s.balance for s in account_snapshots if s.variant == "taxable_investments"),
                "employer_retirement":
                sum(s.balance for s in account_snapshots if s.variant == "employer_retirement"),
            },
            accounts=account_snapshots,
        )

        incomes_summary = IncomesSummary(
            total_annual_income=total_gross_income,
            total_cashflow=sum(s.net_annual for s in income_snapshots),
            active_sources=len(income_active),
            by_variant={
                "salary":
                sum(s.gross_annual for s in income_snapshots if s.variant == "salary"),
                "hourly":
                sum(s.gross_annual for s in income_snapshots if s.variant == "hourly"),
                "side":
                sum(s.gross_annual for s in income_snapshots if s.variant == "side"),
            },
            incomes=income_snapshots,
        )

        expenses_summary = ExpensesSummary(
            total_annual_expenses=sum(
                abs(s.annual_cashflow) for s in expense_snapshots),
            total_cashflow=sum(s.annual_cashflow for s in expense_snapshots),
            by_variant={
                "living":
                sum(s.annual_cashflow for s in expense_snapshots if s.variant == "living"),
                "rent":
                sum(s.annual_cashflow for s in expense_snapshots if s.variant == "rent"),
                "debt":
                sum(s.annual_cashflow for s in expense_snapshots if s.variant == "debt"),
                "house_loan":
                sum(s.annual_cashflow for s in expense_snapshots if s.variant == "house_loan"),
                "car_loan":
                sum(s.annual_cashflow for s in expense_snapshots if s.variant == "car_loan"),
            },
            expenses=expense_snapshots,
        )

        assets_summary = AssetsSummary(
            total_asset_value=total_assets,
            total_appreciation_rate=sum(s.annual_appreciation_rate for s in asset_snapshots) / len(asset_snapshots) if asset_snapshots else 0,
            liquidated_count=len(assets_sold),
            assets=asset_snapshots,
        )

        year_result = SimYearResult(
            year=calendar_year,
            age=current_age,
            net_worth=round(net_worth, 2),
            net_worth_change=round(net_worth_change, 2),
            net_worth_change_percent=round(net_worth_change_percent, 2),
            total_cash=round(total_cash, 2),
            total_assets=round(total_assets, 2),
            total_income=round(total_gross_income, 2),
            total_expenses=round(sum(expense_cf.values()), 2),
            net_cashflow=round( sum(income_cf.values()) - sum(expense_cf.values()), 2),
            total_taxes_paid=round(total_taxes, 2),
            total_federal_tax=round(total_federal, 2),
            total_fica_tax=round(total_fica, 2),
            total_state_tax=round(total_state, 2),
            effective_tax_rate=round(effective_tax_rate, 2),
            accounts_summary=accounts_summary,
            incomes_summary=incomes_summary,
            expenses_summary=expenses_summary,
            assets_summary=assets_summary,
        )

        results.append(year_result)

    metrics = SimulationMetrics(
        total_years=len(results),
        starting_net_worth=round(starting_net_worth, 2),
        ending_net_worth=round(results[-1].net_worth if results else 0, 2),
        peak_net_worth=round( max(r.net_worth for r in results) if results else 0, 2),
        peak_net_worth_age=results[max(range(len(results)), key=lambda i: results[i].net_worth)].age if results else 0,
        total_income_lifetime=round(sum(r.total_income for r in results), 2),
        total_expenses_lifetime=round(sum(r.total_expenses for r in results), 2),
        net_lifetime_cashflow=round(sum(r.net_cashflow for r in results), 2),
        years_with_negative_cashflow=sum(1 for r in results if r.net_cashflow < 0),
        lowest_cash_balance_year=results[min( range(len(results)), key=lambda i: results[i].total_cash)].year if results else 0,
        lowest_cash_balance=round( min(r.total_cash for r in results) if results else 0, 2),
    )
    
    net_worth_trend = [r.net_worth for r in results]
    cash_trend = [r.total_cash for r in results]
    assets_trend = [r.total_assets for r in results]
    annual_income_trend = [r.total_income for r in results]
    annual_expenses_trend = [r.total_expenses for r in results]

    return SimulationResult(
        request=req,
        metrics=metrics,
        years=results,
        net_worth_trend=net_worth_trend,
        cash_trend=cash_trend,
        assets_trend=assets_trend,
        annual_income_trend=annual_income_trend,
        annual_expenses_trend=annual_expenses_trend,
    )
