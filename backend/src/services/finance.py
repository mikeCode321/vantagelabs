from typing import List
from abc import ABC, abstractmethod
from schemas.finance import (
    SimulateRequest,
    Tier,
    CheckingAccount,
    EmployerRetirementAccount,
    SalaryIncome,
)
from services.tax import TaxService
from datetime import datetime 
import json
import numpy as np
# ═══════════════════════════════════════════════════════════════════════════
# PROTOCOLS & INTERFACES
# ═══════════════════════════════════════════════════════════════════════════

class AccountSimulator(ABC):
    """
    Standardized interface for all account types.
    
    All accounts follow the same lifecycle:
    1. deposit() / withdraw() during the month
    2. process_month_end() at month end for compounding
    3. snapshot() for reporting
    """

    @abstractmethod
    def deposit(self, amount: float) -> None:
        """Add money to account"""
        pass

    @abstractmethod
    def withdraw(self, amount: float) -> None:
        """Remove money from account"""
        pass

    @abstractmethod
    def process_month_end(self):
        """
        Calculate and apply monthly interest/growth.
        Returns growth details for tracking.
        """
        pass

    # add end of year abstract method

    @abstractmethod
    def get_balance(self) -> float:
        """Current account balance"""
        pass

    @abstractmethod
    def snapshot(self) -> dict:
        """Return current state for reporting"""
        pass

    @property
    @abstractmethod
    def id(self) -> str:
        pass

    @property
    @abstractmethod
    def variant(self) -> str:
        pass

    def is_active(self, age: int) -> bool:
        """Check if account is active at given age"""
        return self.start_age <= age < self.end_age


# ═══════════════════════════════════════════════════════════════════════════
# INTEREST CALCULATOR
# ═══════════════════════════════════════════════════════════════════════════
class InterestCalculator:
    """Handles tiered and basic interest calculations"""

    def __init__(self, tiers: List[Tier]):
        self.tiers = tiers

    def calculate_tiered_monthly_interest(self, balance: float) -> float:
        """Calculate interest for one month"""
        if balance <= 0 or not self.tiers:
            return 0.0

        remaining = balance
        interest = 0.0
        prev_threshold = 0.0
        last_rate = 0.0

        for tier in self.tiers:
            tier_size = tier["threshold"] - prev_threshold
            amount_in_tier = min(remaining, tier_size)

            monthly_rate = tier["annual_rate"] / 12
            interest += amount_in_tier * monthly_rate

            remaining -= amount_in_tier
            prev_threshold = tier["threshold"]
            last_rate = tier["annual_rate"]

            if remaining <= 0:
                return interest

        # Handle balance above highest tier
        if remaining > 0:
            monthly_rate = last_rate / 12
            interest += remaining * monthly_rate

        return interest

    @staticmethod
    def calculate_simple_monthly_return(balance: float, annual_return: float) -> float:
        """Simple monthly compounding"""
        monthly_rate = annual_return / 12
        return balance * monthly_rate


# ═══════════════════════════════════════════════════════════════════════════
# ACCOUNT SIMULATORS
# ═══════════════════════════════════════════════════════════════════════════
class CheckingAccountSim(AccountSimulator):
    """Checking account with tiered interest"""

    def __init__(self, account: CheckingAccount):
        self._id = account["id"]
        self._variant = account["variant"]
        self.name = account["name"]
        self.start_age = account["start_age"]
        self.end_age = account["end_age"]

        # State
        self.balance = account["starting_balance"]

        # Calculator
        self.interest_calculator = InterestCalculator(account["interest_tiers"])

        # History tracking
        self.total_year_interest_earned = 0.0
        self.monthly_balance_history: List[float] = []
        self.monthly_interest_history: List[float] = []

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def deposit(self, amount: float) -> None:
        self.balance += amount

    def withdraw(self, amount: float) -> None:
        self.balance -= amount

    def process_month_end(self):
        """Apply monthly interest and record history"""
        interest = self.interest_calculator.calculate_tiered_monthly_interest(self.balance)

        self.balance += interest
        self.total_year_interest_earned += interest

        # Record history
        self.monthly_interest_history.append(interest)
        self.monthly_balance_history.append(self.balance)

        return {
            "balance": self.balance,
            "interest_earned": self.total_year_interest_earned,
            "monthly_balance_history": self.monthly_balance_history,
            "monthly_interest_history": self.monthly_interest_history
        }

    def process_year_end(self):
        self.total_year_interest_earned = 0.0
        self.monthly_balance_history = []
        self.monthly_interest_history = []

    def get_balance(self) -> float:
        return self.balance

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "balance": round(self.balance, 2),
            "annual_interest_earned": round(self.total_year_interest_earned, 2),
            "balance_history": self.monthly_balance_history,
            "interest_history": self.monthly_interest_history,
        }

class EmployerRetirementAccountSim(AccountSimulator):
    """401k/403b with employer match and investment returns"""

    def __init__(self, account: EmployerRetirementAccount):
        self._id = account["id"]
        self._variant = account["variant"]
        self.name = account["name"]
        self.start_age = account["start_age"]
        self.end_age = account["end_age"]

        # State
        self.balance = account["starting_balance"]

        # Configuration
        self.expected_return = account["expected_return"]
        self.employer_match_rate = account["employer_match_rate"] # ex: 0.50
        self.employer_match_limit = account["employer_match_limit"] # ex: 0.10 so match 50% up to 10% of gross income 
        
        self.contribution_mode = account["contribution_mode"]
        self.contribution_percentage = account["contribution_percentage"]
        self.monthly_contribution_fixed = account["monthly_contribution"]
        self.linked_income_id = account["linked_income_id"]

        # Tracking
        self.total_yearly_interest_earned = 0.0
        self.total_yearly_employee_contributions = 0.0
        self.total_yearly_employer_contributions = 0.0
        self.monthly_balance_history: List[float] = []
        self.monthly_interest_history: List[float] = []

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def calculate_employee_contribution(self, gross_income: float) -> float:
        if self.contribution_mode == "percentage":
            return gross_income * self.contribution_percentage
        else:
            return self.monthly_contribution_fixed

    def deposit(self, amount: float):
        self.balance += amount

    def contribute_employee(self, amount: float):
        self.deposit(amount)
        self.total_yearly_employee_contributions += amount

    def contribute_employer(self, employee_amount, monthly_gross):
        match_cap = monthly_gross * self.employer_match_limit
        matched_contribution = min(employee_amount, match_cap)
        match_amount = matched_contribution * self.employer_match_rate
        self.deposit(match_amount)
        self.total_yearly_employer_contributions += match_amount

    def withdraw(self, amount: float):
        self.balance = max(0, self.balance - amount)

    def process_month_end(self):
        interest = InterestCalculator.calculate_simple_monthly_return(self.balance, self.expected_return)

        self.balance += interest
        self.total_yearly_interest_earned += interest

        # Record history
        self.monthly_interest_history.append(interest)
        self.monthly_balance_history.append(self.balance)

        return {
            "balance": round(self.balance, 2),
            "interest_earned": round(self.total_yearly_interest_earned, 2),
            "monthly_balance_history": self.monthly_balance_history,
            "monthly_interest_history": self.monthly_interest_history,
        }
    
    def process_year_end(self):
        self.total_yearly_interest_earned = 0.0
        self.total_yearly_employee_contributions = 0.0
        self.total_yearly_employer_contributions = 0.0
        self.monthly_balance_history = []
        self.monthly_interest_history = []

    def get_balance(self) -> float:
        return self.balance

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "balance": round(self.balance, 2),
            "annual_interest_earned": round(self.total_yearly_interest_earned, 2),
            "total_employee_contributions": round(self.total_yearly_employee_contributions, 2),
            "total_employer_contributions": round(self.total_yearly_employer_contributions, 2),
            "balance_history": self.monthly_balance_history,
            "interest_history": self.monthly_interest_history,
        }
    
