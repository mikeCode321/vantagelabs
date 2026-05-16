"""
Finance schemas - Frontend-first design
All types and variants match frontend definitions exactly
"""

from typing import Literal, Union
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


# ─────────────────────────────────────────────
# CORE TYPES
# ─────────────────────────────────────────────
class Tier(BaseModel):
    threshold: float = Field(..., ge=0)
    annual_rate: float = Field(..., ge=0, le=1)


# ─────────────────────────────────────────────
# LIQUID ACCOUNTS
# ─────────────────────────────────────────────


class CheckingAccount(BaseModel):
    source_type: Literal["liquid"] = "liquid"
    variant: Literal["checking"] = "checking"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    starting_balance: float = Field(..., ge=0)
    interest_tiers: list[Tier] = Field(default_factory=list)

    @field_validator("end_age")
    def end_age_must_be_after_start(cls, v, info):
        if "start_age" in info.data and v < info.data["start_age"]:
            raise ValueError("end_age must be >= start_age")
        return v


class TaxableInvestmentAccount(BaseModel):
    source_type: Literal["liquid"] = "liquid"
    variant: Literal["taxable_investments"] = "taxable_investments"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    starting_balance: float = Field(..., ge=0)

    contribution_mode: Literal["dollar", "percentage"] = "dollar"

    monthly_contribution: float = Field(default=0, ge=0)

    contribution_percentage: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    expected_return: float = Field(
        default=0.07,
        ge=-1,
        le=1,
    )

    dividend_yield: float = Field(
        default=0.02,
        ge=0,
        le=1,
    )

    dividend_reinvestment: Literal[
        "drip",
        "cash_out",
    ] = "drip"

    linked_income_id: str | None = None


class EmployerRetirementAccount(BaseModel):
    source_type: Literal["liquid"] = "liquid"
    variant: Literal["employer_retirement"] = "employer_retirement"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    starting_balance: float = Field(..., ge=0)

    contribution_mode: Literal["dollar", "percentage"] = "dollar"

    monthly_contribution: float = Field(default=0, ge=0)

    contribution_percentage: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    expected_return: float = Field(
        default=0.07,
        ge=-1,
        le=1,
    )

    dividend_yield: float = Field(
        default=0.02,
        ge=0,
        le=1,
    )

    dividend_reinvestment: Literal[
        "drip",
        "cash_out",
    ] = "drip"

    employer_match: float = Field(
        default=0.05,
        ge=0,
        le=1,
    )

    linked_income_id: str | None = None


LiquidAccount = Union[
    CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount
]


# ─────────────────────────────────────────────
# INCOME
# ─────────────────────────────────────────────


class SalaryIncome(BaseModel):
    source_type: Literal["income"] = "income"
    variant: Literal["salary"] = "salary"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    gross_income: float = Field(..., gt=0)

    income_growth: float = Field(
        default=0.02,
        ge=-1,
        le=1,
    )

    linked_401k_id: str | None = None


class HourlyWageIncome(BaseModel):
    source_type: Literal["income"] = "income"
    variant: Literal["hourly"] = "hourly"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    hourly_rate: float = Field(..., gt=0)

    hours_per_week: float = Field(
        ...,
        gt=0,
        le=168,
    )

    gross_income: float | None = None

    income_growth: float = Field(
        default=0.02,
        ge=-1,
        le=1,
    )

    linked_401k_id: str | None = None

    def model_post_init(self, __context):
        if self.gross_income is None:
            self.gross_income = (
                self.hourly_rate
                * self.hours_per_week
                * 52
            )


class SideHustleIncome(BaseModel):
    source_type: Literal["income"] = "income"
    variant: Literal["side"] = "side"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int = Field(..., ge=0, le=150)

    gross_income: float = Field(..., gt=0)

    income_growth: float = Field(
        default=0.02,
        ge=-1,
        le=1,
    )

    variability: float = Field(
        default=0.2,
        ge=0,
        le=1,
    )

    frequency: str = Field(default="monthly")

    average_income_per_period: float = Field(..., gt=0)

IncomeSource = Union[SalaryIncome, HourlyWageIncome, SideHustleIncome]


# ─────────────────────────────────────────────
# EXPENSES
# ─────────────────────────────────────────────


