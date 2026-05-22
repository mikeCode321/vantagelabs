from typing import Dict, List, Protocol
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from schemas.finance import (
    SimulateRequest,
    Tier,
    CheckingAccount,
    EmployerRetirementAccount,
    SalaryIncome,
    LiquidAccountsSummary,
    IncomesSummary,
    SimYearResult,
    SimulationMetrics,
    SimulationResult,
)
from services.tax import TaxService

# ═══════════════════════════════════════════════════════════════════════════
# PROTOCOLS & INTERFACES
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class MonthlyGrowth:
    """Results from a single month's compounding"""
    interest_earned: float = 0.0
    dividends_earned: float = 0.0
    dividend_cashout: float = 0.0  # Non-reinvested dividends


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
    def process_month_end(self) -> MonthlyGrowth:
        """
        Calculate and apply monthly interest/growth.
        Returns growth details for tracking.
        """
        pass

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
        return self.start_age <= age <= self.end_age


@dataclass
class CashflowResult:
    """Results from processing income for a pay period"""
    gross_amount: float
    pre_tax_deductions: float  # 401k contributions
    taxable_income: float
    taxes_paid: float
    net_income: float  # What hits checking account

    # Tax breakdown
    federal_tax: float = 0.0
    fica_tax: float = 0.0
    state_tax: float = 0.0


# ═══════════════════════════════════════════════════════════════════════════
# INTEREST CALCULATOR
# ═══════════════════════════════════════════════════════════════════════════


class InterestCalculator:
    """Handles tiered and basic interest calculations"""

    def __init__(self, tiers: List[Tier]):
        self.tiers = tiers

    def calculate_monthly_interest(self, balance: float) -> float:
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
    def calculate_monthly_return(balance: float,
                                 annual_return: float) -> float:
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
        self.total_interest_earned = 0.0
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
        interest = self.interest_calculator.calculate_monthly_interest(self.balance)
        interest = round(interest, 2)

        self.balance += interest
        self.total_interest_earned += interest

        # Record history
        self.monthly_interest_history.append(interest)
        self.monthly_balance_history.append(round(self.balance, 2))

        # return MonthlyGrowth(interest_earned=interest)
        return {
            "balance": self.balance,
            "interest_earned": self.total_interest_earned,
            "monthly_balance_history": self.monthly_balance_history,
            "monthly_interest_history": self.monthly_interest_history
        }

    def process_year_end(self):
        self.total_interest_earned = 0.0
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
            "annual_interest_earned": round(self.total_interest_earned, 2),
            "balance_history": self.monthly_balance_history,
            "interest_history": self.monthly_interest_history,
        }


checking_acc = {
    "source_type":
    "liquid",
    "variant":
    "checking",
    "id":
    "chk_1",
    "name":
    "Checking",
    "start_age":
    27,
    "end_age":
    30,
    "starting_balance":
    12000,
    "interest_tiers": [{
        "threshold": 15000,
        "annual_rate": 0.00
    }, {
        "threshold": 100000,
        "annual_rate": 0.03
    }, {
        "threshold": 300000,
        "annual_rate": 0.04
    }]
}
import json
# sim = CheckingAccountSim(CheckingAccount(**checking_acc))
# for month in range(12):
#     sim.deposit(1000)
#     res = sim.process_month_end()
#     if month == 11:
#         print(json.dumps(res, indent=2))
# print(json.dumps(sim.snapshot(), indent=2))


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
        self.employer_match = account["employer_match"]
        self.contribution_mode = account["contribution_mode"]
        self.contribution_percentage = account["contribution_percentage"]
        self.monthly_contribution_fixed = account["monthly_contribution"]
        self.linked_income_id = account["linked_income_id"]

        # Tracking
        self.total_interest_earned = 0.0
        self.total_employee_contributions = 0.0
        self.total_employer_contributions = 0.0
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
        self.total_employee_contributions += amount

    def contribute_employer(self, employee_amount: float):
        match_amount = employee_amount * self.employer_match
        self.deposit(match_amount)
        self.total_employer_contributions += match_amount

    def withdraw(self, amount: float):
        self.balance = max(0, self.balance - amount)

    def process_month_end(self):
        interest = round(InterestCalculator.calculate_monthly_return(self.balance, self.expected_return), 2)

        self.balance += interest
        self.total_interest_earned += interest

        # Record history
        self.monthly_interest_history.append(interest)
        self.monthly_balance_history.append(round(self.balance, 2))

        # return MonthlyGrowth(interest_earned=interest)
        return {
            "balance": round(self.balance, 2),
            "interest_earned": self.total_interest_earned,
            "monthly_balance_history": self.monthly_balance_history,
            "monthly_interest_history": self.monthly_interest_history,
        }
    
    def process_year_end(self):
        self.total_interest_earned = 0.0
        self.total_employee_contributions = 0.0
        self.total_employer_contributions = 0.0
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
            "annual_interest_earned": round(self.total_interest_earned, 2),
            "total_employee_contributions": round(self.total_employee_contributions, 2),
            "total_employer_contributions": round(self.total_employer_contributions, 2),
            "balance_history": self.monthly_balance_history,
            "interest_history": self.monthly_interest_history,
        }


