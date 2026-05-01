"use client";
import "./dashboard.css";
import { SIM_MAX } from "@/app/testing/constants";
import { useState, useReducer, useEffect, CSSProperties, useRef } from "react";
// import { DollarSign, Clock, TrendingUp, Home, Rocket } from "lucide-react";
import React from "react";

// ─────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────

type ID = string;

type Tier = {
  threshold: number;
  annual_rate: number;
};

// ─────────────────────────────────────────────
// LIQUID ACCOUNTS
// ─────────────────────────────────────────────

type LiquidAccount = {
  source_type: "liquid";
  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  balance: number;
  interest_tiers: Tier[];
};

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────

type IncomeSource = {
  source_type: "income";
  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;
};

// ─────────────────────────────────────────────
// RENTAL
// ─────────────────────────────────────────────

type RentalProperty = {
  source_type: "rental";
  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  purchase_price: number;
  down_payment: number;
  annual_appreciation: number;

  monthly_income: number;
  monthly_expenses: number;
};

// ─────────────────────────────────────────────
// STOCKS
// ─────────────────────────────────────────────

type StockPortfolio = {
  source_type: "stock";
  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  initial_value: number;
  annual_return: number;
  monthly_contribution: number;
  dividend_yield: number;
};

// ─────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────

type AssetSource = RentalProperty | StockPortfolio;

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

type ExpenseSource = {
  source_type: "expense";
  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  annual_expense: number;
  expense_growth: number;
};
type SimRequest = {
  start_year: number;
  end_year: number;

  liquid_accounts: LiquidAccount[];
  assets: AssetSource[];
  incomes: IncomeSource[];
  expenses: ExpenseSource[];
};

type SourceSnapshot = {
  id: string;
  name: string;
  source_type: string;
  asset_value: number;
  annual_cashflow: number;
  // start/end values for display — populated for income + expense sources
  start_value?: number; // what the source was worth at year start
  end_value?: number; // after growth applied
};

type SimYearResult = {
  year: number;
  net_worth: number; // total_cash + all asset values
  total_cash: number; // sum across all liquid accounts
  total_income: number; // sum of all income source cashflows
  total_expenses: number; // sum of all expense source cashflows
  // WIP: return interest earned on cash/liquid accounts separately in the future
  // WIP: return appreciation/asset growth separately in the future
  sources: SourceSnapshot[];
};

type Action =
  | { type: "ADD_LIQUID_ACCOUNT"; payload: LiquidAccount }
  | { type: "UPDATE_LIQUID_ACCOUNT"; payload: LiquidAccount }
  | { type: "DELETE_LIQUID_ACCOUNT"; payload: { id: string } }
  | { type: "ADD_INCOME"; payload: IncomeSource }
  | { type: "UPDATE_INCOME"; payload: IncomeSource }
  | { type: "DELETE_INCOME"; payload: { id: string } }
  | { type: "ADD_EXPENSE"; payload: ExpenseSource }
  | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
  | { type: "DELETE_EXPENSE"; payload: { id: string } }
  | { type: "ADD_ASSET"; payload: AssetSource }
  | { type: "UPDATE_ASSET"; payload: AssetSource }
  | { type: "DELETE_ASSET"; payload: { id: string } };

function simReducer(state: SimRequest, action: Action): SimRequest {
  switch (action.type) {
    case "ADD_LIQUID_ACCOUNT":
      return {
        ...state,
        liquid_accounts: [...state.liquid_accounts, action.payload],
      };

    case "UPDATE_LIQUID_ACCOUNT":
      return {
        ...state,
        liquid_accounts: state.liquid_accounts.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };

    case "DELETE_LIQUID_ACCOUNT":
      return {
        ...state,
        liquid_accounts: state.liquid_accounts.filter((a) => a.id !== action.payload.id),
      };

    // INCOME  ==================
    case "ADD_INCOME":
      return {
        ...state,
        incomes: [...state.incomes, action.payload],
      };

    case "UPDATE_INCOME":
      return {
        ...state,
        incomes: state.incomes.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };

    case "DELETE_INCOME":
      return {
        ...state,
        incomes: state.incomes.filter((i) => i.id !== action.payload.id),
      };

    // EXPENSE  ==================
    case "ADD_EXPENSE":
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };

    case "UPDATE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };

    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload.id),
      };

    // ASSET ==================
    case "ADD_ASSET":
      return {
        ...state,
        assets: [...state.assets, action.payload],
      };

    case "UPDATE_ASSET":
      return {
        ...state,
        assets: state.assets.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };

    case "DELETE_ASSET":
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload.id),
      };

    default:
      return state;
  }
}

const INITIAL_STATE: SimRequest = {
  start_year: 1,
  end_year: SIM_MAX,

  liquid_accounts: [],
  assets: [],
  incomes: [],
  expenses: [],

  // events: []
};

