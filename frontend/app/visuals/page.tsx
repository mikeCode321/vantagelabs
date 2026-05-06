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

type CheckingAccount = {
  source_type: "liquid";
  variant: "checking";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  balance: number;
  interest_tiers: Tier[];
};

type TaxableInvestmentAccount = {
  source_type: "liquid";
  variant: "taxable_investments";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  starting_balance: number;
  monthly_contribution: number;
  expected_return: number;
  dividend_yield: number;
  dividend_reinvestment: "drip" | "cash_out";
  cash_out_account_id?: string;
};

type EmployerRetirementAccount = {
  source_type: "liquid",
  variant: "employer_retirement",
  id: ID,
  name: string;
  start_year: number,
  end_year: number,
  starting_balance: number,
  monthly_contribution: number,
  expected_return: number,
  employer_match: number,
  retirement_age: number
}

type LiquidAccount = CheckingAccount | TaxableInvestmentAccount | EmployerRetirementAccount;

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────

type SalaryIncome = {
  source_type: "income";
  variant: "salary";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;
};

type HourlyWageIncome = {
  source_type: "income";
  variant: "hourly";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;
};

type SideHustleIncome = {
  source_type: "income";
  variant: "side";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  variability: number;
  frequency: string;
  average_income_per_period: number;
};

type IncomeSource = SalaryIncome | HourlyWageIncome | SideHustleIncome;

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────


type LivingExpense = {
  source_type: "expense";
  variant: "living_expense";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  monthly_expense: number;
  expense_growth: number;
};

// ─────────────────────────────────────────────
// RENT
// ─────────────────────────────────────────────

type RentExpense = {
  source_type: "expense";
  variant: "rent";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  monthly_rent: number;
  rent_growth: number; 
};

// ─────────────────────────────────────────────
// DEBT
// ─────────────────────────────────────────────

type DebtExpense = {
  source_type: "debt";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  debt_amount: number;
  monthly_payment: number;

  interest_rate?: number | null; 
};


type ExpenseSource = LivingExpense | RentExpense | DebtExpense;


// ─────────────────────────────────────────────
// ] ASSET
// ─────────────────────────────────────────────

type HouseAsset = {
  source_type: "asset";
  variant: "house";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  house_value: number;
  annual_appreciation: number; // example: 0.03 = 3% yearly growth

  down_payment?: number | null; // optional; deducted from cash if start_year > 0
};


type CarAsset = {
  source_type: "asset";
  variant: "car";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  car_value: number;
  annual_depreciation: number; // example: 0.12 = loses 12% per year

  down_payment?: number | null; // optional; deducted from cash if start_year > 0
};

type AssetSource = HouseAsset | CarAsset;

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
  | { type: "DELETE_ASSET"; payload: { id: string } }
  

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
};


// ENTITY DATA:
const ENTITY_CONFIG = {
  account: {
    checking: {
      id: "checking",
      name: "Checking",
      emoji: "💳",
      formComponent: CheckingAccountForm,
      editFormComponent: EditCheckingAccountForm,
    },
    taxable_investments: {
      id: "taxable_investments",
      name: "Taxable Investments",
      emoji: "📊",
      formComponent: TaxableInvestmentAccountForm,
      editFormComponent: EditTaxableInvestmentAccountForm,
    },
    employer_retirement: {
      id: "employer_retirement",
      name: "Employer Retirement Accounts",
      emoji: "🏢",
      formComponent: EmployerRetirementForm,
      editFormComponent: EditEmployerRetirementForm,
    },
  },
  income: {
    salary: {
      id: "salary",
      name: "Salary",
      emoji: "💼",
      formComponent: SalaryForm,
      editFormComponent: EditSalaryForm,
    },
    hourly: {
      id: "hourly",
      name: "Hourly Wage",
      emoji: "⏱️",
      formComponent: HourlyWageForm,
      editFormComponent: EditHourlyWageForm,
    },
    side: {
      id: "side",
      name: "Side Hustle",
      emoji: "🚀",
      formComponent: SideHustleForm,
      editFormComponent: EditSideHustleForm,
    },
  },
  //TODO: implement expenses and asset below uncomment each form once its implemented 
  expense: {
    living: {
      id: "living",
      name: "Living Expenses",
      emoji: "🏠",
      formComponent: LivingExpensesForm,
      editFormComponent: EditLivingExpensesForm,
    },
    rent: {
      id: "rent",
      name: "Rent",
      emoji: "🏢",
      formComponent: RentExpenseForm,
      editFormComponent: EditRentExpenseForm,
    },
    debt: {
      id: "debt",
      name: "Debt",
      emoji: "💳",
      formComponent: DebtExpenseForm, 
      editFormComponent: EditDebtExpenseForm,
    },
  },
  asset: {
    house: {
      id: "house",
      name: "House",
      emoji: "🏡",
      formComponent: HouseAssetForm,
      editFormComponent: EditHouseAssetForm,
    },
    car: {
      id: "car",
      name: "Car",
      emoji: "🚗",
      formComponent: CarAssetForm,
      editFormComponent: EditCarAssetForm,
    },
  },
};

