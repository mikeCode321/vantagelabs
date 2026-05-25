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

        self.primary_checking: CheckingAccountSim | None = None

    def get_all_accounts(self) -> List[AccountSimulator]:
        return (self.checking_accounts + self.retirement_accounts)

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

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    results = []
    starting_net_worth = sum(acc.get_balance() for acc in state.get_all_accounts())

    for year_offset in range(0, req["user_end_age"] - req["user_start_age"]):
        current_age = req["user_start_age"] + year_offset
        calendar_year = datetime.now().year + year_offset

        active_checking = [a for a in state.checking_accounts if a.is_active(current_age)]
        active_retirement = [a for a in state.retirement_accounts if a.is_active(current_age)]
        active_salaries = [i for i in state.salary_incomes if i.is_active(current_age)]
        active_hourlies = [i for i in state.hourly_incomes if i.is_active(current_age)]
        active_side = [i for i in state.side_hustle_incomes if i.is_active(current_age)]

        for month in range(12):
            for salary_sim in active_salaries:
                cashflow = salary_sim.process_monthly_payroll() # sub deductions 401k
                state.primary_checking.deposit(cashflow["net_income"])

            for hourly_sim in active_hourlies:
                cashflow = hourly_sim.process_monthly_payroll()
                state.primary_checking.deposit(cashflow["net_income"])

            for side_sim in active_side:
                cashflow = side_sim.process_monthly_payroll()
                state.primary_checking.deposit(cashflow["net_income"])

            # for all expenses
                # withdraw that monthly expense from the checking

            
            # for all loans
                # withdraw that monthly payment from the checking and pay loan 
                # simulation will calculate principal, interest, equity, amortizaiton

            # for all taxable investments 
                # withdraw that from checking and contribute to the taxable investment acc
                # simulate the growth of the acc at process_month_end()

            # for all one time purchases like a house would need special logic 
                # if start year of an asset or liability (car) matches we withdraw that chunk payment from checking 
            
            # for all sales like a house or car
                # if end year matches we sell that asset and deposit to checking 

            # monthly compounding for all accounts
            for account in active_checking + active_retirement: # loans and investments and assets 
                growth = account.process_month_end()
                # Could track growth here if needed

        # ── SNAPSHOTS (before year_end) ───────────────────────────────────────
        checking_account_snapshots = [acc.snapshot() for acc in active_checking]
        retirement_account_snapshots = [acc.snapshot() for acc in active_retirement]
        salary_snapshots = [sim.snapshot() for sim in active_salaries]
        hourly_snapshots = [sim.snapshot() for sim in active_hourlies]
        side_snapshots = [sim.snapshot() for sim in active_side]

        all_income_snapshots = salary_snapshots + hourly_snapshots + side_snapshots

        total_gross_income = sum(s["gross_annual"] for s in all_income_snapshots)
        total_net_income = sum(s["net_annual"] for s in all_income_snapshots)
        year_federal_tax = round(sum(s["taxes"]["federal"] for s in all_income_snapshots), 2)
        year_fica_tax = round(sum(s["taxes"]["fica"] for s in all_income_snapshots), 2)
        year_state_tax = round(sum(s["taxes"]["state"] for s in all_income_snapshots), 2)
        total_year_taxes_paid = round(year_federal_tax + year_fica_tax + year_state_tax, 2)
        effective_tax_rate = (total_year_taxes_paid / total_gross_income * 100) if total_gross_income > 0 else 0

        next_gross_income = (
            sum(s.calculate_growth() for s in active_salaries) +
            sum(h.calculate_growth() for h in active_hourlies)
        ) 

        # ── YEAR END ──────────────────────────────────────────────────────────
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

        # ── AGGREGATE ─────────────────────────────────────────────────────────
        total_cash = sum(acc.get_balance() for acc in active_checking + active_retirement)
        total_net_worth = total_cash  # TODO: subtract liabilities

        if results:
            prev_year_net_worth = results[-1]["net_worth"]
            net_worth_change = total_net_worth - prev_year_net_worth
            net_worth_change_pct = (net_worth_change / prev_year_net_worth * 100) if prev_year_net_worth != 0 else 0
        else:
            net_worth_change = total_net_worth - starting_net_worth
            net_worth_change_pct = (net_worth_change / starting_net_worth * 100) if starting_net_worth != 0 else 0

        accounts_summary = {
            "total_balance": total_cash,
            "total_interest_earned": sum(acc["annual_interest_earned"] for acc in checking_account_snapshots + retirement_account_snapshots),
            "by_variant": {
                "checking": sum(acc["balance"] for acc in checking_account_snapshots),
                "employer_retirement": sum(acc["balance"] for acc in retirement_account_snapshots),
                "taxable_investments": 0.0,
            },
            "accounts": checking_account_snapshots + retirement_account_snapshots,
        }

        incomes_summary = {
            "total_gross_income": total_gross_income,
            "total_net_income": total_net_income,
            "active_sources": len(active_salaries) + len(active_hourlies) + len(active_side),
            "by_variant": {
                "salary": sum(s["gross_annual"] for s in salary_snapshots),
                "hourly": sum(s["gross_annual"] for s in hourly_snapshots),
                "side": sum(s["gross_annual"] for s in side_snapshots),
            },
            "incomes": all_income_snapshots,
        }

        year_result = {
            "year": calendar_year + 1,
            "age": current_age + 1,
            "net_worth": round(total_net_worth, 2),
            "net_worth_change": round(net_worth_change, 2),
            "net_worth_change_percent": round(net_worth_change_pct, 2),
            "total_cash": round(total_cash, 2),
            "income_earned": {
                "gross": round(total_gross_income, 2),
                "net": round(total_net_income, 2),
                "taxes_paid": round(total_year_taxes_paid, 2),
                "federal_tax": round(year_federal_tax, 2),
                "fica_tax": round(year_fica_tax, 2),
                "state_tax": round(year_state_tax, 2),
                "effective_tax_rate": round(effective_tax_rate, 2),
            },
            "current_gross_income": next_gross_income,  # side hustle excluded — no stable forward gross
            "accounts_summary": accounts_summary,
            "incomes_summary": incomes_summary,
        }

        results.append(year_result)

    # ── BUILD FINAL METRICS ───────────────────────────────────────────────────
    metrics = {
        "total_years": len(results),
        "starting_net_worth": round(starting_net_worth, 2),
        "ending_net_worth": round(results[-1]["net_worth"] if results else 0, 2),
        "peak_net_worth": round(max(r["net_worth"] for r in results) if results else 0, 2),
        "peak_net_worth_age": results[max(range(len(results)), key=lambda i: results[i]["net_worth"])]["age"] if results else 0,
        "total_income_lifetime": round(sum(r["income_earned"]["gross"] for r in results), 2),
        "lowest_cash_balance_year": results[min(range(len(results)), key=lambda i: results[i]["total_cash"])]["year"] if results else 0,
        "lowest_cash_balance": round(min(r["total_cash"] for r in results) if results else 0, 2),
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