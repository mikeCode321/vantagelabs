from typing import Dict, List, Union
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
from services.tax import TaxService
import json
# ─── Tiered Interest ──────────────────────────────────────────────────────────


class InterestCalculator:

    def __init__(self, tiers: List[Tier]):
        # TODO: should validate tiers tiers are sorted ascending, thresholds are unique, rates are valid
        self.tiers = tiers

    def calculate_interest(self, balance, periods_per_year):
        if balance <= 0 or not self.tiers:
            return 0.0

        remaining = balance
        interest = 0.0
        prev_threshold = 0.0
        last_rate = 0.0

        for tier in self.tiers:
            tier_size = tier.threshold - prev_threshold
            amount_in_tier = min(remaining, tier_size)

            period_rate = tier.annual_rate / periods_per_year

            interest += amount_in_tier * period_rate

            remaining -= amount_in_tier
            prev_threshold = tier.threshold
            last_rate = tier.annual_rate

            if remaining <= 0:
                return interest

        if remaining > 0:
            period_rate = last_rate / periods_per_year
            interest += remaining * period_rate

        return interest

    @staticmethod
    def calculate_basic_interest(balance, expected_return, periods_per_year):
        period_return = expected_return / periods_per_year
        return balance * period_return


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

    def __init__(self, checking_account: CheckingAccount):
        self.source_type = checking_account.source_type
        self.variant = checking_account.variant
        self.id = checking_account.id
        self.name = checking_account.name
        self.start_age = checking_account.start_age
        self.end_age = checking_account.end_age
        self.balance = checking_account.starting_balance
        self.tiers = checking_account.interest_tiers

        self.total_interest_earned = 0.0
        self.monthly_balance_history = []
        self.monthly_interest_earned_history = []
        self.interest_calculator = InterestCalculator(self.tiers)

    def deposit(self, amount: float):
        self.balance += amount

    def withdraw(self, amount: float):
        self.balance -= amount

    def calculate_interest(self):
        return round(self.interest_calculator.calculate_interest(self.balance,  periods_per_year=12),2)

    def end_of_month(self):
        interest = self.calculate_interest()
        self.balance += interest

        self.total_interest_earned += interest
        self.monthly_interest_earned_history.append(round(interest, 2))
        self.monthly_balance_history.append(round(self.balance, 2))

    def snapshot(self):
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "balance": round(self.balance, 2),
            "annual_interest_earned": round(self.total_interest_earned, 2),
            "balance_history": self.monthly_balance_history,
            "interest_history": self.monthly_interest_earned_history
        }
        # return AccountSnapshot( )


# class TaxableInvestmentAccountSim:

#     def __init__(self, src: TaxableInvestmentAccount):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age
#         self.balance_amount = src.starting_balance
#         self.expected_return = src.expected_return
#         self.dividend_yield = src.dividend_yield
#         self.dividend_reinvestment = src.dividend_reinvestment
#         self.contribution_mode = src.contribution_mode
#         self.monthly_contribution = src.monthly_contribution
#         self.contribution_percentage = src.contribution_percentage
#         self.linked_income_id = src.linked_income_id
#         self.interest_earned = 0.0
#         self.dividends_earned = 0.0

#     def deposit(self, amount: float):
#         self.balance_amount += amount

#     def withdraw(self, amount: float):
#         self.balance_amount = max(0, self.balance_amount - amount)

#     def apply_interest(self, periods_per_year: int):
#         """Apply expected return"""
#         period_return = self.expected_return / periods_per_year
#         gains = self.balance_amount * period_return
#         self.balance_amount += gains
#         self.interest_earned += gains

#     def apply_dividends(self, periods_per_year: int):
#         """Apply dividend yield"""
#         period_dividend = (self.balance_amount * self.dividend_yield) / periods_per_year
#         self.dividends_earned += period_dividend

#         if self.dividend_reinvestment == "drip":
#             self.balance_amount += period_dividend
#             return 0.0
#         else:
#             return period_dividend

#     def balance(self) -> float:
#         return self.balance_amount

#     def flush_interest(self) -> float:
#         earned = self.interest_earned
#         self.interest_earned = 0.0
#         return earned