# acc_401k = {
#     "source_type": "liquid",
#     "variant": "employer_retirement",
#     "id": "ret_1",
#     "name": "401k",
#     "start_age": 27,
#     "end_age": 30,
#     "starting_balance": 18000,
#     "contribution_mode": "percentage",
#     "monthly_contribution": 0,
#     "contribution_percentage": 0.1,
#     "expected_return": 0.07,
#     "dividend_yield": 0.02,
#     "dividend_reinvestment": "drip",
#     "employer_match": 0.05,
#     "linked_income_id": "salary_1"
# }

# acc_sim = EmployerRetirementAccountSim(EmployerRetirementAccount(**acc_401k))

# monthly_employee_contribution = acc_sim.calculate_employee_contribution(145000) / 12
# print("Employee contr: ", monthly_employee_contribution)
# for month in range(12):
#     acc_sim.contribute_employee(monthly_employee_contribution)
#     acc_sim.contribute_employer(monthly_employee_contribution)
#     res = acc_sim.process_month_end()
#     if month == 11:
#         print(json.dumps(res, indent=2))
# print(json.dumps(acc_sim.snapshot(), indent=2))

# ═══════════════════════════════════════════════════════════════════════════
# INCOME SIMULATORS
# ═══════════════════════════════════════════════════════════════════════════


class SalaryIncomeSim:

    def __init__(self, income: SalaryIncome, retirement_account: EmployerRetirementAccountSim = None):
        self._id = income["id"]
        self._variant = income["variant"]
        self.name = income["name"]
        self.start_age = income["start_age"]
        self.end_age = income["end_age"]

        # Income configuration
        self.gross_annual = income["gross_income"]
        self.income_growth = income["income_growth"]

        # Linked accounts
        self.retirement_account = retirement_account
        self.tax_service = TaxService("single", "MI")

        # State tracking
        self.current_gross_annual = self.gross_annual
        self.current_net_annual = self._calculate_net_annual_income()
        self.total_gross_earned = 0.0
        self.total_taxes_paid = 0.0
        self.total_net_received = 0.0

        # Annual tax tracking (reset each year)
        self.annual_federal_tax = 0.0
        self.annual_fica_tax = 0.0
        self.annual_state_tax = 0.0
        self.annual_401k_contributions = 0.0

    @property
    def id(self) -> str:
        return self._id

    @property
    def variant(self) -> str:
        return self._variant

    def is_active(self, age: int) -> bool:
        return self.start_age <= age <= self.end_age

    def _calculate_net_annual_income(self) -> float:
        monthly_gross = self._calculate_monthly_gross()
        monthly_retirement = self._calculate_retirement_contribution(monthly_gross)
        monthly_taxes = self._calculate_monthly_taxes(annual_401k=monthly_retirement * 12)
        monthly_net = (monthly_gross - monthly_retirement - monthly_taxes["total"])
        return round(monthly_net * 12, 2)

    def _calculate_monthly_gross(self):
        return self.current_gross_annual / 12

    def _calculate_monthly_taxes(self, annual_401k):
        taxes = self.tax_service.calculate_income_taxes(
            gross_income=self.current_gross_annual,
            pre_tax_deductions=annual_401k,
        )

        return {
            "federal": taxes.federal / 12,
            "fica": taxes.fica / 12,
            "state": taxes.state / 12,
            "total": taxes.total / 12,
        }

    def _apply_retirement_contribution(self, contribution):
        if not self.retirement_account:
            return

        self.retirement_account.contribute_employee(contribution)
        self.retirement_account.contribute_employer(contribution)

        self.annual_401k_contributions += contribution

    def _calculate_retirement_contribution(self, monthly_gross):
        if not self.retirement_account:
            return 0.0

        return self.retirement_account.calculate_employee_contribution(monthly_gross)

    def process_monthly_payroll(self) -> dict:
        monthly_gross = self._calculate_monthly_gross()
        retirement_contribution = self._calculate_retirement_contribution(monthly_gross)
        self._apply_retirement_contribution(retirement_contribution)
        taxes = self._calculate_monthly_taxes(annual_401k=retirement_contribution * 12)

        # TODO: add to other helper functions 
        taxable_income = monthly_gross - retirement_contribution
        monthly_net = taxable_income - taxes["total"]

        self.total_gross_earned += monthly_gross
        self.total_net_received += monthly_net
        self.total_taxes_paid += taxes["total"]

        self.annual_federal_tax += taxes["federal"]
        self.annual_fica_tax += taxes["fica"]
        self.annual_state_tax += taxes["state"]

        return {
            "gross_income": round(monthly_gross, 2),
            "taxable_income": round(taxable_income, 2),
            "retirement_contribution": round(retirement_contribution, 2),
            "net_income": round(monthly_net, 2),
            "taxes": taxes,
        }
        # return CashflowResult()

    def apply_growth(self) -> None:
        """Apply annual salary increase for the next year"""
        self.current_gross_annual *= (1 + self.income_growth)
        self.current_net_annual = self._calculate_net_annual_income()

    def reset_annual_tracking(self) -> None:
        """Reset annual tracking after capturing year-end snapshot"""
        self.annual_federal_tax = 0.0
        self.annual_fica_tax = 0.0
        self.annual_state_tax = 0.0
        self.annual_401k_contributions = 0.0

    def process_year_end(self) -> None:
        """Apply annual salary increase and reset tracking"""
        self.apply_growth()
        self.reset_annual_tracking()

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