QUALIFIED_DIVIDEND_TAX_RATE = 0.15

class TaxableInvestmentSim(AccountSimulator):

    def __init__(self, account, filing_status: str = "single", state: str = "MI"):
        self._id = account["id"]
        self._variant = account["variant"]
        self.name = account["name"]
        self.start_age = account["start_age"]
        self.end_age = account["end_age"]

        # Config
        self.expected_return = account["expected_return"]
        self.dividend_yield = account["dividend_yield"]
        self.dividend_reinvestment = account["dividend_reinvestment"]  # "drip" | "cash_out"
        self.contribution_mode = account["contribution_mode"]          # "dollar" | "percentage"
        self.monthly_contribution_fixed = account["monthly_contribution"]
        self.contribution_percentage = (account.get("contribution_percentage") or 0.0) / 100 # TODO: fix the frontend to send a decimal 

        self.linked_income_id = account.get("linked_income_id")
        self.lot_method = account.get("lot_method", "hifo")
        self.filing_status = filing_status

        self.balance = account["starting_balance"]
        self.cost_basis = account["starting_balance"]

        # Tax lots: {"month_index": int, "cost": float}
        # month_index is absolute (year * 12 + month) for holding period math
        self.tax_lots: list[dict] = []
        if account["starting_balance"] > 0:
            self.tax_lots.append({"month_index": -13, "cost": account["starting_balance"]})

        self.annual_appreciation_earned = 0.0
        self.annual_dividends_earned = 0.0
        self.annual_capital_gains_realized = 0.0

        self.monthly_balance_history: list[float] = []
        self.monthly_return_history: list[float] = []

        self._month_index = 0

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def calculate_contribution(self, monthly_gross: float = 0.0) -> float:
        if self.contribution_mode == "percentage":
            return monthly_gross * self.contribution_percentage
        return self.monthly_contribution_fixed

    def deposit(self, amount: float) -> None:
        """Contribution deposit — increases cost basis and opens a new tax lot."""
        if amount <= 0:
            return
        self.balance += amount
        self.cost_basis += amount
        self.tax_lots.append({"month_index": self._month_index, "cost": amount})

    def _drip_deposit(self, amount: float) -> None:
        """DRIP dividend — increases cost basis like a contribution but tracked separately."""
        if amount <= 0:
            return
        self.balance += amount
        self.cost_basis += amount
        self.tax_lots.append({"month_index": self._month_index, "cost": amount})

    def withdraw(self, amount: float) -> None:
        """Placeholder — full sell logic comes in a later phase."""
        self.balance = max(0.0, self.balance - amount)

    def process_month_end(self) -> float:
        """
        Apply appreciation and dividends.
        Returns cash dividend amount to deposit to checking (0.0 if DRIP).
        """
        monthly_rate = self.expected_return / 12
        appreciation = self.balance * monthly_rate
        self.balance += appreciation
        self.annual_appreciation_earned += appreciation

        dividend = self.balance * (self.dividend_yield / 12)
        self.annual_dividends_earned += dividend

        cash_dividend_out = 0.0
        if self.dividend_reinvestment == "drip":
            self._drip_deposit(dividend)
        else:
            cash_dividend_out = dividend

        self.monthly_balance_history.append(round(self.balance, 2))
        self.monthly_return_history.append(round(appreciation, 2))
        self._month_index += 1

        return cash_dividend_out

    def process_year_end(self) -> float:
        """
        Calculate taxes owed on dividends (and any realized gains).
        Returns total taxes owed — caller withdraws from checking.
        """
        dividend_tax = self.annual_dividends_earned * QUALIFIED_DIVIDEND_TAX_RATE
        capital_gains_tax = self.annual_capital_gains_realized * QUALIFIED_DIVIDEND_TAX_RATE  # all long-term for now

        taxes_owed = dividend_tax + capital_gains_tax

        self.annual_appreciation_earned = 0.0
        self.annual_dividends_earned = 0.0
        self.annual_capital_gains_realized = 0.0
        self.monthly_balance_history = []
        self.monthly_return_history = []

        return round(taxes_owed, 2)

    def get_balance(self) -> float:
        return self.balance

    def snapshot(self) -> dict:
        unrealized_gain = self.balance - self.cost_basis
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "balance": round(self.balance, 2),
            "cost_basis": round(self.cost_basis, 2),
            "unrealized_gain": round(unrealized_gain, 2),
            "annual_appreciation_earned": round(self.annual_appreciation_earned, 2),
            "annual_dividends_earned": round(self.annual_dividends_earned, 2),
            "annual_capital_gains_realized": round(self.annual_capital_gains_realized, 2),
            "balance_history": self.monthly_balance_history,
            "return_history": self.monthly_return_history,
        }

# ═══════════════════════════════════════════════════════════════════════════
# INCOME SIMULATORS
# ═══════════════════════════════════════════════════════════════════════════
ANNUAL_401K_EMPLOYEE_LIMIT = 23500

class IncomeSimulator(ABC):

    @abstractmethod
    def is_active(self, age: int) -> bool:
        pass

    @abstractmethod
    def _calculate_and_set_annual_values(self) -> None:
        pass

    @abstractmethod
    def _apply_retirement_contribution(self, monthly_401k: float, monthly_gross: float) -> None:
        pass

    @abstractmethod
    def process_monthly_payroll(self) -> dict:
        pass

    @abstractmethod
    def calculate_growth(self) -> float:
        pass

    @abstractmethod
    def process_year_end(self) -> None:
        pass

    @abstractmethod
    def snapshot(self) -> dict:
        pass