export function LiquidAccountForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [threshold, setThreshold] = useState("");
  const [rate, setRate] = useState("");

  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: LiquidAccount = {
      source_type: "liquid",
      id: crypto.randomUUID(),
      name: name,

      start_year: Number(startYear),
      end_year: Number(endYear),

      balance: Number(balance),
      interest_tiers: [
        {
          threshold: Number(threshold),
          annual_rate: Number(rate),
        },
      ],
    };

    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload,
    });

    setName("");
    setBalance("");
    setThreshold("");
    setRate("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <div>
      <p>Balance: {balance}</p>

      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

        <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />

        <input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Threshold" />

        <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" />

        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export function AssetForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  type AssetSourceType = "rental" | "stock";

  const [sourceType, setSourceType] = useState<AssetSourceType>("rental");
  const [name, setName] = useState("");

  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  // rental
  const [purchasePrice, setPurchasePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [annualAppreciation, setAnnualAppreciation] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");

  // stock
  const [initialValue, setInitialValue] = useState("");
  const [annualReturn, setAnnualReturn] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [dividendYield, setDividendYield] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let payload: AssetSource;

    if (sourceType === "rental") {
      payload = {
        source_type: "rental",
        id: crypto.randomUUID(),
        name,

        start_year: Number(startYear),
        end_year: Number(endYear),

        purchase_price: Number(purchasePrice),
        down_payment: Number(downPayment),
        annual_appreciation: Number(annualAppreciation),
        monthly_income: Number(monthlyIncome),
        monthly_expenses: Number(monthlyExpenses),
      };
    } else {
      payload = {
        source_type: "stock",
        id: crypto.randomUUID(),
        name,

        start_year: Number(startYear),
        end_year: Number(endYear),

        initial_value: Number(initialValue),
        annual_return: Number(annualReturn),
        monthly_contribution: Number(monthlyContribution),
        dividend_yield: Number(dividendYield),
      };
    }

    dispatch({
      type: "ADD_ASSET",
      payload,
    });

    // reset
    setName("");
    setStartYear("");
    setEndYear("");

    setPurchasePrice("");
    setDownPayment("");
    setAnnualAppreciation("");
    setMonthlyIncome("");
    setMonthlyExpenses("");

    setInitialValue("");
    setAnnualReturn("");
    setMonthlyContribution("");
    setDividendYield("");
  };

  return (
    <div>
      <h3>Add Asset</h3>

      <form onSubmit={onSubmit}>
        {/* TYPE SELECT */}
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value as AssetSourceType)}>
          <option value="rental">Rental Property</option>
          <option value="stock">Stock Portfolio</option>
        </select>

        {/* COMMON */}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

        {/* RENTAL FIELDS */}
        {sourceType === "rental" && (
          <>
            <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Purchase Price" />
            <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment" />
            <input value={annualAppreciation} onChange={(e) => setAnnualAppreciation(e.target.value)} placeholder="Annual Appreciation (%)" />
            <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="Monthly Income" />
            <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="Monthly Expenses" />
          </>
        )}

        {/* STOCK FIELDS */}
        {sourceType === "stock" && (
          <>
            <input value={initialValue} onChange={(e) => setInitialValue(e.target.value)} placeholder="Initial Value" />
            <input value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="Annual Return (%)" />
            <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder="Monthly Contribution" />
            <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} placeholder="Dividend Yield (%)" />
          </>
        )}

        <button type="submit">Add Asset</button>
      </form>
    </div>
  );
}

export function ExpenseForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("");
  const [annualExpense, setAnnualExpense] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        id: crypto.randomUUID(),
        name,

        start_year: Number(startYear),
        end_year: Number(endYear),

        annual_expense: Number(annualExpense),
        expense_growth: Number(growth),
      },
    });

    setName("");
    setAnnualExpense("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <div>
      <h3>Add Expense</h3>

      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Rent)" />

        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

        <input value={annualExpense} onChange={(e) => setAnnualExpense(e.target.value)} placeholder="Annual Expense" />

        <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate" />

        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
}
/* -------------------- Row Styles -------------------- */

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  padding: "16px 20px",
  borderBottom: "1px solid #5FA7AB18",
};

const rowMainStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const rowNameStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--primary)",
};

const rowMetaStyle: CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "0.64rem",
  letterSpacing: "0.05em",
  color: "var(--teal)",
};

const rowActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
};

const editButtonStyle: CSSProperties = {
  border: "1px solid #5FA7AB44",
  background: "var(--white)",
  color: "var(--primary)",
  borderRadius: "3px",
  padding: "7px 10px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "1px solid #B46D6D44",
  background: "var(--white)",
  color: "#B46D6D",
  borderRadius: "3px",
  padding: "7px 10px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const editModeStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px 20px",
  borderBottom: "1px solid #5FA7AB18",
  background: "#FAFCFC",
};

const editFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const editInputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #5FA7AB33",
  background: "var(--white)",
  color: "var(--primary)",
  borderRadius: "3px",
  padding: "10px 12px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.72rem",
  outline: "none",
};

const editActionsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
};

function IncomeRow({ income, dispatch, onEdit }: { income: IncomeSource; dispatch: React.Dispatch<Action>; onEdit?: (item: IncomeSource, formType: string) => void }) {
  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{income.name}</p>
        <p style={rowMetaStyle}>
          ${income.net_income.toLocaleString()} · {income.income_growth}% growth
        </p>
      </div>

      <div style={rowActionsStyle}>
        <button style={editButtonStyle} onClick={() => onEdit && onEdit(income, "salary")}>
          Edit
        </button>
        <button style={deleteButtonStyle} onClick={() => dispatch({ type: "DELETE_INCOME", payload: { id: income.id } })}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AssetRow({ asset, dispatch }: { asset: AssetSource; dispatch: React.Dispatch<Action> }) {
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(asset.name);
  const [startYear, setStartYear] = useState(asset.start_year.toString());
  const [endYear, setEndYear] = useState(asset.end_year.toString());

  const [purchasePrice, setPurchasePrice] = useState(asset.source_type === "rental" ? asset.purchase_price.toString() : "");
  const [downPayment, setDownPayment] = useState(asset.source_type === "rental" ? asset.down_payment.toString() : "");
  const [annualAppreciation, setAnnualAppreciation] = useState(asset.source_type === "rental" ? asset.annual_appreciation.toString() : "");
  const [monthlyIncome, setMonthlyIncome] = useState(asset.source_type === "rental" ? asset.monthly_income.toString() : "");
  const [monthlyExpenses, setMonthlyExpenses] = useState(asset.source_type === "rental" ? asset.monthly_expenses.toString() : "");

  const [initialValue, setInitialValue] = useState(asset.source_type === "stock" ? asset.initial_value.toString() : "");
  const [annualReturn, setAnnualReturn] = useState(asset.source_type === "stock" ? asset.annual_return.toString() : "");
  const [monthlyContribution, setMonthlyContribution] = useState(asset.source_type === "stock" ? asset.monthly_contribution.toString() : "");
  const [dividendYield, setDividendYield] = useState(asset.source_type === "stock" ? asset.dividend_yield.toString() : "");

  const resetState = () => {
    setName(asset.name);
    setStartYear(asset.start_year.toString());
    setEndYear(asset.end_year.toString());
  };

  const onSave = () => {
    let updated: AssetSource;

    if (asset.source_type === "rental") {
      updated = {
        ...asset,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        purchase_price: Number(purchasePrice),
        down_payment: Number(downPayment),
        annual_appreciation: Number(annualAppreciation),
        monthly_income: Number(monthlyIncome),
        monthly_expenses: Number(monthlyExpenses),
      };
    } else {
      updated = {
        ...asset,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        initial_value: Number(initialValue),
        annual_return: Number(annualReturn),
        monthly_contribution: Number(monthlyContribution),
        dividend_yield: Number(dividendYield),
      };
    }

    dispatch({ type: "UPDATE_ASSET", payload: updated });
    setIsEditing(false);
  };

  const onCancel = () => {
    resetState();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={editModeStyle}>
        <div style={editFormGridStyle}>
          <input style={editInputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input style={editInputStyle} value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
          <input style={editInputStyle} value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
        </div>

        <div style={editActionsStyle}>
          <button style={editButtonStyle} onClick={onSave}>
            Save
          </button>
          <button style={editButtonStyle} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{asset.name}</p>
        <p style={rowMetaStyle}>
          {asset.start_year}-{asset.end_year} · {asset.source_type === "rental" ? `Rental $${asset.monthly_income}/mo` : `Stock $${asset.initial_value}`}
        </p>
      </div>

      <div style={rowActionsStyle}>
        <button style={editButtonStyle} onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button style={deleteButtonStyle} onClick={() => dispatch({ type: "DELETE_ASSET", payload: { id: asset.id } })}>
          Delete
        </button>
      </div>
    </div>
  );
}

function ExpenseRow({ expense, dispatch }: { expense: ExpenseSource; dispatch: React.Dispatch<Action> }) {
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(expense.name);
  const [annualExpense, setAnnualExpense] = useState(expense.annual_expense.toString());
  const [growth, setGrowth] = useState(expense.expense_growth.toString());

  const onSave = () => {
    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...expense,
        name,
        annual_expense: Number(annualExpense),
        expense_growth: Number(growth),
      },
    });

    setIsEditing(false);
  };

  const onCancel = () => {
    setName(expense.name);
    setAnnualExpense(expense.annual_expense.toString());
    setGrowth(expense.expense_growth.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={editModeStyle}>
        <div style={editFormGridStyle}>
          <input style={editInputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input style={editInputStyle} value={annualExpense} onChange={(e) => setAnnualExpense(e.target.value)} placeholder="Annual Expense" />
          <input style={{ ...editInputStyle, gridColumn: "span 2" }} value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth %" />
        </div>

        <div style={editActionsStyle}>
          <button style={editButtonStyle} onClick={onSave}>
            Save
          </button>
          <button style={editButtonStyle} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{expense.name}</p>
        <p style={rowMetaStyle}>
          ${expense.annual_expense.toLocaleString()} · {expense.expense_growth}% growth
        </p>
      </div>

      <div style={rowActionsStyle}>
        <button style={editButtonStyle} onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button
          style={deleteButtonStyle}
          onClick={() =>
            dispatch({
              type: "DELETE_EXPENSE",
              payload: { id: expense.id },
            })
          }
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function LiquidAccountRow({ account, dispatch }: { account: LiquidAccount; dispatch: React.Dispatch<Action> }) {
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(account.name);
  const [startYear, setStartYear] = useState(account.start_year.toString());
  const [endYear, setEndYear] = useState(account.end_year.toString());
  const [balance, setBalance] = useState(account.balance.toString());
  const [threshold, setThreshold] = useState(account.interest_tiers[0]?.threshold?.toString() ?? "");
  const [rate, setRate] = useState(account.interest_tiers[0]?.annual_rate?.toString() ?? "");

  const onSave = () => {
    dispatch({
      type: "UPDATE_LIQUID_ACCOUNT",
      payload: {
        ...account,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        balance: Number(balance),
        interest_tiers: [
          {
            threshold: Number(threshold),
            annual_rate: Number(rate),
          },
        ],
      },
    });

    setIsEditing(false);
  };

  const onCancel = () => {
    setName(account.name);
    setStartYear(account.start_year.toString());
    setEndYear(account.end_year.toString());
    setBalance(account.balance.toString());
    setThreshold(account.interest_tiers[0]?.threshold?.toString() ?? "");
    setRate(account.interest_tiers[0]?.annual_rate?.toString() ?? "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={editModeStyle}>
        <div style={editFormGridStyle}>
          <input style={editInputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input style={editInputStyle} value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
          <input style={editInputStyle} value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
          <input style={editInputStyle} value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />
          <input style={editInputStyle} value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Threshold" />
          <input style={editInputStyle} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" />
        </div>

        <div style={editActionsStyle}>
          <button style={editButtonStyle} onClick={onSave}>
            Save
          </button>
          <button style={editButtonStyle} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{account.name}</p>
        <p style={rowMetaStyle}>
          ${account.balance.toLocaleString()} · {account.interest_tiers[0]?.annual_rate}% interest
        </p>
      </div>

      <div style={rowActionsStyle}>
        <button style={editButtonStyle} onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button
          style={deleteButtonStyle}
          onClick={() =>
            dispatch({
              type: "DELETE_LIQUID_ACCOUNT",
              payload: { id: account.id },
            })
          }
        >
          Delete
        </button>
      </div>
    </div>
  );
}
const accountTypes = [
  { id: "savings", name: "Savings", emoji: "🏦" },
  { id: "checking", name: "Checking", emoji: "💳" },
  { id: "taxable_investments", name: "Taxable Investments", emoji: "📊" },
  { id: "ira", name: "Individual Retirement Accounts", emoji: "🧓" },
  { id: "employer_retirement", name: "Employer Retirement Accounts", emoji: "🏢" },
];

const incomeTypes = [
  { id: "salary", name: "Salary", emoji: "💼" },
  { id: "hourly", name: "Hourly Wage", emoji: "⏱️" },
  { id: "social_security", name: "Social Security", emoji: "📈" },
  { id: "inheritance", name: "Inheritance", emoji: "🏠" },
  { id: "side", name: "Side Hustle", emoji: "🚀" },
  { id: "custom_income", name: "Custom Income", emoji: "➕" },
];

const expenseTypes = [
  { id: "living", name: "Living Expenses", emoji: "🏠" },
  { id: "rent", name: "Rent", emoji: "🏢" },
  { id: "debt", name: "Debt", emoji: "💳" },
  { id: "education", name: "Education", emoji: "🎓" },
  { id: "vacation", name: "Vacation", emoji: "🏖️" },
  { id: "custom_expense", name: "Custom Expense", emoji: "➕" },
];

const assetTypes = [
  { id: "house", name: "House", emoji: "🏡" },
  { id: "rental_property", name: "Rental Property", emoji: "🏘️" },
  { id: "precious_metals", name: "Precious Metals", emoji: "🥇" },
  { id: "custom_asset", name: "Custom Asset", emoji: "➕" },
];

export function SalaryForm({ dispatch }) {
  const [name, setName] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        id: crypto.randomUUID(),
        name,

        start_year: Number(startYear),
        end_year: Number(endYear),

        net_income: Number(netIncome),
        income_growth: Number(growth),
      },
    });

    setName("");
    setNetIncome("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <div>
      <h3>Add Income</h3>

      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
        <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="Annual Income" />
        <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate" />

        <button type="submit">Add Income</button>
      </form>
    </div>
  );
}

function HourlyWageForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const annualIncome = Number(hourlyRate) * Number(hoursPerWeek) * 52;

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        id: crypto.randomUUID(),
        name: name || "Hourly Job",

        start_year: startYear,
        end_year: endYear,

        net_income: annualIncome,
        income_growth: Number(growth),
      },
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Hourly Wage</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Job Name" />
      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
      <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="Hourly Rate" />
      <input value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} placeholder="Hours / Week" />
      <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth %" />
      <button type="submit">Add Hourly Income</button>
    </form>
  );
}

function InheritanceForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        id: crypto.randomUUID(),
        name: "Inheritance",
        start_year: Number(year),
        end_year: Number(year),
        net_income: Number(amount),
        income_growth: 0,
      },
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Inheritance</h3>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount Received" />
      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year Received" />
      <button type="submit">Add Inheritance</button>
    </form>
  );
}

/* -------------------- EDIT INCOME FORMS -------------------- */

export function EditSalaryForm({ income: item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [netIncome, setNetIncome] = useState(item.net_income.toString());
  const [growth, setGrowth] = useState(item.income_growth.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        net_income: Number(netIncome),
        income_growth: Number(growth),
        start_year: Number(startYear),
        end_year: Number(endYear),
      },
    });

    onClose();
  };

  return (
    <div>
      <h3>Edit Salary Income</h3>

      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
        <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="Annual Income" />
        <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate" />

        <button type="submit">Save Income</button>
      </form>
    </div>
  );
}

export function EditHourlyWageForm({ income, dispatch, onClose }: { income: IncomeSource; dispatch: React.Dispatch<Action>; onClose: () => void }) {
  const [name, setName] = useState(income.name);
  const [startYear, setStartYear] = useState(income.start_year.toString());
  const [endYear, setEndYear] = useState(income.end_year.toString());
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState(income.income_growth.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const annualIncome = Number(hourlyRate) * Number(hoursPerWeek) * 52;

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...income,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        income_growth: Number(growth),
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Hourly Wage</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Job Name" />
      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
      <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="Hourly Rate" />
      <input value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} placeholder="Hours / Week" />
      <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth %" />
      <button type="submit">Save Hourly Income</button>
    </form>
  );
}