# acc = {
#     "source_type": "liquid",
#     "variant": "employer_retirement",
#     "id": "ret_1",
#     "name": "401k",
#     "start_age": 27,
#     "end_age": 30,
#     "starting_balance": 18000,
#     "contribution_mode": "percentage",
#     "monthly_contribution": 0,
#     "contribution_percentage": 0.1,
#     "expected_return": 0.07,
#     "dividend_yield": 0.02,
#     "dividend_reinvestment": "drip",
#     "employer_match": 0.05,
#     "linked_income_id": "salary_1"
# }
# acc_sim = EmployerRetirementAccountSim(EmployerRetirementAccount(**acc))
# job_sim = SalaryIncomeSim(SalaryIncome(**job), acc_sim)

# for month in range(12):
#     job_sim.process_monthly_payroll()
#     acc_sim.process_month_end()

# print(json.dumps(job_sim.snapshot(), indent=2))
# print(json.dumps(acc_sim.snapshot(), indent=2))
# job_sim.process_year_end()

# ═══════════════════════════════════════════════════════════════════════════
# SIMULATION COORDINATOR
# ═══════════════════════════════════════════════════════════════════════════


class SimulationState:
    """Organized simulation state with typed collections"""

    def __init__(self):
        self.checking_accounts: List[CheckingAccountSim] = []
        self.retirement_accounts: List[EmployerRetirementAccountSim] = []
        self.salary_incomes: List[SalaryIncomeSim] = []

        self.primary_checking: CheckingAccountSim | None = None

    def get_all_accounts(self) -> List[AccountSimulator]:
        return (self.checking_accounts + self.retirement_accounts)

    def get_account_by_id(self, account_id: str) -> AccountSimulator | None:
        for account in self.get_all_accounts():
            if account.id == account_id:
                return account
        return None