class LivingExpense(BaseModel):
    source_type: Literal["expense"] = "expense"
    variant: Literal["living"] = "living"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    monthly_expense: float = Field(..., gt=0)
    expense_growth: float = Field(default=0.02, ge=-1, le=1)


class RentExpense(BaseModel):
    source_type: Literal["expense"] = "expense"
    variant: Literal["rent"] = "rent"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    monthly_expense: float = Field(..., gt=0)
    rent_growth: float = Field(default=0.03, ge=-1, le=1)


class DebtExpense(BaseModel):
    source_type: Literal["expense"] = "expense"
    variant: Literal["debt"] = "debt"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    debt_amount: float = Field(..., gt=0)
    monthly_expense: float = Field(..., gt=0)
    interest_rate: float | None = Field(default=None, ge=0, le=1)


class HouseLoanExpense(BaseModel):
    source_type: Literal["expense"] = "expense"
    variant: Literal["house_loan"] = "house_loan"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    linked_asset_id: str | None = None

    monthly_expense: float = Field(..., gt=0)
    original_principal: float = Field(..., gt=0)
    interest_rate: float = Field(default=0.0675, ge=0, le=1)
    loan_term_years: int = Field(default=30, gt=0)


class CarLoanExpense(BaseModel):
    source_type: Literal["expense"] = "expense"
    variant: Literal["car_loan"] = "car_loan"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    linked_asset_id: str | None = None

    monthly_expense: float = Field(..., gt=0)
    original_principal: float = Field(..., gt=0)
    interest_rate: float = Field(default=0.072, ge=0, le=1)
    loan_term_years: int = Field(default=5, gt=0)


ExpenseSource = Union[
    LivingExpense,
    RentExpense,
    DebtExpense,
    HouseLoanExpense,
    CarLoanExpense,
]


# ─────────────────────────────────────────────
# ASSETS
# ─────────────────────────────────────────────


class HouseAsset(BaseModel):
    source_type: Literal["asset"] = "asset"
    variant: Literal["house"] = "house"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    asset_value: float = Field(..., gt=0)
    annual_appreciation: float = Field(default=0.03, ge=-1, le=1)
    down_payment: float | None = Field(default=None, ge=0)

    linked_loan_id: str | None = None


class CarAsset(BaseModel):
    source_type: Literal["asset"] = "asset"
    variant: Literal["car"] = "car"

    id: str
    name: str

    start_age: int = Field(..., ge=0, le=150)
    end_age: int | None = Field(default=None)

    asset_value: float = Field(..., gt=0)
    annual_depreciation: float = Field(default=0.12, ge=0, le=1)
    down_payment: float | None = Field(default=None, ge=0)

    linked_loan_id: str | None = None


AssetSource = Union[HouseAsset, CarAsset]

# ─────────────────────────────────────────────
# PAYLOAD GROUPING TYPES
# ─────────────────────────────────────────────

class AccountsPayload(BaseModel):
    checking: list[CheckingAccount] = Field(
        default_factory=list
    )

    taxable_investments: list[
        TaxableInvestmentAccount
    ] = Field(default_factory=list)

    employer_retirement: list[
        EmployerRetirementAccount
    ] = Field(default_factory=list)


class IncomesPayload(BaseModel):
    salary: list[SalaryIncome] = Field(
        default_factory=list
    )

    hourly: list[HourlyWageIncome] = Field(
        default_factory=list
    )

    side: list[SideHustleIncome] = Field(
        default_factory=list
    )


class ExpensesPayload(BaseModel):
    living: list[LivingExpense] = Field(
        default_factory=list
    )

    rent: list[RentExpense] = Field(
        default_factory=list
    )

    house_loan: list[HouseLoanExpense] = Field(
        default_factory=list
    )

    car_loan: list[CarLoanExpense] = Field(
        default_factory=list
    )

    debt: list[DebtExpense] = Field(
        default_factory=list
    )


class AssetsPayload(BaseModel):
    house: list[HouseAsset] = Field(
        default_factory=list
    )

    car: list[CarAsset] = Field(
        default_factory=list
    )


# ─────────────────────────────────────────────
# REQUEST
# ─────────────────────────────────────────────