export function EditInheritanceForm({ income, dispatch, onClose }: { income: IncomeSource; dispatch: React.Dispatch<Action>; onClose: () => void }) {
  const [amount, setAmount] = useState(income.net_income.toString());
  const [year, setYear] = useState(income.start_year.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...income,
        name: "Inheritance",
        net_income: Number(amount),
        start_year: Number(year),
        end_year: Number(year),
        income_growth: 0,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Inheritance</h3>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount Received" />
      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year Received" />
      <button type="submit">Save Inheritance</button>
    </form>
  );
}

// ---------------------

function LivingExpensesForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("Living Expenses");
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        annual_expense: Number(amount),
        expense_growth: Number(growth),
      },
    });

    setAmount("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Living Expenses</h3>

      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Annual Living Cost" />

      <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth %" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Living Expenses</button>
    </form>
  );
}

function RentExpenseForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        id: crypto.randomUUID(),
        name: "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        annual_expense: Number(amount),
        expense_growth: Number(growth),
      },
    });

    setAmount("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Rent</h3>

      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Annual Rent" />

      <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Rent Growth %" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Rent</button>
    </form>
  );
}

function EducationExpenseForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        id: crypto.randomUUID(),
        name: "Education",
        start_year: Number(year),
        end_year: Number(year),
        annual_expense: Number(amount),
        expense_growth: 0,
      },
    });

    setAmount("");
    setYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Education Expense</h3>

      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Education Cost" />

      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />

      <button type="submit">Add Education Expense</button>
    </form>
  );
}

function CheckingAccountForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("Checking Account");
  const [balance, setBalance] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload: {
        source_type: "liquid",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        balance: Number(balance),
        interest_tiers: [
          {
            threshold: 0,
            annual_rate: 0, // checking usually earns nothing
          },
        ],
      },
    });

    setBalance("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Checking Account</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account Name" />

      <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Starting Balance" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Checking Account</button>
    </form>
  );
}

function RentalPropertyForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("Rental Property");

  const [purchasePrice, setPurchasePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [appreciation, setAppreciation] = useState("");

  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");

  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_ASSET",
      payload: {
        source_type: "rental",
        id: crypto.randomUUID(),
        name,

        start_year: Number(startYear),
        end_year: Number(endYear),

        purchase_price: Number(purchasePrice),
        down_payment: Number(downPayment),
        annual_appreciation: Number(appreciation),

        monthly_income: Number(monthlyIncome),
        monthly_expenses: Number(monthlyExpenses),
      },
    });

    setPurchasePrice("");
    setDownPayment("");
    setAppreciation("");
    setMonthlyIncome("");
    setMonthlyExpenses("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Rental Property</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Property Name" />

      <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Purchase Price" />

      <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment" />

      <input value={appreciation} onChange={(e) => setAppreciation(e.target.value)} placeholder="Annual Appreciation %" />

      <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="Monthly Rent Income" />

      <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="Monthly Expenses" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Rental Property</button>
    </form>
  );
}

const cellStyle: CSSProperties = {
  flex: "1 1 160px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  border: "1px solid #e5e5e5",
  borderRadius: "10px",
};

const gridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const incomeFormMap = {
  salary: SalaryForm,
  hourly: HourlyWageForm,
  inheritance: InheritanceForm,
};

const incomeEditFormMap = {
  salary: EditSalaryForm,
  hourly: EditHourlyWageForm,
  inheritance: EditInheritanceForm,
};

const expenseFormMap = {
  living: LivingExpensesForm,
  rent: RentExpenseForm,
  education: EducationExpenseForm,
};

const assetFormMap = {
  rental_property: RentalPropertyForm,
};

const accountFromMap = {
  checking: CheckingAccountForm,
};

const expenseEditFormMap = {};

const assetEditFormMap = {};

const accountEditFormMap = {};

/* -------------------- Modal -------------------- */

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "10px",
  width: "500px",
  maxHeight: "80vh",
  overflowY: "auto",
  position: "relative",
};

const closeBtn: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
};

export function FinancialEntityModalCell({ item, setSelectedForm }) {
  return (
    <div style={cellStyle} onClick={() => setSelectedForm(item.id)}>
      <span>{item.emoji}</span>
      <span>{item.name}</span>
    </div>
  );
}