/* -------------------- Form Styles -------------------- */

const formContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1px",
};

const formSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const formLabelStyle: CSSProperties = {
  fontSize: "0.72rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--teal)",
  fontWeight: 600,
  marginBottom: "2px",
};

const formInputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #5FA7AB33",
  background: "var(--white)",
  color: "var(--primary)",
  borderRadius: "3px",
  padding: "10px 12px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.72rem",
  outline: "none",
  transition: "all 0.15s",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
};

const formSubmitButtonStyle: CSSProperties = {
  background: "var(--teal)",
  color: "var(--white)",
  border: "1px solid var(--teal)",
  borderRadius: "3px",
  padding: "10px 16px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const tierHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const tierTitleStyle: CSSProperties = {
  fontSize: "0.72rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--primary)",
  fontWeight: 600,
};

const addTierButtonStyle: CSSProperties = {
  background: "var(--white)",
  color: "var(--teal)",
  border: "1px solid var(--teal)",
  borderRadius: "3px",
  padding: "5px 10px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.15s",
};

const tierItemStyle: CSSProperties = {
  background: "#FAFCFC",
  border: "1px solid #5FA7AB22",
  borderRadius: "3px",
  padding: "12px",
  display: "flex",
  gap: "12px",
  alignItems: "flex-end",
};

const tierInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const tierDeleteButtonStyle: CSSProperties = {
  background: "var(--white)",
  color: "#B46D6D",
  border: "1px solid #B46D6D44",
  borderRadius: "3px",
  padding: "8px 10px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.15s",
};

/* -------------------- Number Formatting Utilities -------------------- */

/**
 * Format a number string with commas every 3 digits (display only)
 */