class SalaryIncomeSim:

    def __init__(self, income: SalaryIncome, retirement_account: EmployerRetirementAccountSim = None, filing_status = "single", state="MI"):
        self._id = income["id"]
        self._variant = income["variant"]
        self.name = income["name"]
        self.start_age = income["start_age"]
        self.end_age = income["end_age"]

        # Income configuration
        self.gross_annual = income["gross_income"]
        self.income_growth = income["income_growth"]
        self.current_gross_annual = self.gross_annual

        # Linked accounts
        self.retirement_account = retirement_account
        self.tax_service = TaxService(filing_status, state)

        self._calculate_and_set_annual_values()

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant
    
    def _calculate_and_set_annual_values(self):
        """Calculate all annual values once - called on init and year-end"""
        # Calculate annual 401k
        if self.retirement_account:
            monthly_gross = self.current_gross_annual / 12
            monthly_401k = self.retirement_account.calculate_employee_contribution(monthly_gross)
            self.annual_401k_contributions = min(monthly_401k * 12, ANNUAL_401K_EMPLOYEE_LIMIT)
        else:
            self.annual_401k_contributions = 0.0

        # Calculate annual taxes ONCE
        taxes = self.tax_service.calculate_income_taxes(gross_income=self.current_gross_annual,pre_tax_deductions=self.annual_401k_contributions)

        self.annual_federal_tax = taxes.federal
        self.annual_fica_tax = taxes.fica
        self.annual_state_tax = taxes.state
        self.annual_total_tax = taxes.total

        # Calculate net income
        self.current_net_annual = self.current_gross_annual - self.annual_401k_contributions - self.annual_total_tax

    def is_active(self, age: int) -> bool:
        return self.start_age <= age < self.end_age
    
    def _apply_retirement_contribution(self, contribution, monthly_gross):
        if not self.retirement_account:
            return

        self.retirement_account.contribute_employee(contribution)
        self.retirement_account.contribute_employer(contribution, monthly_gross)

    def process_monthly_payroll(self):
        monthly_401k = self.annual_401k_contributions / 12
        monthly_gross = self.current_gross_annual / 12
        self._apply_retirement_contribution(monthly_401k, monthly_gross)

        return {
            "gross_income": round(self.gross_annual, 2),
            "taxable_income": round((self.current_gross_annual - self.annual_401k_contributions) / 12, 2),
            "retirement_contribution": round(monthly_401k, 2),
            "net_income": round(self.current_net_annual / 12, 2),
            "taxes": {
                "total": self.annual_total_tax / 12,
                "federal": self.annual_federal_tax / 12,
                "fica": self.annual_fica_tax / 12,
                "state": self.annual_state_tax / 12, 
            }
        }

    def calculate_growth(self) -> float:
        return self.current_gross_annual * (1 + self.income_growth)
    
    def _apply_growth(self) -> None:
        """Apply annual salary increase for the next year"""
        self.current_gross_annual = self.calculate_growth()

    def process_year_end(self) -> None:
        """Apply annual salary increase and calculate and update annual values"""
        self._apply_growth()
        self._calculate_and_set_annual_values()

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "gross_annual": round(self.current_gross_annual, 2),
            "net_annual": round(self.current_net_annual, 2),
            "annual_401k_contributions": round(self.annual_401k_contributions, 2),
            "taxes": {
                "federal": round(self.annual_federal_tax, 2),
                "fica": round(self.annual_fica_tax, 2),
                "state": round(self.annual_state_tax, 2)
            }
        }


class HourlyIncomeSim(IncomeSimulator):

    def __init__(self, income, retirement_account: EmployerRetirementAccountSim = None, filing_status = "single", state = "MI"):
        self._id = income["id"]
        self._variant = income["variant"]
        self.name = income["name"]
        self.start_age = income["start_age"]
        self.end_age = income["end_age"]
        self.hourly_rate = income["hourly_rate"]
        self.hours_per_week = income["hours_per_week"]
        self.income_growth = income["income_growth"]
        self.current_gross_annual = self.hourly_rate * self.hours_per_week * 52
        self.retirement_account = retirement_account
        self.tax_service = TaxService(filing_status, state)
        self._calculate_and_set_annual_values()

    def is_active(self, age: int) -> bool:
        return self.start_age <= age < self.end_age

    def _calculate_and_set_annual_values(self) -> None:
        if self.retirement_account:
            monthly_gross = self.current_gross_annual / 12
            monthly_401k = self.retirement_account.calculate_employee_contribution(monthly_gross)
            self.annual_401k_contributions = min(monthly_401k * 12, ANNUAL_401K_EMPLOYEE_LIMIT)
        else:
            self.annual_401k_contributions = 0.0

        taxes = self.tax_service.calculate_income_taxes(
            gross_income=self.current_gross_annual,
            pre_tax_deductions=self.annual_401k_contributions,
        )
        self.annual_federal_tax = taxes.federal
        self.annual_fica_tax = taxes.fica
        self.annual_state_tax = taxes.state
        self.annual_total_tax = taxes.total
        self.current_net_annual = self.current_gross_annual - self.annual_401k_contributions - self.annual_total_tax

    def _apply_retirement_contribution(self, monthly_401k: float, monthly_gross: float) -> None:
        if not self.retirement_account:
            return
        
        self.retirement_account.contribute_employee(monthly_401k)
        self.retirement_account.contribute_employer(monthly_401k, monthly_gross)

    def process_monthly_payroll(self) -> dict:
        monthly_401k = self.annual_401k_contributions / 12
        monthly_gross = self.current_gross_annual / 12
        self._apply_retirement_contribution(monthly_401k, monthly_gross)
        return {
            "gross_income": round(monthly_gross, 2),
            "taxable_income": round((self.current_gross_annual - self.annual_401k_contributions) / 12, 2),
            "retirement_contribution": round(monthly_401k, 2),
            "net_income": round(self.current_net_annual / 12, 2),
            "taxes": {
                "total": self.annual_total_tax / 12,
                "federal": self.annual_federal_tax / 12,
                "fica": self.annual_fica_tax / 12,
                "state": self.annual_state_tax / 12,
            },
        }

    def calculate_growth(self) -> float:
        next_rate = self.hourly_rate * (1 + self.income_growth)
        return next_rate * self.hours_per_week * 52

    def _apply_growth(self) -> None:
        self.hourly_rate = self.hourly_rate * (1 + self.income_growth)
        self.current_gross_annual = self.hourly_rate * self.hours_per_week * 52

    def process_year_end(self) -> None:
        self._apply_growth()
        self._calculate_and_set_annual_values()

    def snapshot(self) -> dict:
        return {
            "id": self._id,
            "name": self.name,
            "variant": self._variant,
            "gross_annual": round(self.current_gross_annual, 2),
            "net_annual": round(self.current_net_annual, 2),
            "annual_401k_contributions": round(self.annual_401k_contributions, 2),
            "taxes": {
                "federal": round(self.annual_federal_tax, 2),
                "fica": round(self.annual_fica_tax, 2),
                "state": round(self.annual_state_tax, 2),
            },
        }

SIDE_HUSTLE_INCOME_GROWTH = 0.03
PERIODS_PER_YEAR = {
    "weekly": 52,
    "biweekly": 26,
    "monthly": 12,
}