export function Modal({ setIsModalOpen, data, entityType, dispatch, editingItem, editFormType }) {
  const [selectedForm, setSelectedForm] = useState(editingItem ? editFormType : null);

  const goBack = () => setSelectedForm(null);

  const closeModal = () => setIsModalOpen(false);

  // Determine which form map to use based on whether we're editing or adding
  let formMap;
  if (editingItem) {
    // Edit mode — use edit form maps
    formMap = entityType === "income" ? incomeEditFormMap : entityType === "expense" ? expenseEditFormMap : entityType === "asset" ? assetEditFormMap : entityType === "account" ? accountEditFormMap : null;
  } else {
    // Add mode — use add form maps
    formMap = entityType === "income" ? incomeFormMap : entityType === "expense" ? expenseFormMap : entityType === "asset" ? assetFormMap : entityType === "account" ? accountFromMap : null;
  }

  const FormComponent = formMap && selectedForm ? formMap[selectedForm] : null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeBtn} onClick={closeModal}>
          close
        </button>

        {!selectedForm && !editingItem && (
          <div style={{ display: "grid", gap: "10px" }}>
            {data.map((item) => (
              <FinancialEntityModalCell key={item.id} item={item} setSelectedForm={setSelectedForm} />
            ))}
          </div>
        )}

        {selectedForm && (
          <div>
            {!editingItem && <button onClick={goBack}>← Back</button>}

            {FormComponent ? (
              editingItem ? (
                entityType === "income" ? (
                  <FormComponent income={editingItem} dispatch={dispatch} onClose={closeModal} />
                ) : entityType === "expense" ? (
                  <FormComponent expense={editingItem} dispatch={dispatch} onClose={closeModal} />
                ) : entityType === "asset" ? (
                  <FormComponent asset={editingItem} dispatch={dispatch} onClose={closeModal} />
                ) : entityType === "account" ? (
                  <FormComponent account={editingItem} dispatch={dispatch} onClose={closeModal} />
                ) : null
              ) : (
                <FormComponent dispatch={dispatch} />
              )
            ) : (
              <div>Form not implemented</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Financial Entity Card -------------------- */

const financialEntityContainer: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  margin: 0,
};

const addButtonStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#fff",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb",
  minHeight: "80px",
};

export function FinancialEntity({ state, entityName, data, entityType, dispatch }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormType, setEditFormType] = useState(null);

  const handleEdit = (item, formType) => {
    setEditingItem(item);
    setEditFormType(formType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setEditFormType(null);
  };

  return (
    <>
      <div style={cardStyle}>
        <div style={financialEntityContainer}>
          <h1 style={titleStyle}>{entityName}</h1>

          <button style={addButtonStyle} onClick={() => setIsModalOpen(true)}>
            +
          </button>
        </div>

        {state.liquid_accounts.map((item) => {
          if (entityType === "account") {
            return <LiquidAccountRow key={item.id} account={item} dispatch={dispatch} />;
          }
          return null;
        })}

        {state.incomes.map((item) => {
          if (entityType === "income") {
            return <IncomeRow key={item.id} income={item} dispatch={dispatch} onEdit={handleEdit} />;
          }
          return null;
        })}

        {state.expenses.map((item) => {
          if (entityType === "expense") {
            return <ExpenseRow key={item.id} expense={item} dispatch={dispatch} />;
          }
          return null;
        })}

        {state.assets.map((item) => {
          if (entityType === "asset") {
            return <AssetRow key={item.id} asset={item} dispatch={dispatch} />;
          }
          return null;
        })}
      </div>

      {isModalOpen && <Modal setIsModalOpen={handleCloseModal} data={data} entityType={entityType} dispatch={dispatch} editingItem={editingItem} editFormType={editFormType} />}
    </>
  );
}
/* -------------------- Horizontal Container -------------------- */

const containerWrapper: CSSProperties = {
  position: "relative",
};

const containerStyle: CSSProperties = {
  display: "flex",
  overflowX: "auto",
  gap: "16px",
  padding: "16px",
  scrollBehavior: "smooth",

  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const itemStyle: CSSProperties = {
  flex: "1 1 250px",
  minWidth: "250px",
  maxWidth: "350px",
};

const arrowStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  border: "1px solid rgba(0,0,0,0.1)",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(6px)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
};

export function FinancialEntities({ state, dispatch }) {
  const ref = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showArrows, setShowArrows] = useState(false);

  const STEP_SIZE = 266;

  useEffect(() => {
    const handleResize = () => {
      setShowArrows(window.innerWidth <= 1250);
    };

    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateScrollState = () => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
  }, []);

  const scrollByStep = (direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;

    const amount = direction === "left" ? -STEP_SIZE : STEP_SIZE;

    el.scrollBy({
      left: amount,
      behavior: "smooth",
    });

    setTimeout(updateScrollState, 300);
  };

  return (
    <div style={containerWrapper}>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* LEFT ARROW (only small screens) */}
      {showArrows && canScrollLeft && (
        <button style={{ ...arrowStyle, left: "6px" }} onClick={() => scrollByStep("left")}>
          ◀
        </button>
      )}

      {/* RIGHT ARROW (only small screens) */}
      {showArrows && canScrollRight && (
        <button style={{ ...arrowStyle, right: "6px" }} onClick={() => scrollByStep("right")}>
          ▶
        </button>
      )}

      <div ref={ref} style={containerStyle} className="hide-scrollbar" onScroll={updateScrollState}>
        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Accounts" data={accountTypes} entityType="account" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Income" data={incomeTypes} entityType="income" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Expenses" data={expenseTypes} entityType="expense" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Assets" data={assetTypes} entityType="asset" dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}

import { BarChart, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, Line, Bar } from "recharts";
import { start } from "repl";

function transformData(simResult: SimYearResult[]) {
  return simResult.map((year) => {
    const totalAssets = year.sources.reduce((sum, src) => {
      if (src.source_type === "rental" || src.source_type === "stock") {
        return sum + (src.asset_value || 0);
      }
      return sum;
    }, 0);

    return {
      year: year.year,
      cash: year.total_cash,
      assets: totalAssets,
      netWorth: year.net_worth,
    };
  });
}

export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const cash = payload.find((p) => p.dataKey === "cash")?.value || 0;
  const assets = payload.find((p) => p.dataKey === "assets")?.value || 0;

  const netWorth = cash + assets;

  return (
    <div style={{ background: "#fff", padding: "10px", border: "1px solid #ddd", color: "#000" }}>
      <p>
        <strong>Year {label}</strong>
      </p>
      <p>Cash: ${cash.toLocaleString()}</p>
      <p>Assets: ${assets.toLocaleString()}</p>
      <p>
        <strong>Total Net Worth: ${netWorth.toLocaleString()}</strong>
      </p>
    </div>
  );
}