#     def snapshot(self, annual_interest: float, growth_rate: float) -> AccountSnapshot:
#         return AccountSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             balance=round(self.balance_amount, 2),
#             annual_interest_earned=round(annual_interest, 2),
#             growth_rate=growth_rate,
#         )

class EmployerRetirementAccountSim:

    def __init__(self, src: EmployerRetirementAccount):
        self.periods_per_year = 12

        # identity
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age

        # state
        self.balance = src.starting_balance

        # contribution settings
        self.contribution_mode = src.contribution_mode
        self.employee_monthly_contribution = src.monthly_contribution
        self.contribution_percentage = src.contribution_percentage
        self.employer_match = src.employer_match
        self.employer_monthly_contribution = self.calculate_employer_contribution(self.employee_monthly_contribution)
        self.linked_income_id = src.linked_income_id

        # returns
        self.expected_return = src.expected_return
        self.dividend_yield = src.dividend_yield
        self.dividend_reinvestment = src.dividend_reinvestment

        # tracking
        self.total_employee_contributions = 0.0
        self.total_employer_contributions = 0.0
        self.total_interest_earned = 0.0
        self.total_dividends_earned = 0.0

        self.monthly_balance_history = []
        self.monthly_interest_earned_history = []

        self.job_obj = None

    def link_job(self, job):
        self.job_obj = job

    def calculate_employer_contribution(self, employee_amount) -> float:
        return employee_amount * self.employer_match

    def calculate_interest(self):
        return InterestCalculator.calculate_basic_interest(self.balance, self.expected_return, self.periods_per_year)

    def contribute(self, amount):
        self.balance += amount

    def withdraw(self, amount: float):
        self.balance = max(0, self.balance - amount)
        
    def end_of_month(self):
        self.balance += self.employee_monthly_contribution + self.employer_monthly_contribution
        interest_earned = self.calculate_interest()
        self.balance += interest_earned

        self.total_employee_contributions += self.employee_monthly_contribution
        self.total_employer_contributions += self.employer_monthly_contribution
        self.total_interest_earned += interest_earned
        # self.total_dividends_earned = 0.0

        self.monthly_balance_history.append(self.balance)
        self.monthly_interest_earned_history.append(interest_earned)

    def advance_year(self, gross_income):
        self.flush()  

        if self.job_obj:
            gross_income = self.job_obj.gross_income

        if self.contribution_mode == "percentage":
            self.employee_monthly_contribution = (gross_income * self.contribution_percentage) / 12
            self.employer_monthly_contribution = self.calculate_employer_contribution(self.employee_monthly_contribution)
    
    def flush(self):
        self.total_employee_contributions = 0.0
        self.total_employer_contributions = 0.0
        self.total_interest_earned = 0.0
        self.monthly_balance_history = []
        self.monthly_interest_earned_history = []
        
    def snapshot(self):
         return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "balance": round(self.balance, 2),
            "growth_rate": self.expected_return,
            "employee_monthly_contribution": round(self.employee_monthly_contribution, 2),
            "employer_monthly_contribution": round(self.employer_monthly_contribution, 2),
            "total_employee_contributions" :  round(self.total_employee_contributions, 2),
            "total_employer_contributions" :  round(self.total_employer_contributions, 2),
            "total_interest_earned" :  round(self.total_interest_earned, 2),
            "monthly_balance_history": self.monthly_balance_history,
            "monthly_interest_history": self.monthly_interest_earned_history
         }
         
        # return AccountSnapshot(  )