class SideHustleIncomeSim(IncomeSimulator):

    def __init__(self, income, filing_status: str = "single", state: str = "MI"):
        self._id = income["id"]
        self._variant = income["variant"]
        self.name = income["name"]
        self.start_age = income["start_age"]
        self.end_age = income["end_age"]

        self.average_income_per_period = income["average_income_per_period"]
        self.frequency = income["frequency"]
        self.variability = income["variability"]
        self.periods_per_year = PERIODS_PER_YEAR[self.frequency]
        self.periods_per_month = self.periods_per_year / 12

        self.tax_service = TaxService(filing_status, state)

        # monthly actuals tracking
        self.total_year_gross = 0.0

    def is_active(self, age: int) -> bool:
        return self.start_age <= age < self.end_age

    def _calculate_and_set_annual_values(self):
        taxes = self.tax_service.calculate_se_income_taxes(self.total_year_gross)
        self.annual_federal_tax = taxes["federal"]
        self.annual_se_tax = taxes["se_tax"]
        self.annual_state_tax = taxes["state"]
        self.annual_total_tax = taxes["total"]
        self.current_net_annual = self.total_year_gross - self.annual_total_tax
        return self.annual_total_tax
    
    def _apply_retirement_contribution(self, monthly_401k, monthly_gross) -> None:
        pass  # no employer account

    def _sample_monthly_income(self) -> float:
        """Sample from normal distribution centered on expected monthly income."""
        mean = self.average_income_per_period * self.periods_per_month
        std = mean * self.variability
        return max(0.0, np.random.normal(mean, std))

    def process_monthly_payroll(self) -> dict:
        monthly_gross = self._sample_monthly_income()
        # print(monthly_gross)
        self.total_year_gross += monthly_gross

        return {
            "gross_income": round(monthly_gross, 2),
            "taxable_income": round(monthly_gross, 2),
            "retirement_contribution": 0.0,
            "net_income": round(monthly_gross, 2),  # full amount, taxes settled at year end
            "taxes": {
                "total": 0.0,
                "federal": 0.0,
                "fica": 0.0,
                "state": 0.0,
            },
        }

    def _compute_taxes(self, gross: float) -> dict:
        taxes = self.tax_service.calculate_se_income_taxes(gross)
        return {
            "federal": taxes["federal"],
            "se_tax": taxes["se_tax"],
            "state": taxes["state"],
            "total": taxes["total"],
        }

    def calculate_growth(self) -> float:
        return self.average_income_per_period * (1 + SIDE_HUSTLE_INCOME_GROWTH) * self.periods_per_year

    def _apply_growth(self) -> None:
        self.average_income_per_period *= (1 + SIDE_HUSTLE_INCOME_GROWTH)

    def process_year_end(self) -> float:
        taxes = self._compute_taxes(self.total_year_gross)
        self.annual_federal_tax = taxes["federal"]
        self.annual_se_tax = taxes["se_tax"]
        self.annual_state_tax = taxes["state"]
        self.annual_total_tax = taxes["total"]
        taxes_owed = taxes["total"]
        self._apply_growth()
        self.total_year_gross = 0.0
        return taxes_owed

    def snapshot(self) -> dict:
        taxes = self._compute_taxes(self.total_year_gross)
        net = self.total_year_gross - taxes["total"]
        return {
            "id": self._id,
            "name": self.name,
            "variant": self._variant,
            "gross_annual": round(self.total_year_gross, 2),
            "net_annual": round(net, 2),
            "annual_401k_contributions": 0.0,
            "taxes": {
                "total": round(taxes["total"], 2),
                "federal": round(taxes["federal"], 2),
                "fica": round(taxes["se_tax"], 2),
                "state": round(taxes["state"], 2),
            },
        }
    

# job = {
#     "source_type": "income",
#     "variant": "salary",
#     "id": "salary_1",
#     "name": "Senior SWE",
#     "start_age": 27,
#     "end_age": 30,
#     "gross_income": 145000,
#     "income_growth": 0.04,
#     "linked_401k_id": "ret_1"
# }

# hourly = {
#     "source_type": "income",
#     "variant": "hourly",
#     "id": "hourly_1",
#     "name": "cook",
#     "start_age": 25,
#     "end_age": 28,
#     "hourly_rate": 25,
#     "hours_per_week": 46,
#     "gross_income": 59800,
#     "income_growth": 3,
#     "linked_401k_id": "401k_1"
# }

side = {
    "source_type": "income",
    "variant": "side",
    "id": "4a138a40-6af0-41c0-a327-00b3af94caf2",
    "name": "freelance swe",
    "start_age": 25,
    "end_age": 28,
    "gross_income": 13000,
    "variability": 0.755,
    "frequency": "biweekly",
    "average_income_per_period": 500
}

# acc = {
#     "source_type": "liquid",
#     "variant": "employer_retirement",
#     "id": "401k_1",
#     "name": "salary 401",
#     "start_age": 25,
#     "end_age": 28,
#     "starting_balance": 0,
#     "contribution_mode": "percentage",
#     "monthly_contribution": 29900,
#     "contribution_percentage": 0.10,
#     "expected_return": 0.10,
#     "employer_match_rate": 1.0,
#     "employer_match_limit": 0.10,
#     "linked_income_id": "hourly_1"
# }

# acc_sim = EmployerRetirementAccountSim(acc)
# salary_sim = SalaryIncomeSim(SalaryIncome(**job), acc_sim)
# hourly_sim = HourlyIncomeSim(hourly, acc_sim)
# side_sim = SideHustleIncomeSim(side)
# for month in range(12):
    # res = salary_sim.process_monthly_payroll()
    # res = hourly_sim.process_monthly_payroll()
    # res =  side_sim.process_monthly_payroll()

    # if month == 11:
    #     print(json.dumps(res, indent=2))
    # acc_sim.process_month_end()

# print(json.dumps(salary_sim.snapshot(), indent=2))
# print(json.dumps(hourly_sim.snapshot(), indent=2))
# print(json.dumps(acc_sim.snapshot(), indent=2))
# print(json.dumps(side_sim.snapshot(), indent=2))
# print("process end of year")
# side_sim.process_year_end()
# salary_sim.process_year_end()

# ═══════════════════════════════════════════════════════════════════════════
# Expenses
# ═══════════════════════════════════════════════════════════════════════════

class ExpenseSimulator(ABC):

    @abstractmethod
    def is_active(self, age: int) -> bool: pass

    @abstractmethod
    def process_monthly_payment(self) -> dict: pass

    @abstractmethod
    def process_year_end(self) -> None: pass

    @abstractmethod
    def snapshot(self) -> dict: pass

    @property
    @abstractmethod
    def id(self) -> str: pass

    @property
    @abstractmethod
    def variant(self) -> str: pass