class SimulateRequest(BaseModel):
    user_start_age: int = Field(
        ...,
        ge=0,
        le=150,
    )

    user_end_age: int = Field(
        ...,
        ge=0,
        le=150,
    )

    start_year: int = Field(
        default_factory=lambda: datetime.now().year
    )

    filing_status: Literal[
        "single",
        "married_filing_jointly",
        "head_of_household",
    ]

    state: str | None = None

    accounts: AccountsPayload = Field(
        default_factory=AccountsPayload
    )

    incomes: IncomesPayload = Field(
        default_factory=IncomesPayload
    )

    expenses: ExpensesPayload = Field(
        default_factory=ExpensesPayload
    )

    assets: AssetsPayload = Field(
        default_factory=AssetsPayload
    )

    @field_validator("user_end_age")
    def end_age_must_be_after_start(
        cls,
        v,
        info,
    ):
        if (
            "user_start_age" in info.data
            and v < info.data["user_start_age"]
        ):
            raise ValueError(
                "user_end_age must be >= user_start_age"
            )

        return v
    
# ─────────────────────────────────────────────
# RESPONSE TYPES
# ─────────────────────────────────────────────


class AccountSnapshot(BaseModel):
    id: str
    name: str
    variant: Literal["checking", "taxable_investments", "employer_retirement"]

    balance: float
    annual_interest_earned: float
    growth_rate: float

    balance_history: list[float] = Field(default_factory=list)
    interest_history: list[float] = Field(default_factory=list)


class IncomeSnapshot(BaseModel):
    id: str
    name: str
    variant: Literal["salary", "hourly", "side"]

    # NEW: Tax breakdown
    gross_annual: float  # before taxes
    federal_tax: float
    fica_tax: float  # Social Security + Medicare
    state_tax: float
    total_tax: float  # sum of above
    net_annual: float

    growth_rate: float
    start_value: float
    end_value: float

    is_active: bool


class ExpenseSnapshot(BaseModel):
    id: str
    name: str
    variant: Literal["living", "rent", "debt", "house_loan", "car_loan"]

    annual_expense: float
    annual_cashflow: float  # negative
    growth_rate: float

    start_value: float
    end_value: float

    remaining_balance: float | None = None
    interest_paid: float | None = None


class AssetSnapshot(BaseModel):
    id: str
    name: str
    variant: Literal["house", "car"]

    current_value: float
    annual_appreciation_rate: float
    annual_cashflow: float

    was_sold: bool = False
    sale_proceeds: float | None = None

    value_history: list[float] = Field(default_factory=list)


class LiquidAccountsSummary(BaseModel):
    total_balance: float
    total_interest_earned: float
    by_variant: dict[str, float]
    accounts: list[AccountSnapshot]


class IncomesSummary(BaseModel):
    total_annual_income: float
    total_cashflow: float
    active_sources: int
    by_variant: dict[str, float]
    incomes: list[IncomeSnapshot]


class ExpensesSummary(BaseModel):
    total_annual_expenses: float
    total_cashflow: float
    by_variant: dict[str, float]
    expenses: list[ExpenseSnapshot]


class AssetsSummary(BaseModel):
    total_asset_value: float
    total_appreciation_rate: float
    liquidated_count: int
    assets: list[AssetSnapshot]


class SimYearResult(BaseModel):
    year: int
    age: int

    net_worth: float
    net_worth_change: float
    net_worth_change_percent: float

    total_cash: float
    total_assets: float

    total_income: float
    total_expenses: float
    net_cashflow: float

    total_taxes_paid: float
    total_federal_tax: float
    total_fica_tax: float
    total_state_tax: float

    effective_tax_rate: float  # total_taxes / total_gross_income

    accounts_summary: LiquidAccountsSummary
    incomes_summary: IncomesSummary
    expenses_summary: ExpensesSummary
    assets_summary: AssetsSummary


class SimulationMetrics(BaseModel):
    total_years: int
    starting_net_worth: float
    ending_net_worth: float
    peak_net_worth: float
    peak_net_worth_age: int

    total_income_lifetime: float
    total_expenses_lifetime: float
    net_lifetime_cashflow: float

    years_with_negative_cashflow: int
    lowest_cash_balance_year: int
    lowest_cash_balance: float


class SimulationResult(BaseModel):
    request: SimulateRequest

    metrics: SimulationMetrics
    years: list[SimYearResult]

    net_worth_trend: list[float]
    cash_trend: list[float]
    assets_trend: list[float]
    annual_income_trend: list[float]
    annual_expenses_trend: list[float]