function formatNumberWithCommas(value: string): string {
  if (!value) return "";

  const isNegative = value.startsWith("-");
  const numStr = isNegative ? value.slice(1) : value;
  const [integerPart, decimalPart] = numStr.split(".");

  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = decimalPart ? `${withCommas}.${decimalPart}` : withCommas;

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Handle number input - keeps raw value in state, displays formatted
 */
function handleNumberInput(e, setState) {
  let value = e.target.value;

  value = value.replace(/,/g, "");

  value = value.replace(/[^\d.\-]/g, "");

  const parts = value.split(".");
  if (parts.length > 2) return;

  setState(value);
}

function handleTierThresholdInput(e, index, tiers, setTiers) {
  let value = e.target.value;
  value = value.replace(/,/g, "");
  value = value.replace(/[^\d.\-]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) return;

  const updated = [...tiers];
  updated[index].threshold = Number(value) || 0;
  setTiers(updated);
}

// ACCOUNT FORMS 
function CheckingAccountForm({ dispatch }) {
  const [name, setName] = useState("Checking Account");
  const [balance, setBalance] = useState(""); // ← Store raw number
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [tiers, setTiers] = useState<Array<{ threshold: number; annual_rate: number }>>([{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "checking",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        balance: Number(balance), // ← Send raw number (no commas)
        interest_tiers: tiers,
      },
    });

    setName("Checking Account");
    setBalance("");
    setStartYear("");
    setEndYear("");
    setTiers([{ threshold: 0, annual_rate: 0 }]);
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: tiers[tiers.length - 1]?.threshold ?? 0 + 50000,
        annual_rate: 0.0,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: "threshold" | "annual_rate", value: string) => {
    const updated = [...tiers];
    updated[index][field] = Number(value);
    setTiers(updated);
  };

  return (
    <div style={formContainerStyle}>
      <div>
        <h3 style={{ margin: "0 0 13px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Add Checking Account</h3>
      </div>

      <form onSubmit={onSubmit} style={formContainerStyle}>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. Main Checking, Emergency Fund" />
        </div>

        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input
            value={formatNumberWithCommas(balance)} // ← Display with commas
            onChange={(e) => handleNumberInput(e, setBalance)} // ← Store raw
            style={formInputStyle}
            placeholder="e.g. 100000"
            type="text"
            inputMode="decimal"
          />
        </div>

        {/* Years */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
            </div>
          </div>
        </div>

        {/* Interest Tiers */}
        <div style={formSectionStyle}>
          <div style={tierHeaderStyle}>
            <label style={tierTitleStyle}>Interest Tiers</label>
            <button type="button" style={addTierButtonStyle} onClick={addTier}>
              + Add Tier
            </button>
          </div>

          {tiers.map((tier, index) => (
            <div key={index}>
              <div style={tierItemStyle}>
                <div style={{ ...tierInputStyle, flex: 0.6 }}>
                  <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Threshold</label>
                  <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
                </div>

                <div style={{ ...tierInputStyle, flex: 0.6 }}>
                  <label style={{ ...formLabelStyle, marginBottom: "6px" }}>APY (%)</label>
                  <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} style={formInputStyle} placeholder="0.03" type="number" step="0.0001" />
                </div>

                {tiers.length > 1 && (
                  <button type="button" style={tierDeleteButtonStyle} onClick={() => removeTier(index)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button type="submit" style={formSubmitButtonStyle}>
          Add Checking Account
        </button>
      </form>
    </div>
  );
}

function TaxableInvestmentAccountForm({ dispatch }) {
  const [name, setName] = useState("Taxable Investments");
  const [balance, setBalance] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [dividendYield, setDividendYield] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [dividendStrategy, setDividendStrategy] = useState<"drip" | "cash_out">("drip");
  const [cashOutAccountId, setCashOutAccountId] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dividendStrategy === "cash_out" && !cashOutAccountId) {
      alert("Please select a checking account for dividend payouts");
      return;
    }

    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "taxable_investments",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
        cash_out_account_id: dividendStrategy === "cash_out" ? cashOutAccountId : undefined,
      },
    });

    setName("Taxable Investments");
    setBalance("");
    setMonthlyContribution("");
    setExpectedReturn("");
    setDividendYield("");
    setStartYear("");
    setEndYear("");
    setDividendStrategy("drip");
    setCashOutAccountId("");
  };

  return (
    <div style={formContainerStyle}>
      <div>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Add Taxable Investment Account</h3>
      </div>

      <form onSubmit={onSubmit} style={formContainerStyle}>
        {/* Account Name */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. Fidelity Brokerage, Individual Stocks" />
        </div>

        {/* Starting Balance */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} style={formInputStyle} placeholder="e.g. 50000" type="text" inputMode="decimal" />
        </div>

        {/* Contribution Amount */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Monthly Contribution</label>
          <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} style={formInputStyle} placeholder="e.g. 1000" type="text" inputMode="decimal" />
        </div>

        {/* Expected Return & Dividend */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Annual Returns</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Expected Return (%)</label>
              <input value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} style={formInputStyle} placeholder="8.0" type="number" step="0.1" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Dividend Yield (%)</label>
              <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} style={formInputStyle} placeholder="2.0" type="number" step="0.1" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
            </div>
          </div>
        </div>

        {/* Dividend Strategy */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Dividend Strategy</label>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                value="drip"
                checked={dividendStrategy === "drip"}
                onChange={(e) => {
                  setDividendStrategy(e.target.value as "drip" | "cash_out");
                  setCashOutAccountId("");
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--primary)" }}>DRIP (Reinvest)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="radio" value="cash_out" checked={dividendStrategy === "cash_out"} onChange={(e) => setDividendStrategy(e.target.value as "drip" | "cash_out")} />
              <span style={{ fontSize: "0.72rem", color: "var(--primary)" }}>Cash Out</span>
            </label>
          </div>
        </div>

        {/* Select Checking Account (only if cash_out) */}
        {/* {dividendStrategy === "cash_out" && (
          <div style={formSectionStyle}>
            <label style={formLabelStyle}>Send Dividends To</label>
            <select value={cashOutAccountId} onChange={(e) => setCashOutAccountId(e.target.value)} style={formInputStyle}>
              <option value="">— Select Account —</option>
              {liquidAccounts
                .filter((acc) => acc.name.toLowerCase().includes("checking") || acc.name.toLowerCase().includes("savings"))
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
            </select>
          </div>
        )} */}

        {/* Submit Button */}
        <button type="submit" style={formSubmitButtonStyle}>
          Add Taxable Investment Account
        </button>
      </form>
    </div>
  );
}

function EmployerRetirementForm({ dispatch }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [employerMatch, setEmployerMatch] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [retirementAge, setRetirementAge] = useState("");
 
  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "employer_retirement",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        employer_match: Number(employerMatch) / 100,
        retirement_age: Number(retirementAge),
      },
    });
    setName("");
    setBalance("");
    setMonthlyContribution("");
    setExpectedReturn("");
    setEmployerMatch("");
    setStartYear("");
    setEndYear("");
    setRetirementAge("");
  };
 
  return (
    <div style={formContainerStyle}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Add Employer Retirement Account</h3>
      <form onSubmit={onSubmit} style={formContainerStyle}>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. 401(k)" required />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Monthly Contribution</label>
          <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} style={formInputStyle} placeholder="e.g. 2000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Returns & Match</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Expected Return (%)</label>
              <input value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} style={formInputStyle} placeholder="7.0" type="number" step="0.1" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Employer Match (%)</label>
              <input value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} style={formInputStyle} placeholder="3.0" type="number" step="0.1" />
            </div>
          </div>
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" />
            </div>
          </div>
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Retirement Age</label>
          <input value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} style={formInputStyle} placeholder="65" type="number" />
        </div>
        <button type="submit" style={formSubmitButtonStyle}>Add Employer Retirement Account</button>
      </form>
    </div>
  );
}
// ASSET FORMS