export function NetWorthStackedChart({ simResult }: { simResult: SimYearResult[] }) {
  if (!simResult.length)
    return (
      <>
        <div style={{ width: "100%", height: 400 }}>
          <h3>Net Worth Over Time</h3>
          <h5>Not Ready</h5>
        </div>
      </>
    );

  const data = transformData(simResult);

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3>Net Worth Over Time</h3>

      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* bottom layer */}
          <Bar dataKey="cash" stackId="1" fill="#82ca9d" />

          {/* top layer */}
          <Bar dataKey="assets" stackId="1" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimulationControls({ state, setSimResult }: { state: SimRequest; setSimResult: React.Dispatch<React.SetStateAction<SimYearResult[]>> }) {
  const [hasResults, setHasResults] = useState(false);

  async function runSimulation() {
    try {
      const API = "http://localhost:8000/api/finance/simulate";

      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      const data = await response.json();

      console.log(data);
      setSimResult(data);
      setHasResults(true);
    } catch (err) {
      console.error("Simulation error:", err);
    }
  }

  const clearSimulation = () => {
    setSimResult([]);
    setHasResults(false);
  };

  return (
    <div>
      <button onClick={runSimulation}>Run Simulation</button>
      <button onClick={clearSimulation} disabled={!hasResults}>
        Clear Simulation Result
      </button>
    </div>
  );
}

export function SimResultViewer({ simResult }: { simResult: SimYearResult[] }) {
  const [openYears, setOpenYears] = useState<number[]>([]);

  const toggleYear = (year: number) => {
    setOpenYears((previousState) => {
      console.log("Previous state from React:", previousState);

      const isOpen = previousState.includes(year);

      if (isOpen) {
        const nextState = previousState.filter((y) => y !== year);
        console.log("Closing year → new state:", nextState);
        return nextState;
      }

      const nextState = [...previousState, year];
      console.log("Opening year → new state:", nextState);
      return nextState;
    });
  };

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2>Simulation Results</h2>

        <button onClick={() => setOpenYears(simResult.map((y) => y.year))}>Expand All</button>
        <button onClick={() => setOpenYears([])}>Collapse All</button>
      </div>

      <table className="mega-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Name</th>
            <th>Type</th>
            <th>Asset Value</th>
            <th>Cashflow</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>

        <tbody>
          {simResult.map((yearData) => (
            <React.Fragment key={yearData.year}>
              {/* YEAR SUMMARY ROW */}
              <tr className="year-row" onClick={() => toggleYear(yearData.year)}>
                <td>{yearData.year}</td>
                <td colSpan={6}>
                  Net Worth: ${yearData.net_worth} | Cash: ${yearData.total_cash} | Income: ${yearData.total_income} | Expenses: ${yearData.total_expenses}
                </td>
              </tr>

              {/* SOURCE ROWS */}
              {openYears.includes(yearData.year) &&
                yearData.sources.map((src) => (
                  <tr key={src.id} className="source-row">
                    <td></td>
                    <td>{src.name}</td>
                    <td>{src.source_type}</td>
                    <td>${src.asset_value}</td>
                    <td>${src.annual_cashflow}</td>
                    <td>{src.start_value ?? "-"}</td>
                    <td>{src.end_value ?? "-"}</td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  // const sim = useSimulation();
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
  const [simResult, setSimResult] = useState<SimYearResult[]>([]);

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-mark">VL</span>
          <span className="dash-logo-text">VantageLabs</span>
        </div>
        <nav className="dash-nav">
          <a href="/testing" className="dash-nav-item dash-nav-active">
            TESTING GROUNDS
          </a>
          <a href="#" className="dash-nav-item dash-nav-active">
            TESTING VISUALS
          </a>
        </nav>
        <div className="dash-sidebar-footer">
          <span className="dash-year-badge">FY 2025</span>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">Financial Overview</h1>
            <p className="dash-page-sub">Stepwise simulation · Annual variables</p>
          </div>
          <div className="dash-topbar-right">
            <span className="dash-sim-badge">Sim: {SIM_MAX}yr</span>
          </div>
        </header>

        <h3>50-create-aggregated-components</h3>

        <pre>{JSON.stringify(state, null, 2)}</pre>
        <FinancialEntities state={state} dispatch={dispatch} />
        {/* <IncomeList incomes={state.incomes} dispatch={dispatch} />
        <AssetList assets={state.assets} dispatch={dispatch} />
        <ExpenseList expenses={state.expenses} dispatch={dispatch} />
        <LiquidAccountList accounts={state.liquid_accounts} dispatch={dispatch} /> */}

        <SimulationControls state={state} setSimResult={setSimResult} />
        <NetWorthStackedChart simResult={simResult} />
        <SimResultViewer simResult={simResult} />

        {/* {sim.error && <div className="dash-error">{sim.error}</div>} */}
      </main>
    </div>
  );
}