# # ─── Income Simulators ────────────────────────────────────────────────────────
# calc from 2026 - 2028
# 2026-2027 , 2027-2028
# snapshot always reflects start of next year values
class SalaryIncomeSim:

    def __init__(self, src: SalaryIncome, filing_status, state):
        self.id = src.id
        self.name = src.name
        self.variant = src.variant
        self.start_age = src.start_age
        self.end_age = src.end_age
        self.current_gross_income = src.gross_income
        self.growth = src.income_growth
        self.linked_401k_id = src.linked_401k_id

        self.current_federal_tax = 0.0
        self.current_fica_tax = 0.0
        self.current_state_tax = 0.0
        self.current_total_tax = 0.0
        self.current_net_income = 0.0

        # next year values
        self.projected_gross_income = 0.0
        self.projected_federal_tax = 0.0
        self.projected_fica_tax = 0.0
        self.projected_state_tax = 0.0
        self.projected_total_tax = 0.0
        self.projected_net_income = 0.0

        self.deductions = 0.0

        self.tax_service = TaxService(filing_status, state)
        self.retirement_account = None

    def link_retirement_account(self, retirement_account):
        self.retirement_account = retirement_account

    def calculate_taxes(self):
        tax_breakdown = self.tax_service.calculate_income_taxes(self.current_gross_income, self.deductions)

        self.current_federal_tax = tax_breakdown.federal
        self.current_fica_tax = tax_breakdown.fica
        self.current_state_tax = tax_breakdown.state
        self.current_total_tax = tax_breakdown.total

    def calculate_deductions(self):
        self.deductions += (self.retirement_account.employee_monthly_contribution * 12)

    def calculate_net_income(self):
        self.calculate_deductions()
        self.calculate_taxes()
        self.current_net_income = round(self.current_gross_income - self.current_total_tax - self.deductions, 2)

    def project_next_year(self):
        projected_gross_income = round(self.current_gross_income * (1 + self.growth), 2)

        tax_breakdown = self.tax_service.calculate_income_taxes(projected_gross_income)

        self.projected_gross_income = projected_gross_income
        self.projected_federal_tax = tax_breakdown.federal
        self.projected_fica_tax = tax_breakdown.fica
        self.projected_state_tax = tax_breakdown.state
        self.projected_total_tax = tax_breakdown.total
        self.projected_net_income = (projected_gross_income - tax_breakdown.total)

    def advance_year(self):
        self.current_gross_income = self.projected_gross_income
        self.current_federal_tax = self.projected_federal_tax
        self.current_fica_tax = self.projected_fica_tax
        self.current_state_tax = self.projected_state_tax
        self.current_total_tax = self.projected_total_tax
        self.current_net_income = self.projected_net_income

    def monthly_net_income(self):
        return round(self.current_net_income / 12, 2)

    def snapshot(self, is_active):
        return {
            "id": self.id,
            "name": self.name,
            "completed_year": {
                "gross_income": round(self.current_gross_income, 2),
                "net_income": round(self.current_net_income, 2),
                "total_tax": round(self.current_total_tax, 2),
                "federal_tax": round(self.current_federal_tax, 2),
                "fica_tax": round(self.current_fica_tax, 2),
                "state_tax": round(self.current_state_tax, 2),
            },
            "current_year": {
                "gross_income": round(self.projected_gross_income, 2),
                "net_income": round(self.projected_net_income, 2),
                "total_tax": round(self.projected_total_tax, 2),
                "federal_tax": round(self.projected_federal_tax, 2),
                "fica_tax": round(self.projected_fica_tax, 2),
                "state_tax": round(self.projected_state_tax, 2),
            },
            "growth_rate": self.growth,
            "is_active": is_active,
        }

        # return IncomeSnapshot()


# class HourlyWageIncomeSim:

#     def __init__(self, src: HourlyWageIncome):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age
#         self.gross_annual = src.gross_income
#         self.growth = src.income_growth
#         self.hourly_rate = src.hourly_rate
#         self.hours_per_week = src.hours_per_week
#         self.net_annual = 0.0
#         self.federal_tax = 0.0
#         self.fica_tax = 0.0
#         self.state_tax = 0.0
#         self.total_tax = 0.0

#     def calculate_taxes(self, year: int, filing_status: str, state: str | None):
#         tax_breakdown = calculate_income_taxes(
#             gross_income=self.gross_annual,
#             year=year,
#             filing_status=filing_status,
#             state=state,
#         )

#         self.net_annual = tax_breakdown.net
#         self.federal_tax = tax_breakdown.federal
#         self.fica_tax = tax_breakdown.fica
#         self.state_tax = tax_breakdown.state
#         self.total_tax = tax_breakdown.total

#     def monthly_cashflow(self) -> float:
#         return self.net_annual / 12

#     def gross_monthly(self) -> float:
#         return self.gross_annual / 12

#     def end_of_year(self):
#         self.gross_annual = round(self.gross_annual * (1 + self.growth), 2)

