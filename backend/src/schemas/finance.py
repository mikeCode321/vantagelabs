from typing import Annotated, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ─── HYSA Tiers ───────────────────────────────────────────────────────────────
class Tier(BaseModel):
    threshold: float
    annual_rate: float

# ─── Bank/Liquid Account (Digital/Cash) ───────────────────────────────────  
class LiquidAccount(BaseModel):
    source_type: Literal["liquid"] = "liquid"
    id: str
    name: str
    balance: float
    interest_tiers: List[Tier]  # positive = HYSA, near-zero/negative = cash inflation loss

# ─── Job / Side Hustle ─────────────────────────────────────────────────────────
class IncomeSource(BaseModel):
    source_type: Literal["income"] = "income"
    id: str
    name: str
    net_income: float
    income_growth: float

# IncomeSource = Annotated[
#     Union[IncomeSource], # SideHustle --- IGNORE ---],
#     Field(discriminator="source_type")
# ]

# ─── Asset Sources ─────────────────────────────────────────────────────────────
class RentalProperty(BaseModel):
    source_type: Literal["rental"] = "rental"
    id: str
    name: str
    purchase_price: float
    down_payment: float
    annual_appreciation: float
    monthly_income: float
    monthly_expenses: float

class StockPortfolio(BaseModel):
    source_type: Literal["stock"] = "stock"
    id: str
    name: str
    initial_value: float
    annual_return: float
    monthly_contribution: float
    dividend_yield: float

AssetSource = Annotated[
    Union[RentalProperty, StockPortfolio],
    Field(discriminator="source_type")
]

# ─── Expense Source ───────────────────────────────────
class ExpenseSource(BaseModel):
    source_type: Literal["expense"] = "expense"
    id: str
    name: str
    annual_expense: float
    expense_growth: float

# # ─── Events (overrides for a specific year) ───────────────────────────────────
# class IncomeEvent(BaseModel):
#     year: int
#     source_id: str
#     action: Literal["update", "remove"]

#     net_income: Optional[float] = None
#     income_growth: Optional[float] = None

# class ExpenseEvent(BaseModel):
#     year: int
#     source_id: str
#     action: Literal["update", "remove"]
#     annual_expense: Optional[float] = None
#     expense_growth: Optional[float] = None

# class AssetEvent(BaseModel):
#     year: int
#     action: Literal["add", "remove", "update"]
#     source: AssetSource  # full source definition for add/update

# class SimEvent(BaseModel):
#     year: int
#     income_events:  List[IncomeEvent] = []
#     expense_events: List[ExpenseEvent] = []
#     asset_events:   List[AssetEvent] = []


# ─── UPDATE PAYLOADS (partial updates only) ───────────────────────────────────

class LiquidUpdate(BaseModel):
    balance: Optional[float] = None
    interest_tiers: Optional[List[Tier]] = None


class IncomeUpdate(BaseModel):
    net_income: Optional[float] = None
    income_growth: Optional[float] = None


class ExpenseUpdate(BaseModel):
    annual_expense: Optional[float] = None
    expense_growth: Optional[float] = None


class RentalUpdate(BaseModel):
    purchase_price: Optional[float] = None
    down_payment: Optional[float] = None
    annual_appreciation: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None


class StockUpdate(BaseModel):
    initial_value: Optional[float] = None
    annual_return: Optional[float] = None
    monthly_contribution: Optional[float] = None
    dividend_yield: Optional[float] = None


UpdatePayload = Union[
    LiquidUpdate,
    IncomeUpdate,
    ExpenseUpdate,
    RentalUpdate,
    StockUpdate,
]


AddPayload = Union[
    LiquidAccount,
    IncomeSource,
    ExpenseSource,
    RentalProperty,
    StockPortfolio,
]


# ─── UNIFIED EVENT ────────────────────────────────────────────────────────────

class Event(BaseModel):
    year: int

    action: Literal["add", "update", "remove"]

    source_type: Literal["liquid", "income", "expense", "rental", "stock"]
    source_id: str

    # Only used when action == "add"
    add_payload: Optional[AddPayload] = None

    # Only used when action == "update"
    update_payload: Optional[UpdatePayload] = None


# ─── Request ──────────────────────────────────────────────────────────────────

# ─── REQUEST ──────────────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    start_year: int
    end_year: int

    liquid_accounts: List[LiquidAccount] = []
    assets: List[AssetSource] = []
    incomes: List[IncomeSource] = []
    expenses: List[ExpenseSource] = []

    events: List[Event] = []

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

class SimYearResult(BaseModel):
    year: int
    net_worth: float        # total_cash + all asset values
    total_cash: float       # sum across all liquid accounts
    total_income: float     # sum of all income source cashflows
    total_expenses: float   # sum of all expense source cashflows
                            # WIP: return interest earned on cash/liquid accounts separately in the future
                            # WIP: return appreciation/asset growth separately in the future
    sources: List[SourceSnapshot]

