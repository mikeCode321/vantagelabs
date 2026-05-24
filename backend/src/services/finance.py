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
        self.current_gross_annual = self.gross_annual

        # Linked accounts
        self.retirement_account = retirement_account
        self.tax_service = TaxService("single", "MI")

        # ═══════════════════════════════════════════════════════════
        # CALCULATE ANNUAL VALUES ONCE (not running totals for now) 
        # ═══════════════════════════════════════════════════════════
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

    def calculate_growth(self):
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


def simulate(req: SimulateRequest):
    req = req.model_dump()
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

        salary_sim = SalaryIncomeSim(income=income, retirement_account=linked_retirement)
        state.salary_incomes.append(salary_sim)

    # ── SIMULATION LOOP ───────────────────────────────────────────────────────
    results = []
    starting_net_worth = sum(acc.get_balance() for acc in state.get_all_accounts()) # TODO: sub liabilites
    
    for year_offset in range(0, req["user_end_age"] - req["user_start_age"]):
        current_age = req["user_start_age"] + year_offset # 25 + 0,1,2 = 25,26,27
        calendar_year = datetime.now().year + year_offset # 2026 + 0,1,2 = 2026,2027,2028

        # active entities for this year
        active_checking = [a for a in state.checking_accounts if a.is_active(current_age)]
        active_retirement = [a for a in state.retirement_accounts if a.is_active(current_age)]
        active_salaries = [i for i in state.salary_incomes if i.is_active(current_age)]

        for month in range(12):
            for salary_sim in active_salaries:
                cashflow = salary_sim.process_monthly_payroll() # sub deductions 401k
                state.primary_checking.deposit(cashflow["net_income"])

            # for all one time purchases like a house would need special logic 
                # if start year of an asset or liability (car) matches we withdraw that chunk payment from checking 
            
            # for all sales like a house or car
                # if end year matches we sell that asset and deposit to checking 

            # for all loans
                # withdraw that monthly payment from the checking and pay loan 
                # simulation will calculate principal, interest, equity, amortizaiton

            # for all expenses
                # withdraw that monthly expense from the checking
             
            # monthly compounding for all accounts
            for account in active_checking + active_retirement: # loans and investments and assets 
                growth = account.process_month_end()
                # Could track growth here if needed

        checking_account_snapshots = [acc.snapshot() for acc in active_checking]
        retirement_account_snapshots = [acc.snapshot() for acc in active_retirement]
        salary_snapshots = [sim.snapshot() for sim in active_salaries]  

        total_gross_salary_income = sum(salary["gross_annual"] for salary in salary_snapshots)  
        total_net_salary_income = sum(salary["net_annual"] for salary in salary_snapshots)

        year_federal_tax_salary = round(sum(salary["taxes"]["federal"] for salary in salary_snapshots), 2)
        year_fica_tax_salary = round(sum(salary["taxes"]["fica"] for salary in salary_snapshots), 2)
        year_state_tax_salary = round(sum(salary["taxes"]["state"] for salary in salary_snapshots), 2)
        total_year_taxes_paid_salary = round(year_federal_tax_salary + year_fica_tax_salary + year_state_tax_salary, 2)
        effective_tax_rate = (total_year_taxes_paid_salary / total_gross_salary_income * 100) if total_gross_salary_income > 0 else 0

        total_cash = sum(acc.get_balance() for acc in active_checking + active_retirement)
        total_net_worth = sum(acc.get_balance() for acc in active_checking + active_retirement) # TODO: later - subtract liabilities

        if results:
            prev_year_net_worth = results[-1]["net_worth"]
            net_worth_change = total_net_worth - prev_year_net_worth
            net_worth_change_pct = (net_worth_change / prev_year_net_worth * 100) if prev_year_net_worth != 0 else 0
        else:
            net_worth_change = total_net_worth - starting_net_worth
            net_worth_change_pct = (net_worth_change / starting_net_worth * 100) if starting_net_worth != 0 else 0


        accounts_summary = {
            "total_balance": total_cash,
            "total_interest_earned": sum(acc["annual_interest_earned"] for acc in checking_account_snapshots + retirement_account_snapshots),#this works for now bc both return types contain "annual_interest_earned" keys
            "by_variant": {
                "checking": sum(acc["balance"] for acc in checking_account_snapshots),
                "employer_retirement": sum(acc["balance"] for acc in retirement_account_snapshots),
                "taxable_investments": 0.0,
            },
            "accounts": checking_account_snapshots + retirement_account_snapshots,
        }

        incomes_summary = {
            "total_gross_income": total_gross_salary_income,
            "total_net_income": sum(s["net_annual"] for s in salary_snapshots),
            "active_sources": len(active_salaries),
            "by_variant": {
                "salary": total_gross_salary_income,
                "hourly": 0.0,
                "side": 0.0,
            },
            "incomes": salary_snapshots,
        }

        year_result = {
            "year": calendar_year + 1,
            "age": current_age + 1,
            "net_worth": round(total_net_worth, 2),
            "net_worth_change": round(net_worth_change, 2),
            "net_worth_change_percent": round(net_worth_change_pct, 2),
            "total_cash": round(total_cash, 2),
            "income_earned": {
                "gross": round(total_gross_salary_income, 2),
                "net": round(total_net_salary_income, 2),
                "taxes_paid": round(total_year_taxes_paid_salary, 2),
                "federal_tax": round(year_federal_tax_salary, 2),
                "fica_tax": round(year_fica_tax_salary, 2),
                "state_tax": round(year_state_tax_salary, 2),
                "effective_tax_rate": round(effective_tax_rate, 2),
            },
            "current_gross_income": sum(salary.calculate_growth() for salary in active_salaries),
            "accounts_summary": accounts_summary,
            "incomes_summary": incomes_summary,
        }

        results.append(year_result)

        for salary_sim in active_salaries:
            salary_sim.process_year_end()

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
        "total_income_lifetime": round(sum(r["income_earned"]["gross"] for r in results), 2),
        # "total_expenses_lifetime": round(sum(r["total_expenses"] for r in results), 2),
        # "net_lifetime_cashflow": round(sum(r["net_income"] for r in results), 2),
        # "years_with_negative_cashflow": sum(1 for r in results if r["net_income"] < 0),
        "lowest_cash_balance_year": results[min(range(len(results)), key = lambda i: results[i]["total_cash"])]["year"] if results else 0,
        "lowest_cash_balance": round( min(r["total_cash"] for r in results) if results else 0, 2),
    }

    net_worth_trend = [r["net_worth"] for r in results]
    cash_trend = [r["total_cash"] for r in results]
    # assets_trend = [r["total_assets"] for r in results]
    annual_income_trend = [r["current_gross_income"] for r in results]
    # annual_expenses_trend = [r["total_expenses"] for r in results]

    return {
        "total_years_simulated": req["user_end_age"] - req["user_start_age"],
        "request": req,
        "metrics": metrics,
        "year_results": results,
        "net_worth_trend": net_worth_trend,
        "cash_trend": cash_trend,
        "annual_income_trend": annual_income_trend,
    }