class HouseLoanSim(ExpenseSimulator):

    def __init__(self, loan: dict):
        self._id = loan["id"]
        self._variant = loan["variant"]
        self.name = loan["name"]
        self.start_age = loan["start_age"]
        self.linked_asset_id = loan.get("linked_asset_id")

        # Config
        self.original_principal = loan["original_principal"]
        self.interest_rate = loan["interest_rate"]
        self.loan_term_years = loan["loan_term_years"]
        self.extra_monthly_payment = loan.get("extra_monthly_payment") or 0.0

        # Recalculate monthly payment from first principles — don't trust frontend value
        r = self.interest_rate / 12
        n = self.loan_term_years * 12
        self.monthly_payment = self.original_principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)

        # Live state
        self.remaining_balance = float(self.original_principal)
        self.is_paid_off = False

        # Lifetime accumulators (never reset)
        self._lifetime_total_paid = 0.0
        self.principal_paid = 0.0
        self.interest_paid_lifetime = 0.0

        # Annual trackers (reset each year_end)
        self.annual_principal_paid = 0.0
        self.annual_interest_paid = 0.0

        # Yearly history (one entry per year, never reset)
        self.monthly_balance_history: list[float] = []
        self.monthly_principal_history: list[float] = []
        self.monthly_interest_history: list[float] = []
        self.monthly_total_paid_history: list[float] = []

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age and not self.is_paid_off

    def process_monthly_payment(self) -> dict:
        if self.is_paid_off or self.remaining_balance <= 0:
            return {"payment": 0.0, "principal": 0.0, "interest": 0.0, "remaining_balance": 0.0}

        monthly_rate = self.interest_rate / 12
        interest_portion = self.remaining_balance * monthly_rate

        # Last payment may be smaller than monthly_payment
        principal_portion = min(self.monthly_payment - interest_portion, self.remaining_balance)
        extra = min(self.extra_monthly_payment, self.remaining_balance - principal_portion)
        total_principal = principal_portion + extra
        total_paid = total_principal + interest_portion

        self.remaining_balance -= total_principal
        self.remaining_balance = max(0.0, self.remaining_balance)

        # Accumulate
        self.principal_paid += total_principal
        self.interest_paid_lifetime += interest_portion
        self.annual_principal_paid += total_principal
        self.annual_interest_paid += interest_portion
        self._lifetime_total_paid += total_paid

        if self.remaining_balance == 0.0:
            self.is_paid_off = True

        self.monthly_balance_history.append(round(self.remaining_balance, 2))
        self.monthly_principal_history.append(round(total_principal, 2))
        self.monthly_interest_history.append(round(interest_portion, 2))
        self.monthly_total_paid_history.append(round(self._lifetime_total_paid, 2))

        return {
            "payment": round(total_paid, 2),
            "principal": round(total_principal, 2),
            "interest": round(interest_portion, 2),
            "remaining_balance": round(self.remaining_balance, 2),
        }

    def terminate_on_sale(self) -> float:
        """
        Called when the linked house asset is sold.
        Returns net proceeds (positive = profit to checking, negative = deficiency from checking).
        Loan balance is cleared — handled by HouseAssetSim passing in sale price.
        """
        self.is_paid_off = True
        payoff_amount = self.remaining_balance
        self.remaining_balance = 0.0
        return payoff_amount

    def process_year_end(self) -> None:
        self.annual_principal_paid = 0.0
        self.annual_interest_paid = 0.0
        self.monthly_balance_history = []
        self.monthly_principal_history = []
        self.monthly_interest_history = []
        self.monthly_total_paid_history = []

    def snapshot(self) -> dict:
        if self.remaining_balance > 0:
            r = self.interest_rate / 12
            # Remaining months at current payment rate
            import math
            remaining_term_months = math.ceil(
                -math.log(1 - (self.remaining_balance * r) / self.monthly_payment) / math.log(1 + r)
            ) if self.monthly_payment > self.remaining_balance * r else 0
        else:
            remaining_term_months = 0

        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "remaining_balance": round(self.remaining_balance, 2),
            "original_principal": self.original_principal,
            "principal_paid": round(self.principal_paid, 2),
            "interest_paid_lifetime": round(self.interest_paid_lifetime, 2),
            "monthly_payment": round(self.monthly_payment, 2),
            "extra_monthly_payment": self.extra_monthly_payment,
            "effective_interest_rate": self.interest_rate,
            "remaining_term_months": remaining_term_months,
            "annual_principal_paid": round(self.annual_principal_paid, 2),
            "annual_interest_paid": round(self.annual_interest_paid, 2),
            "balance_history": self.monthly_balance_history,
            "principal_history": self.monthly_principal_history,
            "interest_history": self.monthly_interest_history,
            "total_paid_history": self.monthly_total_paid_history,
        }
    
class CarLoanSim(ExpenseSimulator):

    def __init__(self, loan: dict):
        self._id = loan["id"]
        self._variant = loan["variant"]
        self.name = loan["name"]
        self.start_age = loan["start_age"]
        self.end_age = loan["end_age"]
        self.linked_asset_id = loan.get("linked_asset_id")

        self.original_principal = loan["original_principal"]
        self.interest_rate = loan["interest_rate"]
        self.loan_term_years = loan["loan_term_years"]

        r = self.interest_rate / 12
        n = self.loan_term_years * 12
        self.monthly_payment = self.original_principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)

        self.remaining_balance = float(self.original_principal)
        self.is_paid_off = False

        self._lifetime_total_paid = 0.0
        self.principal_paid = 0.0
        self.interest_paid_lifetime = 0.0

        self.annual_principal_paid = 0.0
        self.annual_interest_paid = 0.0

        self.monthly_balance_history: list[float] = []
        self.monthly_principal_history: list[float] = []
        self.monthly_interest_history: list[float] = []
        self.monthly_total_paid_history: list[float] = []

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age < self.end_age and not self.is_paid_off

    def process_monthly_payment(self) -> dict:
        if self.is_paid_off or self.remaining_balance <= 0:
            return {"payment": 0.0, "principal": 0.0, "interest": 0.0, "remaining_balance": 0.0}

        monthly_rate = self.interest_rate / 12
        interest_portion = self.remaining_balance * monthly_rate
        principal_portion = min(self.monthly_payment - interest_portion, self.remaining_balance)
        total_paid = principal_portion + interest_portion

        self.remaining_balance -= principal_portion
        self.remaining_balance = max(0.0, self.remaining_balance)

        self.principal_paid += principal_portion
        self.interest_paid_lifetime += interest_portion
        self.annual_principal_paid += principal_portion
        self.annual_interest_paid += interest_portion
        self._lifetime_total_paid += total_paid

        self.monthly_balance_history.append(round(self.remaining_balance, 2))
        self.monthly_principal_history.append(round(principal_portion, 2))
        self.monthly_interest_history.append(round(interest_portion, 2))
        self.monthly_total_paid_history.append(round(self._lifetime_total_paid, 2))

        if self.remaining_balance == 0.0:
            self.is_paid_off = True

        return {
            "payment": round(total_paid, 2),
            "principal": round(principal_portion, 2),
            "interest": round(interest_portion, 2),
            "remaining_balance": round(self.remaining_balance, 2),
        }

    def terminate_on_sale(self) -> float:
        self.is_paid_off = True
        payoff_amount = self.remaining_balance
        self.remaining_balance = 0.0
        return payoff_amount

    def process_year_end(self) -> None:
        self.annual_principal_paid = 0.0
        self.annual_interest_paid = 0.0
        self.monthly_balance_history = []
        self.monthly_principal_history = []
        self.monthly_interest_history = []
        self.monthly_total_paid_history = []

    def snapshot(self) -> dict:
        import math
        r = self.interest_rate / 12
        if self.remaining_balance > 0 and self.monthly_payment > self.remaining_balance * r:
            remaining_term_months = math.ceil(
                -math.log(1 - (self.remaining_balance * r) / self.monthly_payment) / math.log(1 + r)
            )
        else:
            remaining_term_months = 0

        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "remaining_balance": round(self.remaining_balance, 2),
            "original_principal": self.original_principal,
            "principal_paid": round(self.principal_paid, 2),
            "interest_paid_lifetime": round(self.interest_paid_lifetime, 2),
            "monthly_payment": round(self.monthly_payment, 2),
            "effective_interest_rate": self.interest_rate,
            "remaining_term_months": remaining_term_months,
            "annual_principal_paid": round(self.annual_principal_paid, 2),
            "annual_interest_paid": round(self.annual_interest_paid, 2),
            "balance_history": self.monthly_balance_history,
            "principal_history": self.monthly_principal_history,
            "interest_history": self.monthly_interest_history,
            "total_paid_history": self.monthly_total_paid_history,
        }