#     def snapshot( self, annual_cashflow: float, start_gross: float, is_active: bool, ) -> IncomeSnapshot:
#         return IncomeSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             gross_annual=round(self.gross_annual, 2),
#             federal_tax=round(self.federal_tax, 2),
#             fica_tax=round(self.fica_tax, 2),
#             state_tax=round(self.state_tax, 2),
#             total_tax=round(self.total_tax, 2),
#             net_annual=round(self.net_annual, 2),
#             growth_rate=self.growth,
#             start_value=round(start_gross, 2),
#             end_value=round(start_gross * (1 + self.growth), 2),
#             is_active=is_active,
#         )

# class SideHustleIncomeSim:

#     def __init__(self, src: SideHustleIncome):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age
#         self.gross_annual = src.gross_income
#         self.growth = src.income_growth
#         self.net_annual = 0.0
#         self.federal_tax = 0.0
#         self.fica_tax = 0.0
#         self.state_tax = 0.0
#         self.total_tax = 0.0

#     def calculate_taxes(self, year: int, filing_status: str,
#                         state: str | None):
#         tax_breakdown = calculate_income_taxes(
#             gross_income=self.gross_annual,
#             year=year,
#             filing_status=filing_status,
#             state=state,
#         )

#         self.net_annual = tax_breakdown.net
#         self.federal_tax = tax_breakdown.federal
#         self.fica_tax = tax_breakdown.fica
#         self.state_tax = tax_breakdown.state
#         self.total_tax = tax_breakdown.total

#     def monthly_cashflow(self) -> float:
#         return self.net_annual / 12

#     def gross_monthly(self) -> float:
#         return self.gross_annual / 12

#     def end_of_year(self):
#         self.gross_annual = round(self.gross_annual * (1 + self.growth), 2)

#     def snapshot( self, annual_cashflow: float, start_gross: float, is_active: bool, ) -> IncomeSnapshot:
#         return IncomeSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             gross_annual=round(self.gross_annual, 2),
#             federal_tax=round(self.federal_tax, 2),
#             fica_tax=round(self.fica_tax, 2),
#             state_tax=round(self.state_tax, 2),
#             total_tax=round(self.total_tax, 2),
#             net_annual=round(self.net_annual, 2),
#             growth_rate=self.growth,
#             start_value=round(start_gross, 2),
#             end_value=round(start_gross * (1 + self.growth), 2),
#             is_active=is_active,
#         )

# # ─── Expense Simulators ───────────────────────────────────────────────────────

# class LivingExpenseSim:

#     def __init__(self, src: LivingExpense):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.annual = src.monthly_expense * 12
#         self.growth = src.expense_growth

#     def monthly_drain(self) -> float:
#         return self.annual / 12

#     def end_of_year(self):
#         if self.growth > 0:
#             self.annual = round(self.annual * (1 + self.growth), 2)

#     def snapshot(
#         self,
#         annual_drain: float,
#         start: float,
#     ) -> ExpenseSnapshot:
#         return ExpenseSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             annual_expense=round(self.annual, 2),
#             annual_cashflow=round(-annual_drain, 2),
#             growth_rate=self.growth,
#             start_value=round(start, 2),
#             end_value=round(start * (1 + self.growth), 2),
#             remaining_balance=None,
#         )

# class RentExpenseSim:

#     def __init__(self, src: RentExpense):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.annual = src.monthly_expense * 12
#         self.growth = src.rent_growth

#     def monthly_drain(self) -> float:
#         return self.annual / 12

#     def end_of_year(self):
#         if self.growth > 0:
#             self.annual = round(self.annual * (1 + self.growth), 2)

#     def snapshot(
#         self,
#         annual_drain: float,
#         start: float,
#     ) -> ExpenseSnapshot:
#         return ExpenseSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             annual_expense=round(self.annual, 2),
#             annual_cashflow=round(-annual_drain, 2),
#             growth_rate=self.growth,
#             start_value=round(start, 2),
#             end_value=round(start * (1 + self.growth), 2),
#             remaining_balance=None,
#         )

# class DebtExpenseSim:

#     def __init__(self, src: DebtExpense):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.annual = src.monthly_expense * 12
#         self.growth = 0
#         self.debt_amount = src.debt_amount
#         self.interest_rate = src.interest_rate or 0