function CarAssetForm({ dispatch }) {
  const [name, setName] = useState("");
  const [carValue, setCarValue] = useState("");
  const [depreciation, setDepreciation] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_ASSET",
      payload: {
        source_type: "asset",
        variant: "car",
        id: crypto.randomUUID(),
        name: name || "Car",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        car_value: Number(carValue),
        annual_depreciation: Number(depreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    setName("");
    setCarValue("");
    setDepreciation("");
    setDownPayment("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Add Car</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Car Name" />

      <input value={carValue} onChange={(e) => setCarValue(e.target.value)} placeholder="Car Value" type="number" />

      <input value={depreciation} onChange={(e) => setDepreciation(e.target.value)} placeholder="Annual Depreciation %" type="number" />

      <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

      <button type="submit">Add Car</button>
    </form>
  );
}

function HouseAssetForm({ dispatch }) {
  const [name, setName] = useState("");
  const [houseValue, setHouseValue] = useState("");
  const [appreciation, setAppreciation] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_ASSET",
      payload: {
        source_type: "asset",
        variant: "house",
        id: crypto.randomUUID(),
        name: name || "House",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        house_value: Number(houseValue),
        annual_appreciation: Number(appreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    setName("");
    setHouseValue("");
    setAppreciation("");
    setDownPayment("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Add House</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="House Name" />

      <input value={houseValue} onChange={(e) => setHouseValue(e.target.value)} placeholder="House Value" type="number" />

      <input value={appreciation} onChange={(e) => setAppreciation(e.target.value)} placeholder="Annual Appreciation %" type="number" />

      <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

      <button type="submit">Add House</button>
    </form>
  );
}
// EXPENSE FORMS
function LivingExpensesForm({ dispatch }) {
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
        variant: "living",
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


function DebtExpenseForm({ dispatch }) {
  const [name, setName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "debt",
        id: crypto.randomUUID(),
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_payment: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    setName("");
    setDebtAmount("");
    setMonthlyPayment("");
    setInterestRate("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Debt name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Debt amount"
        value={debtAmount}
        onChange={(e) => setDebtAmount(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Monthly payment"
        value={monthlyPayment}
        onChange={(e) => setMonthlyPayment(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Interest rate % (optional)"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
      />

      <input
        type="number"
        placeholder="Start year"
        value={startYear}
        onChange={(e) => setStartYear(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="End year (optional)"
        value={endYear}
        onChange={(e) => setEndYear(e.target.value)}
      />

      <button type="submit">
        Add Debt
      </button>
    </form>
  );
}

function RentExpenseForm({ dispatch }) {
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
        variant: "rent",
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


// INCOME FORMS
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
        variant: "salary",
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

function HourlyWageForm({ dispatch }) {
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
        variant: "hourly",
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

function SideHustleForm({ dispatch }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [averageIncome, setAverageIncome] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [variability, setVariability] = useState("5");
 
  const onSubmit = (e) => {
    e.preventDefault();
 
    const frequencyMultiplier = {
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      annual: 1,
    }[frequency] || 12;
 
    const annualIncome = Number(averageIncome) * frequencyMultiplier;
 
    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "side",
        id: crypto.randomUUID(),
        name: name || "Side Hustle",
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });
 
    setName("");
    setStartYear("");
    setEndYear("");
    setAverageIncome("");
    setFrequency("monthly");
    setVariability("5");
  };
 
  return (
    <form onSubmit={onSubmit}>
      <h3>Side Hustle</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Side Hustle Name" />
      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />
      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" type="number" />
      
      <div>
        <label>Average Income Per Period</label>
        <input value={averageIncome} onChange={(e) => setAverageIncome(e.target.value)} placeholder="e.g. 500" type="number" step="0.01" />
      </div>
 
      <div>
        <label>Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
      </div>
 
      <div>
        <label>Variability (%) - {variability}%</label>
        <input value={variability} onChange={(e) => setVariability(e.target.value)} type="range" min="0" max="20" step="1" />
      </div>
 
      <button type="submit">Add Side Hustle</button>
    </form>
  );
}


/* -------------------- EDIT INCOME FORMS -------------------- */

export function EditSalaryForm({ item, dispatch, onClose }) {
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

export function EditHourlyWageForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState(item.income_growth.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const annualIncome = Number(hourlyRate) * Number(hoursPerWeek) * 52;

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
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

export function EditSideHustleForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [averageIncome, setAverageIncome] = useState(item.average_income_per_period?.toString() || "");
  const [frequency, setFrequency] = useState(item.frequency || "monthly");
  const [variability, setVariability] = useState((item.variability * 100)?.toString() || "5");
 
  const onSubmit = (e) => {
    e.preventDefault();
 
    const frequencyMultiplier = {
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      annual: 1,
    }[frequency] || 12;
 
    const annualIncome = Number(averageIncome) * frequencyMultiplier;
 
    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });
 
    onClose();
  };
 
  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Side Hustle</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Side Hustle Name" />
      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />
      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" type="number" />
      
      <div>
        <label>Average Income Per Period</label>
        <input value={averageIncome} onChange={(e) => setAverageIncome(e.target.value)} placeholder="e.g. 500" type="number" step="0.01" />
      </div>
 
      <div>
        <label>Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
      </div>
 
      <div>
        <label>Variability (%) - {variability}%</label>
        <input value={variability} onChange={(e) => setVariability(e.target.value)} type="range" min="0" max="20" step="1" />
      </div>
 
      <button type="submit">Save Side Hustle</button>
    </form>
  );
}
/* -------------------- EDIT ASSET FORMS -------------------- */
export function EditHouseAssetForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [houseValue, setHouseValue] = useState(item.house_value.toString());
  const [appreciation, setAppreciation] = useState((item.annual_appreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_ASSET",
      payload: {
        ...item,
        source_type: "asset",
        variant: "house",
        name: name || "House",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        house_value: Number(houseValue),
        annual_appreciation: Number(appreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit House</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="House Name" />

      <input value={houseValue} onChange={(e) => setHouseValue(e.target.value)} placeholder="House Value" type="number" />

      <input value={appreciation} onChange={(e) => setAppreciation(e.target.value)} placeholder="Annual Appreciation %" type="number" />

      <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

      <button type="submit">Save House</button>
    </form>
  );
}

export function EditCarAssetForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [carValue, setCarValue] = useState(item.car_value.toString());
  const [depreciation, setDepreciation] = useState((item.annual_depreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_ASSET",
      payload: {
        ...item,
        source_type: "asset",
        variant: "car",
        name: name || "Car",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        car_value: Number(carValue),
        annual_depreciation: Number(depreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Car</h3>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Car Name" />

      <input value={carValue} onChange={(e) => setCarValue(e.target.value)} placeholder="Car Value" type="number" />

      <input value={depreciation} onChange={(e) => setDepreciation(e.target.value)} placeholder="Annual Depreciation %" type="number" />

      <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

      <button type="submit">Save Car</button>
    </form>
  );
}
/* -------------------- EDIT EXPENSE FORMS -------------------- */

export function EditLivingExpensesForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Living Expenses</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Expense Name"
      />

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monthly Living Expense"
      />

      <input
        value={growth}
        onChange={(e) => setGrowth(e.target.value)}
        placeholder="Growth %"
      />

      <input
        value={startYear}
        onChange={(e) => setStartYear(e.target.value)}
        placeholder="Start Year"
      />

      <input
        value={endYear}
        onChange={(e) => setEndYear(e.target.value)}
        placeholder="End Year optional"
      />

      <button type="submit">Save Living Expenses</button>
    </form>
  );
}

export function EditRentExpenseForm({ item, dispatch, onClose }) {
  const [amount, setAmount] = useState(item.annual_expense.toString());
  const [growth, setGrowth] = useState(item.expense_growth.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        name: "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        rent_growth: Number(growth) /100,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Rent</h3>

      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montly Rent" />

      <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Rent Growth %" />

      <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Save Rent</button>
    </form>
  );
}

export function EditDebtExpenseForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [debtAmount, setDebtAmount] = useState(item.debt_amount.toString());
  const [monthlyPayment, setMonthlyPayment] = useState(item.monthly_payment.toString());
  const [interestRate, setInterestRate] = useState(
    item.interest_rate == null ? "" : (item.interest_rate * 100).toString()
  );
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        source_type: "debt",
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_payment: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Debt</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Debt Name"
      />

      <input
        value={debtAmount}
        onChange={(e) => setDebtAmount(e.target.value)}
        placeholder="Debt Amount"
        type="number"
      />

      <input
        value={monthlyPayment}
        onChange={(e) => setMonthlyPayment(e.target.value)}
        placeholder="Monthly Payment"
        type="number"
      />

      <input
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
        placeholder="Interest Rate % optional"
        type="number"
      />

      <input
        value={startYear}
        onChange={(e) => setStartYear(e.target.value)}
        placeholder="Start Year"
        type="number"
      />

      <input
        value={endYear}
        onChange={(e) => setEndYear(e.target.value)}
        placeholder="End Year optional"
        type="number"
      />

      <button type="submit">Save Debt</button>
    </form>
  );
}
/* -------------------- EDIT ACCOUNT FORMS -------------------- */

export function EditCheckingAccountForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.balance.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [tiers, setTiers] = useState(item.interest_tiers && item.interest_tiers.length > 0 ? item.interest_tiers : [{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_LIQUID_ACCOUNT",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        balance: Number(balance),
        interest_tiers: tiers,
      },
    });

    onClose();
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: tiers[tiers.length - 1]?.threshold ?? 0 + 50000,
        annual_rate: 0.0,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: "threshold" | "annual_rate", value: string) => {
    const updated = [...tiers];
    updated[index][field] = Number(value);
    setTiers(updated);
  };

  return (
    <div style={formContainerStyle}>
      <div>
        <h3 style={{ margin: "0 0 13px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Edit Checking Account</h3>
      </div>

      <form onSubmit={onSubmit} style={formContainerStyle}>
        {/* Account Name */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. Main Checking, Emergency Fund" />
        </div>

        {/* Balance - Display formatted, store raw */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
        </div>

        {/* Years */}
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
            </div>
          </div>
        </div>

        {/* Interest Tiers */}
        <div style={formSectionStyle}>
          <div style={tierHeaderStyle}>
            <label style={tierTitleStyle}>Interest Tiers</label>
            <button type="button" style={addTierButtonStyle} onClick={addTier}>
              + Add Tier
            </button>
          </div>

          {tiers.map((tier, index) => (
            <div key={index}>
              <div style={tierItemStyle}>
                <div style={{ ...tierInputStyle, flex: 0.6 }}>
                  <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Threshold</label>
                  <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
                </div>

                <div style={{ ...tierInputStyle, flex: 0.6 }}>
                  <label style={{ ...formLabelStyle, marginBottom: "6px" }}>APY (%)</label>
                  <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} style={formInputStyle} placeholder="0.03" type="number" step="0.0001" />
                </div>

                {tiers.length > 1 && (
                  <button type="button" style={tierDeleteButtonStyle} onClick={() => removeTier(index)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button type="submit" style={formSubmitButtonStyle}>
          Save Checking Account
        </button>
      </form>
    </div>
  );
}

export function EditTaxableInvestmentAccountForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "");
  const [dividendYield, setDividendYield] = useState((item.dividend_yield * 100)?.toString() || "");
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [dividendStrategy, setDividendStrategy] = useState(item.dividend_reinvestment || "drip");
 
  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: "UPDATE_LIQUID_ACCOUNT",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
      },
    });
    onClose();
  };
 
  return (
    <div style={formContainerStyle}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Edit Taxable Investment Account</h3>
      <form onSubmit={onSubmit} style={formContainerStyle}>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. Fidelity Brokerage" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} style={formInputStyle} placeholder="e.g. 50000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Monthly Contribution</label>
          <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} style={formInputStyle} placeholder="e.g. 1000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Annual Returns</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Expected Return (%)</label>
              <input value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} style={formInputStyle} placeholder="8.0" type="number" step="0.1" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Dividend Yield (%)</label>
              <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} style={formInputStyle} placeholder="2.0" type="number" step="0.1" />
            </div>
          </div>
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
            </div>
          </div>
        </div>
        <button type="submit" style={formSubmitButtonStyle}>Save Taxable Investment Account</button>
      </form>
    </div>
  );
}

function EditEmployerRetirementForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "");
  const [employerMatch, setEmployerMatch] = useState((item.employer_match * 100)?.toString() || "");
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [retirementAge, setRetirementAge] = useState(item.retirement_age?.toString() || "");
 
  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: "UPDATE_LIQUID_ACCOUNT",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        employer_match: Number(employerMatch) / 100,
        retirement_age: Number(retirementAge),
      },
    });
    onClose();
  };
 
  return (
    <div style={formContainerStyle}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "var(--primary)" }}>Edit Employer Retirement Account</h3>
      <form onSubmit={onSubmit} style={formContainerStyle}>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Account Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={formInputStyle} placeholder="e.g. 401(k)" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Starting Balance</label>
          <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Monthly Contribution</label>
          <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} style={formInputStyle} placeholder="e.g. 2000" type="text" inputMode="decimal" />
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Returns & Match</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Expected Return (%)</label>
              <input value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} style={formInputStyle} placeholder="7.0" type="number" step="0.1" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Employer Match (%)</label>
              <input value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} style={formInputStyle} placeholder="3.0" type="number" step="0.1" />
            </div>
          </div>
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Timeline</label>
          <div style={formGridStyle}>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>Start Year</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
            </div>
            <div>
              <label style={{ ...formLabelStyle, marginBottom: "6px" }}>End Year</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" />
            </div>
          </div>
        </div>
        <div style={formSectionStyle}>
          <label style={formLabelStyle}>Retirement Age</label>
          <input value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} style={formInputStyle} placeholder="65" type="number" />
        </div>
        <button type="submit" style={formSubmitButtonStyle}>Save Employer Retirement Account</button>
      </form>
    </div>
  );
}

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