class LivingExpenseSim(ExpenseSimulator):

    def __init__(self, expense: dict):
        self._id = expense["id"]
        self._variant = expense["variant"]
        self.name = expense["name"]
        self.start_age = expense["start_age"]
        self.end_age = expense["end_age"]

        self.current_monthly_expense = float(expense["monthly_expense"])
        self.expense_growth = expense.get("expense_growth", 0.0)

        self.annual_total_paid = 0.0

        self.monthly_payment_history: list[float] = []

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age < self.end_age

    def process_monthly_payment(self) -> dict:
        payment = self.current_monthly_expense
        self.annual_total_paid += payment
        self.monthly_payment_history.append(round(payment, 2))
        return {
            "payment": round(payment, 2),
            "principal": 0.0,
            "interest": 0.0,
            "remaining_balance": 0.0,
        }

    def process_year_end(self) -> None:
        self.current_monthly_expense *= (1 + self.expense_growth)
        self.annual_total_paid = 0.0
        self.monthly_payment_history = []

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "monthly_payment": round(self.current_monthly_expense, 2),
            "annual_total_paid": round(self.annual_total_paid, 2),
            "interest_paid_lifetime": 0.0,   # keeps expenses_summary aggregate happy
            "expense_growth": self.expense_growth,
            "payment_history": self.monthly_payment_history,
        }


# ═══════════════════════════════════════════════════════════════════════════
# Assets
# ═══════════════════════════════════════════════════════════════════════════

class HouseAssetSim:

    def __init__(self, asset: dict, linked_loan: HouseLoanSim | None = None):
        self._id = asset["id"]
        self._variant = asset["variant"]
        self.name = asset["name"]
        self.start_age = asset["start_age"]
        self.end_age = asset["end_age"]
        self.annual_appreciation = asset["annual_appreciation"]
        self.down_payment = asset["down_payment"]
        self.linked_loan = linked_loan

        self.current_value = float(asset["asset_value"])
        self.is_sold = False

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age and not self.is_sold

    def get_equity(self) -> float:
        loan_balance = self.linked_loan.remaining_balance if self.linked_loan else 0.0
        return self.current_value - loan_balance

    def process_year_end(self) -> None:
        self.current_value *= (1 + self.annual_appreciation)

    def process_sale(self) -> float:
        """
        Sells the house. Pays off the loan. Returns net proceeds to caller.
        Positive = deposit to checking. Negative = withdraw from checking.
        """
        sale_price = self.current_value
        loan_payoff = self.linked_loan.terminate_on_sale() if self.linked_loan else 0.0
        net_proceeds = sale_price - loan_payoff
        self.is_sold = True
        return net_proceeds

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "current_value": round(self.current_value, 2),
            "equity": round(self.get_equity(), 2),
            "down_payment": self.down_payment,
            "annual_appreciation": self.annual_appreciation,
        }

class CarAssetSim:

    def __init__(self, asset: dict, linked_loan: CarLoanSim | None = None):
        self._id = asset["id"]
        self._variant = asset["variant"]
        self.name = asset["name"]
        self.start_age = asset["start_age"]
        self.end_age = asset["end_age"]
        self.annual_depreciation = asset["annual_depreciation"]
        self.down_payment = asset["down_payment"]
        self.linked_loan = linked_loan

        self.current_value = float(asset["asset_value"])
        self.is_sold = False


    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age and not self.is_sold

    def get_equity(self) -> float:
        loan_balance = self.linked_loan.remaining_balance if self.linked_loan else 0.0
        return self.current_value - loan_balance

    def process_year_end(self) -> None:
        self.current_value *= (1 - self.annual_depreciation)
       
    def process_sale(self) -> float:
        sale_price = self.current_value
        loan_payoff = self.linked_loan.terminate_on_sale() if self.linked_loan else 0.0
        net_proceeds = sale_price - loan_payoff
        self.is_sold = True
        return net_proceeds

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "variant": self.variant,
            "current_value": round(self.current_value, 2),
            "equity": round(self.get_equity(), 2),
            "down_payment": self.down_payment,
            "annual_depreciation": self.annual_depreciation,
        }

# ═══════════════════════════════════════════════════════════════════════════
# SIMULATION COORDINATOR
# ═══════════════════════════════════════════════════════════════════════════

class SimulationState:
    """Organized simulation state with typed collections"""

    def __init__(self):
        self.checking_accounts: List[CheckingAccountSim] = []
        self.retirement_accounts: List[EmployerRetirementAccountSim] = []
        self.salary_incomes: List[SalaryIncomeSim] = []
        self.hourly_incomes: List[HourlyIncomeSim] = []
        self.side_hustle_incomes: List[SideHustleIncomeSim] = []
        self.taxable_investment_accounts: List[TaxableInvestmentSim] = []

        self.house_loans: List[HouseLoanSim] = []
        self.car_loans: List[CarLoanSim] = []
        self.living_expenses: List[LivingExpenseSim] = []

        self.house_assets: List[HouseAssetSim] = []
        self.car_assets: List[CarAssetSim] = []

        self.primary_checking: CheckingAccountSim | None = None

    def get_all_accounts(self) -> List[AccountSimulator]:
        return (self.checking_accounts + self.retirement_accounts + self.taxable_investment_accounts)

    def get_account_by_id(self, account_id: str) -> AccountSimulator | None:
        for account in self.get_all_accounts():
            if account.id == account_id:
                return account
        return None


