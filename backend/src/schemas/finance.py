from typing import Annotated, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ─── HYSA Tiers ───────────────────────────────────────────────────────────────
class Tier(BaseModel):
    threshold: float
    annual_rate: float


# ─── Bank/Liquid Account (Digital/Cash) ──────────────────────────────────────
class LiquidAccount(BaseModel):
    source_type: Literal["liquid"] = "liquid"
    id: str
    name: str
    start_year: int
    end_year: int
    balance: float
    interest_tiers: List[Tier]  # positive = HYSA, near-zero/negative = cash inflation loss


# ─── Job / Side Hustle ────────────────────────────────────────────────────────
class IncomeSource(BaseModel):
    source_type: Literal["income"] = "income"
    id: str
    name: str
    start_year: int
    end_year: int
    net_income: float
    income_growth: float


# ─── Asset Sources ────────────────────────────────────────────────────────────
class RentalProperty(BaseModel):
    source_type: Literal["rental"] = "rental"
    id: str
    name: str
    start_year: int
    end_year: int
    purchase_price: float
    down_payment: float
    annual_appreciation: float
    monthly_income: float
    monthly_expenses: float


class StockPortfolio(BaseModel):
    source_type: Literal["stock"] = "stock"
    id: str
    name: str
    start_year: int
    end_year: int
    initial_value: float
    annual_return: float
    monthly_contribution: float
    dividend_yield: float


AssetSource = Annotated[
    Union[RentalProperty, StockPortfolio],
    Field(discriminator="source_type")
]


# ─── Expense Source ───────────────────────────────────────────────────────────
class ExpenseSource(BaseModel):
    source_type: Literal["expense"] = "expense"
    id: str
    name: str
    start_year: int
    end_year: int
    annual_expense: float
    expense_growth: float


# ─── Request ──────────────────────────────────────────────────────────────────
class SimulateRequest(BaseModel):
    start_year: int
    end_year: int

    liquid_accounts: List[LiquidAccount] = []
    assets: List[AssetSource] = []
    incomes: List[IncomeSource] = []
    expenses: List[ExpenseSource] = []


# ─── Response ─────────────────────────────────────────────────────────────────
class SourceSnapshot(BaseModel):
    id: str
    name: str
    source_type: str
    asset_value: float
    annual_cashflow: float
    # start/end values for display — populated for income + expense sources
    start_value: Optional[float] = None   # what the source was worth at year start
    end_value: Optional[float] = None     # after growth applied
    sale_proceeds: Optional[float] = None  # asset sale proceeds if sold this year


class SimYearResult(BaseModel):
    year: int
    net_worth: float        # total_cash + all asset values
    total_cash: float       # sum across all liquid accounts
    total_income: float     # sum of all income source cashflows
    total_expenses: float   # sum of all expense source cashflows
    sources: List[SourceSnapshot]