#     def monthly_drain(self) -> float:
#         return self.annual / 12

#     def end_of_year(self):
#         pass

#     def snapshot(
#         self,
#         annual_drain: float,
#         start: float,
#     ) -> ExpenseSnapshot:
#         return ExpenseSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             annual_expense=round(self.annual, 2),
#             annual_cashflow=round(-annual_drain, 2),
#             growth_rate=self.growth,
#             start_value=round(start, 2),
#             end_value=round(start, 2),
#             remaining_balance=None,
#         )

# class HouseLoanExpenseSim:

#     def __init__(self, src: HouseLoanExpense):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.annual = src.monthly_expense * 12
#         self.growth = 0
#         self.original_principal = src.original_principal
#         self.interest_rate = src.interest_rate
#         self.loan_term_years = src.loan_term_years
#         self.months_elapsed = 0

#     def monthly_drain(self) -> float:
#         return self.annual / 12

#     def end_of_year(self):
#         self.months_elapsed += 12

#     def snapshot( self, annual_drain: float, start: float, ) -> ExpenseSnapshot:
#         remaining_balance = calculate_loan_balance(
#             self.original_principal,
#             self.interest_rate,
#             self.loan_term_years * 12,
#             self.months_elapsed,
#         )

#         return ExpenseSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             annual_expense=round(self.annual, 2),
#             annual_cashflow=round(-annual_drain, 2),
#             growth_rate=self.growth,
#             start_value=round(start, 2),
#             end_value=round(start, 2),
#             remaining_balance=round(remaining_balance, 2),
#         )

# class CarLoanExpenseSim:

#     def __init__(self, src: CarLoanExpense):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.annual = src.monthly_expense * 12
#         self.growth = 0
#         self.original_principal = src.original_principal
#         self.interest_rate = src.interest_rate
#         self.loan_term_years = src.loan_term_years
#         self.months_elapsed = 0

#     def monthly_drain(self) -> float:
#         return self.annual / 12

#     def end_of_year(self):
#         self.months_elapsed += 12

#     def snapshot(
#         self,
#         annual_drain: float,
#         start: float,
#     ) -> ExpenseSnapshot:
#         remaining_balance = calculate_loan_balance(
#             self.original_principal,
#             self.interest_rate,
#             self.loan_term_years * 12,
#             self.months_elapsed,
#         )

#         return ExpenseSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             annual_expense=round(self.annual, 2),
#             annual_cashflow=round(-annual_drain, 2),
#             growth_rate=self.growth,
#             start_value=round(start, 2),
#             end_value=round(start, 2),
#             remaining_balance=round(remaining_balance, 2),
#         )

# # ─── Asset Simulators ─────────────────────────────────────────────────────────

# class HouseAssetSim:

#     def __init__(self, src: HouseAsset):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.value = src.asset_value
#         self.rate = src.annual_appreciation

#     def monthly_cashflow(self) -> float:
#         return 0.0

#     def asset_value(self) -> float:
#         return self.value

#     def sale_proceeds(self) -> float:
#         return self.value

#     def end_of_year(self):
#         self.value = round(self.value * (1 + self.rate), 2)
#         self.value = max(0, self.value)

#     def snapshot(
#         self,
#         annual_cashflow: float,
#         sale_proceeds: float | None = None,
#     ) -> AssetSnapshot:
#         return AssetSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             current_value=round(self.value, 2),
#             annual_appreciation_rate=self.rate,
#             annual_cashflow=round(annual_cashflow, 2),
#             was_sold=sale_proceeds is not None,
#             sale_proceeds=round(sale_proceeds, 2)
#             if sale_proceeds is not None else None,
#         )

# class CarAssetSim:

#     def __init__(self, src: CarAsset):
#         self.id = src.id
#         self.name = src.name
#         self.variant = src.variant
#         self.start_age = src.start_age
#         self.end_age = src.end_age if src.end_age is not None else 999
#         self.value = src.asset_value
#         self.rate = -src.annual_depreciation

#     def monthly_cashflow(self) -> float:
#         return 0.0

#     def asset_value(self) -> float:
#         return self.value