const cellStyle: CSSProperties = {
  flex: "1 1 160px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  border: "1px solid #e5e5e5",
  borderRadius: "10px",
};

export function FinancialEntityModalCell({ item, setSelectedVariant }) {
  return (
    <div style={cellStyle} onClick={() => setSelectedVariant(item.id)}>
      <span>{item.emoji}</span>
      <span>{item.name}</span>
    </div>
  );
}

export function Modal({ setIsModalOpen, data, category, dispatch, variantBeingEdited }) {
  const [selectedVariant, setSelectedVariant] = useState(variantBeingEdited?.variant || null);
  
  const goBack = () => setSelectedVariant(null);
  const closeModal = () => setIsModalOpen(false);

  const FormComponent = selectedVariant 
    ? ( variantBeingEdited ? ENTITY_CONFIG[category][selectedVariant]?.editFormComponent : ENTITY_CONFIG[category][selectedVariant]?.formComponent)
    : null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {selectedVariant && <button onClick={goBack}>← Back</button>}

        <button style={closeBtn} onClick={closeModal}>
          close
        </button>

        {/* ENTITY SOURCE SELECTION MODAL */}
        {!selectedVariant && !variantBeingEdited && (
          <div style={{ display: "grid", gap: "10px" }}>
            {data.map((item) => (
              <FinancialEntityModalCell key={item.id} item={item} setSelectedVariant={setSelectedVariant} />
            ))}
          </div>
        )}

        {/* EDIT/ADD Modal */}
        {selectedVariant && (FormComponent ? 
          variantBeingEdited 
            ? <FormComponent item={variantBeingEdited} dispatch={dispatch} onClose={closeModal} /> 
            : <FormComponent dispatch={dispatch} onClose={closeModal} />
          : <div>Form not implemented</div>)
        }
      </div>
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
  marginBottom: "2px",
};

const rowMetaStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.64rem",
  letterSpacing: "0.05em",
  color: "var(--teal)",
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const rowActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexShrink: 0,
};

const smallButtonStyle: CSSProperties = {
  border: "1px solid #5FA7AB44",
  background: "var(--white)",
  color: "var(--primary)",
  borderRadius: "3px",
  padding: "5px 8px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.58rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.15s",
};

const smallDeleteButtonStyle: CSSProperties = {
  border: "1px solid #B46D6D44",
  background: "var(--white)",
  color: "#B46D6D",
  borderRadius: "3px",
  padding: "5px 8px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.58rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.15s",
};


function EntityRow({ item, category, dispatch, onEdit }) {
  const handleDelete = () => {
    const deleteType = {
      account: "DELETE_LIQUID_ACCOUNT",
      income: "DELETE_INCOME",
      expense: "DELETE_EXPENSE",
      asset: "DELETE_ASSET",
    }[category];

    dispatch({
      type: deleteType,
      payload: { id: item.id },
    });
  };

  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{item.name}</p>
        <div style={rowMetaStyle}>
          {item.balance && <span>${formatNumberWithCommas(item.balance.toString())}</span>}
          {item.net_income && <span>${formatNumberWithCommas(item.net_income.toString())}</span>}
          {item.annual_expense && <span>${formatNumberWithCommas(item.annual_expense.toString())}</span>}
          {item.starting_balance && <span>${formatNumberWithCommas(item.starting_balance.toString())}</span>}
          <span>{item.start_year}–{item.end_year}</span>
        </div>
      </div>

      <div style={rowActionsStyle}>
        <button style={smallButtonStyle} onClick={() => onEdit(item, item.variant)}>
          Edit
        </button>
        <button style={smallDeleteButtonStyle} onClick={handleDelete}>
          ✕
        </button>
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

export function FinancialEntity({ state, entityName, category, dispatch }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variantBeingEdited, setVariantBeingEdited] = useState(null);

  const handleEdit = (item) => {
    setVariantBeingEdited(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVariantBeingEdited(null);
  };

  const data = Object.values(ENTITY_CONFIG[category]).map(v => ({ id: v.id, name: v.name, emoji: v.emoji }));

  const getItems = () => {
    switch(category) {
      case "account":
        return state.liquid_accounts;
      case "income":
        return state.incomes;
      case "expense":
        return state.expenses;
      case "asset":
        return state.assets;
      default:
        return [];
    }
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

        {getItems().map((item) => (
          <EntityRow key={item.id} item={item} category={category} dispatch={dispatch} onEdit={handleEdit} />
        ))}
      </div>

      {isModalOpen && <Modal setIsModalOpen={handleCloseModal} data={data} category={category} dispatch={dispatch} variantBeingEdited={variantBeingEdited}/>}
    </>
  );
}
/* -------------------- Financial Entities (Horizontal Container) -------------------- */

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
  const ref = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showArrows, setShowArrows] = useState(false);

  const STEP_SIZE = 266;

  useEffect(() => {
    const handleResize = () => {
      setShowArrows(window.innerWidth <= 1250);
    };

    handleResize();
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

  const scrollByStep = (direction) => {
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

      {showArrows && canScrollLeft && (
        <button style={{ ...arrowStyle, left: "6px" }} onClick={() => scrollByStep("left")}>
          ◀
        </button>
      )}

      {showArrows && canScrollRight && (
        <button style={{ ...arrowStyle, right: "6px" }} onClick={() => scrollByStep("right")}>
          ▶
        </button>
      )}

      <div ref={ref} style={containerStyle} className="hide-scrollbar" onScroll={updateScrollState}>
        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Accounts" category="account" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Income" category="income" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Expenses" category="expense" dispatch={dispatch} />
        </div>

        <div style={itemStyle}>
          <FinancialEntity state={state} entityName="Assets" category="asset" dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}

import { BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, Bar } from "recharts";

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

export function NetWorthStackedChart({ simResult }) {
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

        <SimulationControls state={state} setSimResult={setSimResult} />
        <NetWorthStackedChart simResult={simResult} />
        <SimResultViewer simResult={simResult} />

        {/* {sim.error && <div className="dash-error">{sim.error}</div>} */}
      </main>
    </div>
  );
}