def simulate(req):
    state = SimulationState()

    for acc in req["accounts"]["checking"]:
        checking_sim = CheckingAccountSim(acc)
        state.checking_accounts.append(checking_sim)

        # First checking account is primary by default for now
        if state.primary_checking is None:
            state.primary_checking = checking_sim

    retirement_by_id = {}
    for acc in req["accounts"]["employer_retirement"]:
        retirement_sim = EmployerRetirementAccountSim(acc)
        state.retirement_accounts.append(retirement_sim)
        retirement_by_id[acc["id"]] = retirement_sim

    for income in req["incomes"]["salary"]:

        linked_retirement = None
        if income["linked_401k_id"]:
            linked_retirement = retirement_by_id.get(income["linked_401k_id"])

        salary_sim = SalaryIncomeSim(income=income,
                                     retirement_account=linked_retirement)
        state.salary_incomes.append(salary_sim)

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    results = []
    starting_net_worth = sum(acc.get_balance() for acc in state.get_all_accounts())

    for year_offset in range(1, req["user_end_age"] - req["user_start_age"] + 1):
        print(year_offset)

        current_age = req["user_start_age"] + year_offset
        calendar_year = 2025 + year_offset

        # active entities for this year
        active_checking = [ a for a in state.checking_accounts if a.is_active(current_age) ]
        active_retirement = [ a for a in state.retirement_accounts if a.is_active(current_age) ]
        active_salaries = [ i for i in state.salary_incomes if i.is_active(current_age) ]

        year_taxes_paid = 0.0
        year_federal_tax = 0.0
        year_fica_tax = 0.0
        year_state_tax = 0.0

        for month in range(12):
            for salary_sim in active_salaries:
                cashflow = salary_sim.process_monthly_payroll()
                # print(json.dumps(cashflow, indent=2))
                state.primary_checking.deposit(cashflow["net_income"])

            # monthly compounding for all accounts
            for account in active_checking + active_retirement:
                growth = account.process_month_end()
                # Could track growth here if needed

        # Apply income growth BEFORE capturing year result (to show next year's starting values)
        for salary_sim in active_salaries:
            salary_sim.apply_growth()

        # Capture year-end values (with accumulated taxes and next year's income)
        total_gross_income = sum(sim.current_gross_annual for sim in active_salaries)
        year_federal_tax = round(sum(salary.snapshot()["taxes"]["federal"] for salary in active_salaries), 2)
        year_fica_tax = round(sum(salary.snapshot()["taxes"]["fica"] for salary in active_salaries), 2)
        year_state_tax = round(sum(salary.snapshot()["taxes"]["state"] for salary in active_salaries), 2)
        year_taxes_paid = round(year_federal_tax + year_fica_tax + year_state_tax, 2)
        
        total_cash = sum(acc.get_balance() for acc in active_checking)
        total_net_worth = sum(acc.get_balance() for acc in active_checking + active_retirement) # TODO: subtract liabilities
        
        print(round(year_federal_tax, 2), round(year_fica_tax, 2), round(year_state_tax, 2), round(year_taxes_paid, 2))
    
        account_snapshots = [acc.snapshot() for acc in active_checking + active_retirement]
        income_snapshots = [sim.snapshot() for sim in active_salaries]

        # Net worth change
        if results:
            prev_year_net_worth = results[-1]["net_worth"]
            net_worth_change = total_net_worth - prev_year_net_worth
            net_worth_change_pct = (net_worth_change / prev_year_net_worth * 100) if prev_year_net_worth != 0 else 0
        else:
            net_worth_change = total_net_worth - starting_net_worth
            net_worth_change_pct = (net_worth_change / starting_net_worth * 100) if starting_net_worth != 0 else 0

        effective_tax_rate = (year_taxes_paid / total_gross_income * 100) if total_gross_income > 0 else 0

        accounts_summary = {
            "total_balance": total_cash,
            "total_interest_earned": sum( s.get("annual_interest_earned", 0) for s in account_snapshots ),
            "by_variant": {
                "checking": sum(checking_acc.snapshot()["balance"] for checking_acc in active_checking), # Store snapshots for all variants instead of calling .snapshot() multiple times print(json.dumps(sum([acc['balance'] for acc in account_snapshots]),indent=2))
                "employer_retirement": sum(retirement_acc.snapshot()["balance"] for retirement_acc in active_retirement),
                "taxable_investments": 0.0,
            },
            "accounts": account_snapshots,
        }

        incomes_summary = {
            "total_annual_income": total_gross_income,
            "total_cashflow": sum(s["net_annual"] for s in income_snapshots),
            "active_sources": len(active_salaries),
            "by_variant": {
                "salary": sum(salary.snapshot()["gross_annual"] for salary in active_salaries),
                "hourly": 0.0,
                "side": 0.0,
            },
            "incomes": income_snapshots,
        }

        year_result = {
            "year": calendar_year,
            "age": current_age,
            "net_worth": round(total_net_worth, 2),
            "net_worth_change": round(net_worth_change, 2),
            "net_worth_change_percent": round(net_worth_change_pct, 2),
            "total_cash": round(total_cash, 2),
            "total_income": round(total_gross_income, 2),
            "total_taxes_paid": round(year_taxes_paid, 2),
            "total_federal_tax": round(year_federal_tax, 2),
            "total_fica_tax": round(year_fica_tax, 2),
            "total_state_tax": round(year_state_tax, 2),
            "effective_tax_rate": round(effective_tax_rate, 2),
            "accounts_summary": accounts_summary,
            "incomes_summary": incomes_summary,
        }

        results.append(year_result)

        # Reset annual tracking for next year
        for salary_sim in active_salaries:
            salary_sim.reset_annual_tracking()

        for acc_sim in active_checking:
            acc_sim.process_year_end()

        for acc_sim in active_retirement:
            acc_sim.process_year_end()

    # ── BUILD FINAL METRICS ───────────────────────────────────────────────────
    metrics = {
        "total_years": len(results),
        "starting_net_worth": round(starting_net_worth, 2),
        "ending_net_worth": round(results[-1]["net_worth"] if results else 0, 2),
        "peak_net_worth": round( max(r["net_worth"] for r in results) if results else 0, 2),
        "peak_net_worth_age": results[max(range(len(results)), key = lambda i: results[i]["net_worth"])]["age"] if results else 0,
        "total_income_lifetime": round(sum(r["total_income"] for r in results), 2),
        # "total_expenses_lifetime": round(sum(r["total_expenses"] for r in results), 2),
        # "net_lifetime_cashflow": round(sum(r["net_income"] for r in results), 2),
        # "years_with_negative_cashflow": sum(1 for r in results if r["net_income"] < 0),
        "lowest_cash_balance_year": results[min(range(len(results)), key = lambda i: results[i]["total_cash"])]["year"] if results else 0,
        "lowest_cash_balance": round( min(r["total_cash"] for r in results) if results else 0, 2),
    }

    net_worth_trend = [r["net_worth"] for r in results]
    cash_trend = [r["total_cash"] for r in results]
    # assets_trend = [r["total_assets"] for r in results]
    annual_income_trend = [r["total_income"] for r in results]
    # annual_expenses_trend = [r["total_expenses"] for r in results]

    print(json.dumps({
        "total_years_simulated": req["user_end_age"] - req["user_start_age"],
        "request": req,
        "metrics": metrics,
        "year_results": results,
        "net_worth_trend": net_worth_trend,
        "cash_trend": cash_trend,
        "annual_income_trend": annual_income_trend,
    },indent=2))
    return
    return {
        "total_years_simulated": req["user_end_age"] - req["user_start_age"],
        "request": req,
        "metrics": metrics,
        "year_results": results,
        "net_worth_trend": net_worth_trend,
        "cash_trend": cash_trend,
        "annual_income_trend": annual_income_trend,
    }



# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    req = {
        "user_start_age": 25,
        "user_end_age": 27,
        "filing_status": "single",
        "state": "MI",
        "accounts": {
            "checking": [{
                "source_type":
                "liquid",
                "variant":
                "checking",
                "id":
                "acc_1",
                "name":
                "Checking Account",
                "start_age":
                25,
                "end_age":
                27,
                "starting_balance":
                10000,
                "interest_tiers": [{
                    "threshold": 15000,
                    "annual_rate": 0.0
                }, {
                    "threshold": 100000,
                    "annual_rate": 0.03
                }, {
                    "threshold": 300000,
                    "annual_rate": 0.04
                }]
            }],
            "taxable_investments": [],
            "employer_retirement": [{
                "source_type": "liquid",
                "variant": "employer_retirement",
                "id": "401k_1",
                "name": "salary 401",
                "start_age": 25,
                "end_age": 27,
                "starting_balance": 0,
                "contribution_mode": "percentage",
                "monthly_contribution": 833.33,
                "contribution_percentage": 0.10,
                "expected_return": 0.1,
                "employer_match": 0.05,
                "linked_income_id": "salary_1"
            }]
        },
        "incomes": {
            "salary": [{
                "id": "salary_1",
                "source_type": "income",
                "variant": "salary",
                "name": "Software Engineer",
                "start_age": 25,
                "end_age": 27,
                "gross_income": 100000,
                "income_growth": 0.03,
                "linked_401k_id": "401k_1",
            }],
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

    result = simulate(req)
    # print(json.dumps(result, indent=2))
    # print(f"Simulation complete: {result['total_years_simulated']} years")