#     def sale_proceeds(self) -> float:
#         return self.value

#     def end_of_year(self):
#         self.value = round(self.value * (1 + self.rate), 2)
#         self.value = max(0, self.value)

#     def snapshot(
#         self,
#         annual_cashflow: float,
#         sale_proceeds: float | None = None,
#     ) -> AssetSnapshot:
#         return AssetSnapshot(
#             id=self.id,
#             name=self.name,
#             variant=self.variant,
#             current_value=round(self.value, 2),
#             annual_appreciation_rate=self.rate,
#             annual_cashflow=round(annual_cashflow, 2),
#             was_sold=sale_proceeds is not None,
#             sale_proceeds=round(sale_proceeds, 2) if sale_proceeds is not None else None,
#         )

# # ─── Main Simulation ──────────────────────────────────────────────────────────

def simulate(req: SimulateRequest) -> SimulationResult:
    periods_per_year = 12
    results: List[SimYearResult] = []

    all_liquid = {
        "checking" : [],
        "employer_retirement" : []
    }
    for variant, accounts in req.accounts:
        for acc in accounts:
            if variant == "checking":
                all_liquid[variant].append(CheckingAccountSim(acc))
            elif variant =="employer_retirement":
                all_liquid[variant].append(EmployerRetirementAccountSim(acc))

    all_incomes = {
        "salary" : []
    }
    for variant, incomes in req.incomes:
        for inc in incomes:
            if variant == "salary":
                all_incomes[variant].append(SalaryIncomeSim(inc, "single", "MI"))
                
    default_checking = all_liquid['checking'][0]

    if default_checking is None:
        raise ValueError("No checking account found as cash sink")

    # starting_net_worth = sum(lsim.balance() for lsim in all_liquid) + sum(asim.asset_value() for asim in all_assets) # subtract libilities
    # salary, checking, 401k
    starting_net_worth = (all_liquid['checking'][0].balance + all_liquid['employer_retirement'][0].balance)

    # link 401k to salary/job 
    retirement_acc_eligible_jobs = all_incomes.get("salary", []) + all_incomes.get("hourly", [])
    retirement_accounts = all_liquid['employer_retirement']

    for job in retirement_acc_eligible_jobs:
            income_id = job.id

            for retirement_account in retirement_accounts:
                if income_id == retirement_account.linked_income_id:
                    retirement_account.link_job(job)
                    job.link_retirement_account(retirement_account)

    # for job in retirement_acc_eligible_jobs:
    #     print(job, "id", job.id , "linked to ", job.linked_401k_id, " 401k_acc_obj", job.retirement_account)
    
    # for acc in retirement_accounts:
    #     print(acc, "id", acc.id, "linked to", acc.linked_income_id , " job_obj ", acc.job_obj)

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    for year_offset in range(req.user_end_age - req.user_start_age + 1):
        current_age = req.user_start_age + year_offset
        calendar_year = req.start_year + year_offset

        liquid_active = [
            sim
            for sims in all_liquid.values()
            for sim in sims
            if sim.start_age <= current_age <= sim.end_age
        ]

        income_active = [
            sim
            for sims in all_incomes.values()
            for sim in sims
            if sim.start_age <= current_age <= sim.end_age
        ]
        
        # ── DEDUCT DEDUCTIONS AND TAX CALCULATION ───────────────────────────────────────────────────

        # Remove 401k and deductions from gross income then take the tax

        total_federal = 0.0
        total_fica = 0.0
        total_state = 0.0
        total_taxes = 0.0

        for sim in income_active:
            sim.calculate_net_income()
            total_taxes += sim.current_total_tax
            total_federal += sim.current_federal_tax
            total_fica += sim.current_fica_tax
            total_state += sim.current_state_tax
            print(sim.name, "$"+ str(sim.current_net_income))

        # ── TRACK CASHFLOWS ───────────────────────────────────────────────────
        income_cf = {}

        for sim in income_active:
            income_cf[sim.id] = sim.current_net_income
            
        # ── MONTHLY SIMULATION ────────────────────────────────────────────────
        for month in range(periods_per_year):

            # 401k contribution

            # income goes into checking account 
            for sim in income_active:
                default_checking.deposit(sim.monthly_cashflow())

            # pay expenses 
            # for sim in expense_active:
            #     default_checking.withdraw(sim.monthly_drain())

            # maybe assets and investments (cashflow, withdraws, sell etc..) can come next (future implementation)

            # Interest and dividends
            for lsim in liquid_active:
                lsim.apply_interest(periods_per_year)
                dividend_cashout = lsim.apply_dividends(periods_per_year)
                if dividend_cashout > 0:
                    default_checking.deposit(dividend_cashout)

        # ── YEAR END ──────────────────────────────────────────────────────────
        for sim in income_active:
            sim.end_of_year()

        # ── ASSET SALES ───────────────────────────────────────────────────────
        # assets_sold = set()
        # for sim in asset_active:
        #     if sim.end_age == current_age:
        #         proceeds = sim.sale_proceeds()
        #         cash_sink.deposit(proceeds)
        #         assets_sold.add(sim.id)

        # ── BUILD SNAPSHOTS ───────────────────────────────────────────────────
        account_snapshots = [
            lsim.snapshot()
            for lsim in liquid_active
        ]

        income_snapshots = [
            sim.snapshot()
            for sim in income_active
        ]

        total_cash = sum(lsim.balance() for lsim in liquid_active)
        # total_assets = sum(sim.asset_value() for sim in asset_active if sim.id not in assets_sold)

        # net_worth = total_cash + total_assets # subtract liabilities if we add them in the future
        net_worth = total_cash
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

        year_result = SimYearResult(
            year=calendar_year,
            age=current_age,
            net_worth=round(net_worth, 2),
            net_worth_change=round(net_worth_change, 2),
            net_worth_change_percent=round(net_worth_change_percent, 2),
            total_cash=round(total_cash, 2),
            # total_assets=round(total_assets, 2),
            total_income=round(total_gross_income, 2),
            # total_expenses=round(sum(expense_cf.values()), 2),
            # net_cashflow=round( sum(income_cf.values()) - sum(expense_cf.values()), 2),
            total_taxes_paid=round(total_taxes, 2),
            total_federal_tax=round(total_federal, 2),
            total_fica_tax=round(total_fica, 2),
            total_state_tax=round(total_state, 2),
            effective_tax_rate=round(effective_tax_rate, 2),
            accounts_summary=accounts_summary,
            incomes_summary=incomes_summary,
            # expenses_summary=expenses_summary,
            # assets_summary=assets_summary,
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


req = {
  "user_start_age": 25,
  "user_end_age": 27,
  "filing_status": "single",
  "state": "MI",
  "accounts": {
    "checking": [
      {
        "source_type": "liquid",
        "variant": "checking",
        "id": "acc_1",
        "name": "Checking Account",
        "start_age": 25,
        "end_age": 27,
        "starting_balance": 10000,
        "interest_tiers": [
          {
            "threshold": 15000,
            "annual_rate": 0.0
          },
          {
            "threshold": 100000,
            "annual_rate": 0.03
          },
          {
            "threshold": 300000,
            "annual_rate": 0.04
          }
        ]
      }
    ],
    "taxable_investments": [],
    "employer_retirement": [
      {
        "source_type": "liquid",
        "variant": "employer_retirement",
        "id": "401k_1",
        "name": "salary 401",
        "start_age": 25,
        "end_age": 27,
        "starting_balance": 0,
        "contribution_mode": "percentage",
        "monthly_contribution": 833.3333333333335,
        "contribution_percentage": 0.10,
        "expected_return": 0.1,
        "employer_match": 0.05,
        "linked_income_id": "salary_1"
      }
    ]
  },
  "incomes": {
    "salary": [
      {
        "id": "salary_1",
        "source_type": "income",
        "variant": "salary",
        "name": "Software Engineer",
        "start_age": 25,
        "end_age": 27,
        "gross_income": 100000,
        "income_growth": 0.03,
        "linked_401k_id": "401k_1",
      }
    ],
    "hourly": [],
    "side": []
  },
  "expenses": {
    "living": [],
    "rent": [],
    "house_loan": [],
    "car_loan": [],
    "debt": []
  },
  "assets": {
    "house": [],
    "car": []
  }
}


simulate(SimulateRequest(**req))