def simulate(req: SimulateRequest):
    req = req.model_dump()
    state = SimulationState()
    filing_status = req.get("filing_status", "single")
    state_code = req.get("state", "MI")

    for acc in req["accounts"]["checking"]:
        checking_sim = CheckingAccountSim(acc)
        state.checking_accounts.append(checking_sim)
        if state.primary_checking is None:
            state.primary_checking = checking_sim

    retirement_by_id = {}
    for acc in req["accounts"]["employer_retirement"]:
        retirement_sim = EmployerRetirementAccountSim(acc)
        state.retirement_accounts.append(retirement_sim)
        retirement_by_id[acc["id"]] = retirement_sim

    for acc in req["accounts"]["taxable_investments"]:
        inv_sim = TaxableInvestmentSim(acc, filing_status=filing_status, state=state_code)
        state.taxable_investment_accounts.append(inv_sim)

    house_loan_by_id: dict[str, HouseLoanSim] = {}
    for loan in req["expenses"].get("house_loan", []):
        loan_sim = HouseLoanSim(loan)
        state.house_loans.append(loan_sim)
        house_loan_by_id[loan["id"]] = loan_sim

    for asset in req["assets"].get("house", []):
        linked_loan = house_loan_by_id.get(asset["linked_loan_id"])
        asset_sim = HouseAssetSim(asset, linked_loan)
        state.house_assets.append(asset_sim)

    for income in req["incomes"]["salary"]:
        linked_retirement = retirement_by_id.get(income["linked_401k_id"]) if income.get("linked_401k_id") else None
        salary_sim = SalaryIncomeSim(income=income, retirement_account=linked_retirement, filing_status=filing_status, state=state_code)
        state.salary_incomes.append(salary_sim)

    for income in req["incomes"]["hourly"]:
        linked_retirement = retirement_by_id.get(income["linked_401k_id"]) if income.get("linked_401k_id") else None
        hourly_sim = HourlyIncomeSim(income=income, retirement_account=linked_retirement, filing_status=filing_status, state=state_code)
        state.hourly_incomes.append(hourly_sim)

    for income in req["incomes"]["side"]:
        side_sim = SideHustleIncomeSim(income=income, filing_status=filing_status, state=state_code)
        state.side_hustle_incomes.append(side_sim)

    car_loan_by_id: dict[str, CarLoanSim] = {}
    for loan in req["expenses"].get("car_loan", []):
        loan_sim = CarLoanSim(loan)
        state.car_loans.append(loan_sim)
        car_loan_by_id[loan["id"]] = loan_sim

    for expense in req["expenses"].get("living", []):
        living_sim = LivingExpenseSim(expense)
        state.living_expenses.append(living_sim)

    for asset in req["assets"].get("car", []):
        linked_loan = car_loan_by_id.get(asset["linked_loan_id"])
        asset_sim = CarAssetSim(asset, linked_loan)
        state.car_assets.append(asset_sim)

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    results = []
    starting_net_worth = sum(acc.get_balance() for acc in state.get_all_accounts())

    for year_offset in range(0, req["user_end_age"] - req["user_start_age"]):
        current_age = req["user_start_age"] + year_offset
        calendar_year = datetime.now().year + year_offset

        active_checking = [a for a in state.checking_accounts if a.is_active(current_age)]
        active_retirement = [a for a in state.retirement_accounts if a.is_active(current_age)]
        active_taxable = [a for a in state.taxable_investment_accounts if a.is_active(current_age)]

        active_salaries = [i for i in state.salary_incomes if i.is_active(current_age)]
        active_hourlies = [i for i in state.hourly_incomes if i.is_active(current_age)]
        active_side = [i for i in state.side_hustle_incomes if i.is_active(current_age)]

        active_house_loans = [l for l in state.house_loans if l.is_active(current_age)]
        active_car_loans = [l for l in state.car_loans if l.is_active(current_age)]
        active_living = [e for e in state.living_expenses if e.is_active(current_age)]

        active_house_assets = [a for a in state.house_assets if a.is_active(current_age)]
        active_car_assets = [a for a in state.car_assets if a.is_active(current_age)]

        for month in range(12):
            # ── INCOME ────────────────────────────────────────────────────────
            for salary_sim in active_salaries:
                cashflow = salary_sim.process_monthly_payroll()  # sub deductions 401k
                state.primary_checking.deposit(cashflow["net_income"])

            for hourly_sim in active_hourlies:
                cashflow = hourly_sim.process_monthly_payroll()
                state.primary_checking.deposit(cashflow["net_income"])

            for side_sim in active_side:
                cashflow = side_sim.process_monthly_payroll()
                state.primary_checking.deposit(cashflow["net_income"])

            # for all expenses
                # withdraw that monthly expense from the checking

            # ── ONE TIME PURCHASES (first month of asset's start year) ────────
            if month == 0:
                for asset_sim in active_house_assets:
                    if current_age == asset_sim.start_age:
                        state.primary_checking.withdraw(asset_sim.down_payment)

                for asset_sim in active_car_assets:
                    if current_age == asset_sim.start_age:
                        state.primary_checking.withdraw(asset_sim.down_payment)

            # ── TAXABLE INVESTMENT CONTRIBUTIONS ──────────────────────────────
            monthly_gross_by_id = {}
            for s in active_salaries:
                monthly_gross_by_id[s.id] = s.current_gross_annual / 12
            for h in active_hourlies:
                monthly_gross_by_id[h.id] = h.current_gross_annual / 12

            for inv_sim in active_taxable:
                linked_gross = monthly_gross_by_id.get(inv_sim.linked_income_id, 0.0)
                # if percentage mode but linked income isn't active, fall back to fixed
                if inv_sim.contribution_mode == "percentage" and linked_gross == 0.0:
                    contribution = inv_sim.monthly_contribution_fixed
                else:
                    contribution = inv_sim.calculate_contribution(linked_gross)
                state.primary_checking.withdraw(contribution)
                inv_sim.deposit(contribution)

            # ── LOAN PAYMENTS ─────────────────────────────────────────────────
            for loan_sim in active_house_loans:
                payment = loan_sim.process_monthly_payment()
                state.primary_checking.withdraw(payment["payment"])

            for loan_sim in active_car_loans:
                payment = loan_sim.process_monthly_payment()
                state.primary_checking.withdraw(payment["payment"])

            # ── LIVING EXPENSES ───────────────────────────────────────────────
            for living_sim in active_living:
                payment = living_sim.process_monthly_payment()
                state.primary_checking.withdraw(payment["payment"])

            # ── MONTHLY COMPOUNDING ───────────────────────────────────────────
            # for account in active_checking + active_retirement: # loans and investments and assets
            #     growth = account.process_month_end()
            #     # Could track growth here if needed
            for account in active_checking + active_retirement + active_taxable:
                if account.variant == "taxable_investments":
                    cash_dividend = account.process_month_end()
                    if cash_dividend:
                        state.primary_checking.deposit(cash_dividend)
                else:
                    account.process_month_end()

        # ── SNAPSHOTS ─────────────────────────────────────────────────────────
        # All snapshots taken before process_year_end() so they reflect
        # end-of-year state before advancing to next year
        checking_account_snapshots = [acc.snapshot() for acc in active_checking]
        retirement_account_snapshots = [acc.snapshot() for acc in active_retirement]
        taxable_snapshots = [acc.snapshot() for acc in active_taxable]

        salary_snapshots = [sim.snapshot() for sim in active_salaries]
        hourly_snapshots = [sim.snapshot() for sim in active_hourlies]
        side_snapshots = [sim.snapshot() for sim in active_side]
        all_income_snapshots = salary_snapshots + hourly_snapshots + side_snapshots

        house_loan_snapshots = [l.snapshot() for l in active_house_loans]
        car_loan_snapshots = [l.snapshot() for l in active_car_loans]
        living_snapshots = [e.snapshot() for e in active_living]
        all_loan_snapshots = house_loan_snapshots + car_loan_snapshots

        house_asset_snapshots = [a.snapshot() for a in active_house_assets]
        car_asset_snapshots = [a.snapshot() for a in active_car_assets]

        # ── AGGREGATES ────────────────────────────────────────────────────────
        # All derived from snapshots — single source of truth, no raw sim objects
        total_cash = round(sum(acc["balance"] for acc in checking_account_snapshots + retirement_account_snapshots + taxable_snapshots), 2)
        total_home_equity = round(sum(a["equity"] for a in house_asset_snapshots), 2)
        total_car_equity = round(sum(a["equity"] for a in car_asset_snapshots), 2)
        total_net_worth = round(total_cash + total_home_equity + total_car_equity, 2)

        total_gross_income = sum(s["gross_annual"] for s in all_income_snapshots)
        total_net_income = sum(s["net_annual"] for s in all_income_snapshots)
        year_federal_tax = round(sum(s["taxes"]["federal"] for s in all_income_snapshots), 2)
        year_fica_tax = round(sum(s["taxes"]["fica"] for s in all_income_snapshots), 2)
        year_state_tax = round(sum(s["taxes"]["state"] for s in all_income_snapshots), 2)
        total_year_taxes_paid = round(year_federal_tax + year_fica_tax + year_state_tax, 2)
        effective_tax_rate = round((total_year_taxes_paid / total_gross_income * 100), 2) if total_gross_income > 0 else 0

        next_gross_income = (
            sum(s.calculate_growth() for s in active_salaries) +
            sum(h.calculate_growth() for h in active_hourlies)
        )  # side hustle excluded — no stable forward gross

        if results:
            prev_year_net_worth = results[-1]["net_worth"]
            net_worth_change = total_net_worth - prev_year_net_worth
            net_worth_change_pct = round((net_worth_change / prev_year_net_worth * 100), 2) if prev_year_net_worth != 0 else 0
        else:
            net_worth_change = total_net_worth - starting_net_worth
            net_worth_change_pct = round((net_worth_change / starting_net_worth * 100), 2) if starting_net_worth != 0 else 0

        # ── SUMMARIES ─────────────────────────────────────────────────────────
        accounts_summary = {
            "total_balance": total_cash,
            "total_interest_earned": round(sum(acc["annual_interest_earned"] for acc in checking_account_snapshots + retirement_account_snapshots), 2),
            "by_variant": {
                "checking": round(sum(acc["balance"] for acc in checking_account_snapshots), 2),
                "employer_retirement": round(sum(acc["balance"] for acc in retirement_account_snapshots), 2),
                "taxable_investments": round(sum(acc["balance"] for acc in taxable_snapshots), 2),
            },
            "accounts": checking_account_snapshots + retirement_account_snapshots + taxable_snapshots,
        }

        incomes_summary = {
            "total_gross_income": total_gross_income,
            "total_net_income": total_net_income,
            "active_sources": len(active_salaries) + len(active_hourlies) + len(active_side),
            "by_variant": {
                "salary": round(sum(s["gross_annual"] for s in salary_snapshots), 2),
                "hourly": round(sum(s["gross_annual"] for s in hourly_snapshots), 2),
                "side": round(sum(s["gross_annual"] for s in side_snapshots), 2),
            },
            "incomes": all_income_snapshots,
        }

        expenses_summary = {
            "total_monthly": round(
                sum(l["monthly_payment"] for l in all_loan_snapshots) +
                sum(e["monthly_payment"] for e in living_snapshots), 2
            ),
            "total_interest_paid_lifetime": round(sum(l["interest_paid_lifetime"] for l in all_loan_snapshots), 2),
            "by_variant": {
                "house_loan": round(sum(l["monthly_payment"] for l in house_loan_snapshots), 2),
                "car_loan": round(sum(l["monthly_payment"] for l in car_loan_snapshots), 2),
                "living": round(sum(e["monthly_payment"] for e in living_snapshots), 2),
                "rent": 0.0,
                "debt": 0.0,
            },
            "expenses": all_loan_snapshots + living_snapshots,
        }

        assets_summary = {
            "total_value": round(sum(a["current_value"] for a in house_asset_snapshots + car_asset_snapshots), 2),
            "total_equity": round(total_home_equity + total_car_equity, 2),
            "by_variant": {
                "house": round(sum(a["current_value"] for a in house_asset_snapshots), 2),
                "car": round(sum(a["current_value"] for a in car_asset_snapshots), 2),
            },
            "assets": house_asset_snapshots + car_asset_snapshots,
        }

        year_result = {
            "year": calendar_year,
            "age": current_age,
            "net_worth": total_net_worth,
            "net_worth_change": round(net_worth_change, 2),
            "net_worth_change_percent": net_worth_change_pct,
            "total_cash": total_cash,
            "income_earned": {
                "gross": round(total_gross_income, 2),
                "net": round(total_net_income, 2),
                "taxes_paid": total_year_taxes_paid,
                "federal_tax": year_federal_tax,
                "fica_tax": year_fica_tax,
                "state_tax": year_state_tax,
                "effective_tax_rate": effective_tax_rate,
            },
            "current_gross_income": next_gross_income,
            "accounts_summary": accounts_summary,
            "incomes_summary": incomes_summary,
            "expenses": expenses_summary,
            "assets": assets_summary,
        }

        results.append(year_result)

        # ── ADVANCE STATE (after result recorded) ─────────────────────────────
        # process_year_end() is always last — resets annual trackers and
        # advances growth rates for the next year
        for salary_sim in active_salaries:
            salary_sim.process_year_end()

        for hourly_sim in active_hourlies:
            hourly_sim.process_year_end()

        for side_sim in active_side:
            taxes_owed = side_sim.process_year_end()
            if taxes_owed and state.primary_checking:
                state.primary_checking.withdraw(taxes_owed)

        for acc_sim in active_checking:
            acc_sim.process_year_end()

        for acc_sim in active_retirement:
            acc_sim.process_year_end()

        for inv_sim in active_taxable:
            taxes_owed = inv_sim.process_year_end()
            if taxes_owed and state.primary_checking:
                state.primary_checking.withdraw(taxes_owed)

        # ── ASSET SALES + YEAR END ────────────────────────────────────────────
        # Sale check before process_year_end() — sell at current value,
        # not post-depreciation/appreciation value
        for asset_sim in active_house_assets:
            if current_age + 1 == asset_sim.end_age:
                net_proceeds = asset_sim.process_sale()
                if net_proceeds >= 0:
                    state.primary_checking.deposit(net_proceeds)
                else:
                    state.primary_checking.withdraw(abs(net_proceeds))
            asset_sim.process_year_end()

        for loan_sim in active_house_loans:
            loan_sim.process_year_end()

        for asset_sim in active_car_assets:
            if current_age + 1 == asset_sim.end_age:
                net_proceeds = asset_sim.process_sale()
                if net_proceeds >= 0:
                    state.primary_checking.deposit(net_proceeds)
                else:
                    state.primary_checking.withdraw(abs(net_proceeds))
            asset_sim.process_year_end()

        for loan_sim in active_car_loans:
            loan_sim.process_year_end()

        for living_sim in active_living:
            living_sim.process_year_end()

    # ── BUILD FINAL METRICS ───────────────────────────────────────────────────
    metrics = {
        "total_years": len(results),
        "starting_net_worth": round(starting_net_worth, 2),
        "ending_net_worth": results[-1]["net_worth"] if results else 0,
        "peak_net_worth": round(max(r["net_worth"] for r in results), 2) if results else 0,
        "peak_net_worth_age": results[max(range(len(results)), key=lambda i: results[i]["net_worth"])]["age"] if results else 0,
        "total_income_lifetime": round(sum(r["income_earned"]["gross"] for r in results), 2),
        "lowest_cash_balance_year": results[min(range(len(results)), key=lambda i: results[i]["total_cash"])]["year"] if results else 0,
        "lowest_cash_balance": round(min(r["total_cash"] for r in results), 2) if results else 0,
    }

    return {
        "total_years_simulated": req["user_end_age"] - req["user_start_age"],
        "request": req,
        "metrics": metrics,
        "year_results": results,
        "net_worth_trend": [r["net_worth"] for r in results],
        "cash_trend": [r["total_cash"] for r in results],
        "annual_income_trend": [r["current_gross_income"] for r in results],
    }