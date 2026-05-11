"use client";
import "./dashboard.css";
import { SIM_MAX } from "@/app/testing/constants";
import { useState, useReducer, useEffect, CSSProperties, useRef } from "react";
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
  source_type: "liquid";
  variant: "employer_retirement";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  starting_balance: number;
  monthly_contribution: number;
  expected_return: number;
  employer_match: number;
  linked_income_id?: string;
};

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

  linked_401k_id?: string;
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
  variant: "living";

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

  monthly_expense: number;
  rent_growth: number;
};

// ─────────────────────────────────────────────
// DEBT
// ─────────────────────────────────────────────

type DebtExpense = {
  source_type: "expense";
  variant: "debt";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  debt_amount: number;
  monthly_expense: number;

  interest_rate?: number | null;
};

// ─────────────────────────────────────────────
// MORTGAGE
// ─────────────────────────────────────────────

type HouseLoanExpense = {
  source_type: "expense";
  variant: "house_loan";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  // Links this mortgage to a specific house asset
  linked_asset_id: ID;

  monthly_expense: number;

  // Needed to track mortgage balance over time
  original_principal: number; //  house asset_value - down_payment
  interest_rate: number; // example: 0.0675 = 6.75%
  loan_term_years: number; // example: 30

  
};


// ─────────────────────────────────────────────
// CAR LOAN
// ─────────────────────────────────────────────



type CarLoanExpense = {
  source_type: "expense";
  variant: "car_loan";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  linked_asset_id: ID; // points to the CarAsset

  monthly_expense: number;

  // Needed to track balance over time
  original_principal: number; //  car asset_value - down_payment
  interest_rate: number; // example: 0.072 = 7.2%
  loan_term_years: number; // example: 5


};


type ExpenseSource = LivingExpense | RentExpense | DebtExpense | CarLoanExpense | HouseLoanExpense;

// ─────────────────────────────────────────────
// ASSET
// ─────────────────────────────────────────────

type HouseAsset = {
  source_type: "asset";
  variant: "house";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  asset_value: number;
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

  asset_value: number;
  annual_depreciation: number; // example: 0.12 = loses 12% per year

  down_payment?: number | null; // optional; deducted from cash if start_year > 0
};

type AssetSource = HouseAsset | CarAsset;

type SimRequest = {
  start_year: number;
  end_year: number;
  accounts: {
    checking: CheckingAccount[];
    taxable_investments: TaxableInvestmentAccount[];
    employer_retirement: EmployerRetirementAccount[];
  };
  incomes: {
    salary: SalaryIncome[];
    hourly: HourlyWageIncome[];
    side: SideHustleIncome[];
  };
  expenses: {
    living: LivingExpense[]; // TODO: expenses will need to be updated
    rent: RentExpense[];
    car_loan : CarLoanExpense[];
    house_loan: HouseLoanExpense[];
    debt: DebtExpense[];
  };
  assets: {
    house: HouseAsset[]; // TODO: Replace with HouseAsset[] when implemented
    car: CarAsset[]; // TODO: Replace with CarAsset[] when implemented
  };
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
  | { type: "ADD_ACCOUNT"; payload: LiquidAccount }
  | { type: "UPDATE_ACCOUNT"; payload: LiquidAccount }
  | {
      type: "DELETE_ACCOUNT";
      payload: { id: string; variant: "checking" | "taxable_investments" | "employer_retirement" };
    }
  | { type: "ADD_INCOME"; payload: IncomeSource }
  | { type: "UPDATE_INCOME"; payload: IncomeSource }
  | { type: "DELETE_INCOME"; payload: { id: string; variant: "salary" | "hourly" | "side" } }
  | { type: "ADD_EXPENSE"; payload: ExpenseSource }
  | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
  | { type: "DELETE_EXPENSE"; payload: { id: string; variant: "living" | "rent" | "debt" } }
  | { type: "ADD_ASSET"; payload: AssetSource }
  | { type: "UPDATE_ASSET"; payload: AssetSource }
  | { type: "DELETE_ASSET"; payload: { id: string; variant: "house" | "car" } };

function simReducer(state: SimRequest, action: Action): SimRequest {
  switch (action.type) {
    case "ADD_ACCOUNT": {
      const account = action.payload;
      const variant: "checking" | "taxable_investments" | "employer_retirement" = account.variant;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: [...state.accounts[variant], account],
        },
      };
    }

    case "UPDATE_ACCOUNT": {
      const account = action.payload;
      const variant: "checking" | "taxable_investments" | "employer_retirement" = account.variant;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: state.accounts[variant].map(a => (a.id === account.id ? account : a)),
        },
      };
    }

    case "DELETE_ACCOUNT": {
      const { id, variant } = action.payload;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: state.accounts[variant].filter(a => a.id !== id),
        },
      };
    }

    // INCOME  ==================
    case "ADD_INCOME": {
      const income = action.payload;
      const variant: "salary" | "hourly" | "side" = income.variant;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: [...state.incomes[variant], income],
        },
      };
    }

    case "UPDATE_INCOME": {
      const income = action.payload;
      const variant: "salary" | "hourly" | "side" = income.variant;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: state.incomes[variant].map(i => (i.id === income.id ? income : i)),
        },
      };
    }

    case "DELETE_INCOME": {
      const { id, variant } = action.payload;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: state.incomes[variant].filter(i => i.id !== id),
        },
      };
    }

    // EXPENSE  ==================
    case "ADD_EXPENSE": {
      const expense = action.payload;
      const variant: "living" | "rent" | "debt" | "house_loan" | "car_loan" = expense.variant;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: [...state.expenses[variant], expense],
        },
      };
    }

    case "UPDATE_EXPENSE": {
      const expense = action.payload;
      const variant: "living" | "rent" | "debt" | "house_loan" | "car_loan" = expense.variant;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: state.expenses[variant].map(e => (e.id === expense.id ? expense : e)),
        },
      };
    }

    case "DELETE_EXPENSE": {
      const { id, variant } = action.payload;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: state.expenses[variant].filter(e => e.id !== id),
        },
      };
    }

    // ASSET  ==================
    case "ADD_ASSET": {
      const asset = action.payload;
      const variant: "house" | "car" = asset.variant;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: [...state.assets[variant], asset],
        },
      };
    }

    case "UPDATE_ASSET": {
      const asset = action.payload;
      const variant: "house" | "car" = asset.variant;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: state.assets[variant].map(a => (a.id === asset.id ? asset : a)),
        },
      };
    }

    case "DELETE_ASSET": {
      const { id, variant } = action.payload;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: state.assets[variant].filter(a => a.id !== id),
        },
      };
    }

    default:
      return state;
  }
}

const INITIAL_STATE: SimRequest = {
  start_year: 1,
  end_year: SIM_MAX,

  accounts: {
    checking: [],
    taxable_investments: [],
    employer_retirement: [],
  },
  incomes: {
    salary: [],
    hourly: [],
    side: [],
  },
  expenses: {
    living: [],
    rent: [],
    house_loan: [],
    car_loan: [],
    debt: [],
  },
  assets: {
    house: [],
    car: [],
  },
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
      formComponent: EmployerRetirementAccountForm,
      editFormComponent: EditEmployerRetirementAccountForm,
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
    house_loan: {
      id: "home_loan",
      name: "Home Loan",
      emoji: "🏡",
      //formComponent: HouseLoanExpenseForm,
      //editFormComponent: EditHouseLoanExpenseForm,
    },
  
    car_loan: {
      id: "car_loan",
      name: "Car Loan",
      emoji: "🚗",
      //formComponent: CarLoanExpenseForm,
      //editFormComponent: EditCarLoanExpenseForm,
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
  const [balance, setBalance] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [tiers, setTiers] = useState<Array<{ threshold: number; annual_rate: number }>>([{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "checking",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        balance: Number(balance),
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
        threshold: tiers[tiers.length - 1]?.threshold ?? 0,
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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          💰
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Add Checking Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Track your checking account balance and tiered interest rates.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Main Checking, Emergency Fund" required />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="10,000" type="number" required />
              </div>
            </div>

            {/* Interest Tiers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={e => handleTierThresholdInput(e, index, tiers, setTiers)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div style={{ ...tierInputStyle, flex: 0.6 }}>
                      <label style={{ ...formLabelStyle, marginBottom: "6px" }}>APY (%)</label>
                      <input value={tier.annual_rate} onChange={e => updateTier(index, "annual_rate", e.target.value)} style={formInputStyle} placeholder="0.03" type="number" step="0.0001" />
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
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" style={{ ...formSubmitButtonStyle, marginTop: "28px" }}>
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
      type: "ADD_ACCOUNT",
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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          📈
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Add Taxable Investment Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Track your brokerage account with returns and dividend strategies.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Fidelity Brokerage" required />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="50,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Monthly Contribution</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  /mo
                </span>
                <input value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="1,000" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Expected Annual Return</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(expectedReturn).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>

            {/* Dividend Yield slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Dividend Yield</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(dividendYield).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={e => setDividendYield(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" style={{ ...formSubmitButtonStyle, marginTop: "28px" }}>
          Add Taxable Investment Account
        </button>
      </form>
    </div>
  );
}

function EmployerRetirementAccountForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("7");
  const [employerMatch, setEmployerMatch] = useState("4");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkedIncomeId, setLinkedIncomeId] = useState("");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];
  const hasIncomes = allJobs.length > 0;

  // Calculate annual contribution preview
  const monthlyNum = Number(monthlyContribution) || 0;
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const handleLinkToggle = enabled => {
    setLinkEnabled(enabled);
    if (enabled && hasIncomes && !linkedIncomeId) {
      // Auto-select first job and sync years
      const firstJob = allJobs[0];
      setLinkedIncomeId(firstJob.id);
      setStartYear(firstJob.start_year.toString());
      setEndYear(firstJob.end_year.toString());
    }
  };

  const handleJobSelect = jobId => {
    setLinkedIncomeId(jobId);
    const job = allJobs.find(j => j.id === jobId);
    if (job) {
      setStartYear(job.start_year.toString());
      setEndYear(job.end_year.toString());
    }
  };

  const onSubmit = e => {
    e.preventDefault();

    const newAccountId = crypto.randomUUID();

    const newAccount = {
      source_type: "liquid",
      variant: "employer_retirement",
      id: newAccountId,
      name,
      start_year: Number(startYear),
      end_year: Number(endYear),
      starting_balance: Number(balance),
      monthly_contribution: Number(monthlyContribution),
      expected_return: Number(expectedReturn) / 100,
      employer_match: Number(employerMatch) / 100,
      linked_income_id: linkEnabled && linkedIncomeId ? linkedIncomeId : null,
    };

    dispatch({ type: "ADD_ACCOUNT", payload: newAccount });

    // Update linked salary
    if (linkEnabled && linkedIncomeId) {
      const linkedJob = allJobs.find(j => j.id === linkedIncomeId);
      if (linkedJob) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...linkedJob,
            linked_401k_id: newAccountId,
          },
        });
      }
    }

    // Reset form
    setName("");
    setBalance("");
    setMonthlyContribution("");
    setExpectedReturn("7");
    setEmployerMatch("4");
    setStartYear("");
    setEndYear("");
    setLinkEnabled(false);
    setLinkedIncomeId("");
  };

  const linkedJob = linkedIncomeId ? allJobs.find(job => job.id === linkedIncomeId) : null;

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          🏢
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Add Employer Retirement Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Track your 401(k), 403(b), or pension and optionally link it to a job.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Fidelity 401(k)" required />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="25,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Monthly Contribution</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  /mo
                </span>
                <input value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="500" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Expected Annual Return</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(expectedReturn).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>

            {/* Employer Match slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Employer Match</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(employerMatch).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={e => setEmployerMatch(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={{ ...formInputStyle }} placeholder="1" type="number" required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={{ ...formInputStyle }} placeholder="40" type="number" required />
              </div>
            </div>

            {/* Link to job card */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB33",
                background: "#FAFCFC",
                overflow: "hidden",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "15px" }}>💼</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--primary)",
                        marginBottom: "1px",
                      }}>
                      Link to a job
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Sync contribution years automatically</div>
                  </div>
                </div>
                {/* Toggle */}
                <div onClick={() => hasIncomes && handleLinkToggle(!linkEnabled)} style={{ width: "36px", height: "20px", borderRadius: "10px", flexShrink: 0, cursor: hasIncomes ? "pointer" : "not-allowed", background: linkEnabled ? "#5FA7AB" : "#D1D5DB", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: "3px", left: linkEnabled ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
              </div>

              {linkEnabled && (
                <div
                  style={{
                    padding: "0 14px 14px",
                    borderTop: "1px solid #5FA7AB22",
                    paddingTop: "12px",
                  }}>
                  {!hasIncomes ? (
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>No jobs yet — add a qualifying job first.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <select value={linkedIncomeId} onChange={e => handleJobSelect(e.target.value)} style={{ ...formInputStyle, background: "#fff" }}>
                        <option value="">Select a job</option>
                        {allJobs.map(job => (
                          <option key={job.id} value={job.id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                      {linkedJob && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}>
                          🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Annual contribution preview */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB22",
                background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)",
                padding: "16px",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px" }}>✨</span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#5FA7AB",
                  }}>
                  Annual Contribution
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}>
                ${annualTotal.toLocaleString()}
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 400,
                    color: "var(--text-secondary)",
                    marginLeft: "4px",
                  }}>
                  /yr
                </span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "28px",
            paddingTop: "18px",
            borderTop: "1px solid #5FA7AB22",
          }}>
          <button type="submit" style={formSubmitButtonStyle}>
            Save Account
          </button>
        </div>
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
        asset_value: Number(carValue),
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

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Car Name" />

      <input value={carValue} onChange={e => setCarValue(e.target.value)} placeholder="Car Value" type="number" />

      <input value={depreciation} onChange={e => setDepreciation(e.target.value)} placeholder="Annual Depreciation %" type="number" />

      <input value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

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
        asset_value: Number(houseValue),
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

      <input value={name} onChange={e => setName(e.target.value)} placeholder="House Name" />

      <input value={houseValue} onChange={e => setHouseValue(e.target.value)} placeholder="House Value" type="number" />

      <input value={appreciation} onChange={e => setAppreciation(e.target.value)} placeholder="Annual Appreciation %" type="number" />

      <input value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

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
        monthly_expense: Number(amount),
        expense_growth: Number(growth),
      },
    });

    setName("Living Expense");
    setAmount("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Living Expenses</h3>

      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monthly Living Cost" />

      <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="Growth %" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Living Expenses</button>
    </form>
  );
}

function DebtExpenseForm({ dispatch }) {
  const [name, setName] = useState("Debt Expense");
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
        source_type: "expense",
        variant: "debt",
        id: crypto.randomUUID(),
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    setName("Debt Expense");
    setDebtAmount("");
    setMonthlyPayment("");
    setInterestRate("");
    setStartYear("");
    setEndYear("");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="text" placeholder="Debt name" value={name} onChange={e => setName(e.target.value)} />

      <input type="number" placeholder="Debt amount" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} required />

      <input type="number" placeholder="Monthly payment" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} required />

      <input type="number" placeholder="Interest rate % (optional)" value={interestRate} onChange={e => setInterestRate(e.target.value)} />

      <input type="number" placeholder="Start year" value={startYear} onChange={e => setStartYear(e.target.value)} required />

      <input type="number" placeholder="End year (optional)" value={endYear} onChange={e => setEndYear(e.target.value)} />

      <button type="submit">Add Debt</button>
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
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
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

      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monthly Rent" />

      <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="Annual Rent Growth %" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Add Rent</button>
    </form>
  );
}

// INCOME FORMS
export function SalaryForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [linked401kId, setLinked401kId] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];

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
        linked_401k_id: linked401kId || undefined,
      },
    });

    setName("");
    setNetIncome("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
    setLinked401kId("");
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          💼
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Add Salary Income
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Track your employment income and annual growth rate.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Income Details
            </p>

            {/* Job Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Job Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Software Engineer" required />
            </div>

            {/* Annual Income */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Annual Net Income</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={netIncome} onChange={e => setNetIncome(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="120,000" type="number" required />
              </div>
            </div>

            {/* Annual Growth */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Annual Growth Rate</label>
              <div style={{ position: "relative" }}>
                <input value={growth} onChange={e => setGrowth(e.target.value)} style={{ ...formInputStyle, paddingRight: "28px" }} placeholder="3" type="number" step="0.1" />
                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  %
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" required />
              </div>
            </div>

            {/* Link to 401k card */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB33",
                background: "#FAFCFC",
                padding: "14px",
              }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--teal)",
                }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={e => setLinked401kId(e.target.value)} style={formInputStyle}>
                    <option value="">Select an account</option>

                    {available401ks.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#5FA7AB",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}>
                      🔗 Linked to {available401ks.find(a => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}>
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "28px",
            paddingTop: "18px",
            borderTop: "1px solid #5FA7AB22",
          }}>
          <button type="submit" style={formSubmitButtonStyle}>
            Add Salary
          </button>
        </div>
      </form>
    </div>
  );
}
function HourlyWageForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState("");
  const [linked401kId, setLinked401kId] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "hourly",
        id: crypto.randomUUID(),
        name: name || "Hourly Job",
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        income_growth: Number(growth),
        linked_401k_id: linked401kId || undefined,
      },
    });

    setName("");
    setStartYear("");
    setEndYear("");
    setHourlyRate("");
    setHoursPerWeek("");
    setGrowth("");
    setLinked401kId("");
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>⏱️</div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>Add Hourly Wage Income</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Track hourly income, weekly hours, and projected growth.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Income Details</p>

            {/* Job Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Job Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Hourly Rate</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>/hr</span>
                <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="25" type="number" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Hours Per Week</label>
              <div style={{ position: "relative" }}>
                <input value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} style={{ ...formInputStyle, paddingRight: "45px" }} placeholder="40" type="number" />
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Annual Growth Rate</label>
              <div style={{ position: "relative" }}>
                <input value={growth} onChange={e => setGrowth(e.target.value)} style={{ ...formInputStyle, paddingRight: "28px" }} placeholder="3" type="number" step="0.1" />
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Timeline</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB33", background: "#FAFCFC", padding: "14px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)" }}>Link 401(k) Account</label>
                <select value={linked401kId} onChange={e => setLinked401kId(e.target.value)} style={formInputStyle}>
                  <option value="">None - No linking</option>
                  {available401ks.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div style={{ fontSize: "0.68rem", color: "#5FA7AB", marginTop: "8px", display: "flex", alignItems: "center", gap: "5px" }}>🔗 Linked to {available401ks.find(a => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>💰</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>Estimated Annual Income</span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${annualIncome.toLocaleString()}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "4px" }}>/yr</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button type="submit" style={formSubmitButtonStyle}>
            Add Hourly Income
          </button>
        </div>
      </form>
    </div>
  );
}

function SideHustleForm({ dispatch }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [averageIncome, setAverageIncome] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [variability, setVariability] = useState("5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🚀</div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>Add Side Hustle Income</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Track variable income with frequency and variability estimates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Income Details</p>

            {/* Side Hustle Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Side Hustle Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Average Income Per Period</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <input value={averageIncome} onChange={e => setAverageIncome(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="500" type="number" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={formInputStyle}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Income Variability</label>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={e => setVariability(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
              <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Timeline</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>💰</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>Estimated Annual Income</span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${annualIncome.toLocaleString()}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "4px" }}>/yr</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button type="submit" style={formSubmitButtonStyle}>
            Add Side Hustle
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- EDIT INCOME FORMS -------------------- */

export function EditSalaryForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [netIncome, setNetIncome] = useState(item.net_income.toString());
  const [growth, setGrowth] = useState(item.income_growth.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");

  const available401ks = state?.accounts?.employer_retirement || [];

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
        linked_401k_id: linked401kId || undefined,
      },
    });

    onClose();
  };

  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        margin: "25px",
      }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          💼
        </div>

        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Edit Salary Income
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Update your employment income and growth details.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "28px",
          }}>
          {/* ── LEFT ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Income Details
            </p>

            {/* Job Name */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
              <label style={formLabelStyle}>Job Name</label>

              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Software Engineer" />
            </div>

            {/* Annual Income */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
              <label style={formLabelStyle}>Annual Net Income</label>

              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>

                <input
                  value={netIncome}
                  onChange={e => setNetIncome(e.target.value)}
                  style={{
                    ...formInputStyle,
                    paddingLeft: "22px",
                  }}
                  placeholder="120,000"
                  type="number"
                />
              </div>
            </div>

            {/* Annual Growth */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
              <label style={formLabelStyle}>Annual Growth Rate</label>

              <div style={{ position: "relative" }}>
                <input
                  value={growth}
                  onChange={e => setGrowth(e.target.value)}
                  style={{
                    ...formInputStyle,
                    paddingRight: "28px",
                  }}
                  placeholder="3"
                  type="number"
                  step="0.1"
                />

                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  %
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}>
                <label style={formLabelStyle}>Start yr</label>

                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}>
                <label style={formLabelStyle}>End yr</label>

                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB33",
                background: "#FAFCFC",
                padding: "14px",
              }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--teal)",
                }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={e => setLinked401kId(e.target.value)} style={formInputStyle}>
                    <option value="">Select an account</option>

                    {available401ks.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#5FA7AB",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}>
                      🔗 Linked to {available401ks.find(a => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}>
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "28px",
            paddingTop: "18px",
            borderTop: "1px solid #5FA7AB22",
          }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...formSubmitButtonStyle,
              background: "transparent",
              color: "var(--primary)",
              border: "1px solid #5FA7AB44",
              fontWeight: 500,
            }}>
            Cancel
          </button>

          <button type="submit" style={formSubmitButtonStyle}>
            Update Salary
          </button>
        </div>
      </form>
    </div>
  );
}

function EditHourlyWageForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [hourlyRate, setHourlyRate] = useState(item.hourly_rate?.toString() || "");
  const [hoursPerWeek, setHoursPerWeek] = useState(item.hours_per_week?.toString() || "");
  const [growth, setGrowth] = useState(item.income_growth.toString());
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;
  const growthRate = Number(growth) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        hourly_rate: Number(hourlyRate),
        hours_per_week: Number(hoursPerWeek),
        net_income: annualIncome,
        income_growth: Number(growth),
        linked_401k_id: linked401kId || undefined,
      },
    });

    onClose();
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>⏱️</div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>Edit Hourly Wage Income</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Update hourly rate, weekly hours, and growth details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Income Details</p>

            {/* Job Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Job Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Hourly Rate</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>/hr</span>
                <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="25" type="number" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Hours Per Week</label>
              <div style={{ position: "relative" }}>
                <input value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} style={{ ...formInputStyle, paddingRight: "45px" }} placeholder="40" type="number" />
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Annual Growth Rate</label>
              <div style={{ position: "relative" }}>
                <input value={growth} onChange={e => setGrowth(e.target.value)} style={{ ...formInputStyle, paddingRight: "28px" }} placeholder="3" type="number" step="0.1" />
                <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", color: "#5FA7AB99", pointerEvents: "none" }}>%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Timeline</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB33", background: "#FAFCFC", padding: "14px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)" }}>Link 401(k) Account</label>
                <select value={linked401kId} onChange={e => setLinked401kId(e.target.value)} style={formInputStyle}>
                  <option value="">None - No linking</option>
                  {available401ks.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div style={{ fontSize: "0.68rem", color: "#5FA7AB", marginTop: "8px", display: "flex", alignItems: "center", gap: "5px" }}>🔗 Linked to {available401ks.find(a => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>💰</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>Estimated Annual Income</span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${annualIncome.toLocaleString()}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "4px" }}>/yr</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button type="button" onClick={onClose} style={{ ...formSubmitButtonStyle, background: "transparent", color: "var(--primary)", border: "1px solid #5FA7AB44", fontWeight: 500 }}>
            Cancel
          </button>
          <button type="submit" style={formSubmitButtonStyle}>
            Update Hourly Income
          </button>
        </div>
      </form>
    </div>
  );
}

function EditSideHustleForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [averageIncome, setAverageIncome] = useState(item.average_income_per_period?.toString() || "");
  const [frequency, setFrequency] = useState(item.frequency || "monthly");
  const [variability, setVariability] = useState((item.variability * 100)?.toString() || "5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🚀</div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>Edit Side Hustle Income</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Update frequency, variability, and income details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Income Details</p>

            {/* Side Hustle Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Side Hustle Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Average Income Per Period</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <input value={averageIncome} onChange={e => setAverageIncome(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="500" type="number" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={formInputStyle}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Income Variability</label>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={e => setVariability(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
              <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>Timeline</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>💰</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>Estimated Annual Income</span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${annualIncome.toLocaleString()}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "4px" }}>/yr</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button type="button" onClick={onClose} style={{ ...formSubmitButtonStyle, background: "transparent", color: "var(--primary)", border: "1px solid #5FA7AB44", fontWeight: 500 }}>
            Cancel
          </button>
          <button type="submit" style={formSubmitButtonStyle}>
            Update Side Hustle
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- EDIT ASSET FORMS -------------------- */
export function EditHouseAssetForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [houseValue, setHouseValue] = useState(item.asset_value.toString());
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
        asset_value: Number(houseValue),
        annual_appreciation: Number(appreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit House</h3>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="House Name" />

      <input value={houseValue} onChange={e => setHouseValue(e.target.value)} placeholder="House Value" type="number" />

      <input value={appreciation} onChange={e => setAppreciation(e.target.value)} placeholder="Annual Appreciation %" type="number" />

      <input value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

      <button type="submit">Save House</button>
    </form>
  );
}

export function EditCarAssetForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [carValue, setCarValue] = useState(item.asset_value.toString());
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
        asset_value: Number(carValue),
        annual_depreciation: Number(depreciation) / 100,
        down_payment: downPayment === "" ? null : Number(downPayment),
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Car</h3>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Car Name" />

      <input value={carValue} onChange={e => setCarValue(e.target.value)} placeholder="Car Value" type="number" />

      <input value={depreciation} onChange={e => setDepreciation(e.target.value)} placeholder="Annual Depreciation %" type="number" />

      <input value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="Down Payment optional" type="number" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

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
        variant: "living",
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

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Expense Name" />

      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monthly Living Expense" />

      <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="Annual Growth %" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" />

      <button type="submit">Save Living Expenses</button>
    </form>
  );
}

export function EditRentExpenseForm({ item, dispatch, onClose }) {
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "rent",
        name: "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Rent</h3>

      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montly Rent" />

      <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="Rent Growth %" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year" />

      <button type="submit">Save Rent</button>
    </form>
  );
}

export function EditDebtExpenseForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [debtAmount, setDebtAmount] = useState(item.debt_amount.toString());
  const [monthlyPayment, setMonthlyPayment] = useState(item.monthly_expense.toString());
  const [interestRate, setInterestRate] = useState(item.interest_rate == null ? "" : (item.interest_rate * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "debt",
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    onClose();
  };

  return (
    <form onSubmit={onSubmit}>
      <h3>Edit Debt</h3>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Debt Name" />

      <input value={debtAmount} onChange={e => setDebtAmount(e.target.value)} placeholder="Debt Amount" type="number" />

      <input value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} placeholder="Monthly Payment" type="number" />

      <input value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Interest Rate % optional" type="number" />

      <input value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="Start Year" type="number" />

      <input value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="End Year optional" type="number" />

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
      type: "UPDATE_ACCOUNT",
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
        threshold: (tiers[tiers.length - 1]?.threshold ?? 0) + 50000,
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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          💰
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Edit Checking Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Update your checking account balance and tiered interest rates.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Main Checking, Emergency Fund" />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="10,000" type="number" />
              </div>
            </div>

            {/* Interest Tiers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={e => handleTierThresholdInput(e, index, tiers, setTiers)} style={formInputStyle} placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div style={{ ...tierInputStyle, flex: 0.6 }}>
                      <label style={{ ...formLabelStyle, marginBottom: "6px" }}>APY (%)</label>
                      <input value={tier.annual_rate} onChange={e => updateTier(index, "annual_rate", e.target.value)} style={formInputStyle} placeholder="0.03" type="number" step="0.0001" />
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
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" style={{ ...formSubmitButtonStyle, marginTop: "28px" }}>
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

  const onSubmit = e => {
    e.preventDefault();
    dispatch({
      type: "UPDATE_ACCOUNT",
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
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          📈
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Edit Taxable Investment Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Update your brokerage account with returns and dividend strategies.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Fidelity Brokerage" />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="50,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Monthly Contribution</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  /mo
                </span>
                <input value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="1,000" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Expected Annual Return</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(expectedReturn).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>

            {/* Dividend Yield slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Dividend Yield</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(dividendYield).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={e => setDividendYield(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={formInputStyle} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={formInputStyle} placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" style={{ ...formSubmitButtonStyle, marginTop: "28px" }}>
          Save Taxable Investment Account
        </button>
      </form>
    </div>
  );
}

function EditEmployerRetirementAccountForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "7");
  const [employerMatch, setEmployerMatch] = useState((item.employer_match * 100)?.toString() || "4");
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [linkEnabled, setLinkEnabled] = useState(!!item.linked_income_id);
  const [linkedIncomeId, setLinkedIncomeId] = useState(item.linked_income_id || "");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];
  const hasIncomes = allJobs.length > 0;

  // Calculate annual contribution preview
  const monthlyNum = Number(monthlyContribution) || 0;
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const handleLinkToggle = enabled => {
    setLinkEnabled(enabled);
    if (enabled && hasIncomes && !linkedIncomeId) {
      // Auto-select first job and sync years
      const firstJob = allJobs[0];
      setLinkedIncomeId(firstJob.id);
      setStartYear(firstJob.start_year.toString());
      setEndYear(firstJob.end_year.toString());
    }
  };

  const handleJobSelect = jobId => {
    setLinkedIncomeId(jobId);
    const job = allJobs.find(j => j.id === jobId);
    if (job) {
      setStartYear(job.start_year.toString());
      setEndYear(job.end_year.toString());
    }
  };

  const onSubmit = e => {
    e.preventDefault();

    const updatedAccount = {
      source_type: "liquid",
      variant: "employer_retirement",
      id: item.id,
      name,
      start_year: Number(startYear),
      end_year: Number(endYear),
      starting_balance: Number(balance),
      monthly_contribution: Number(monthlyContribution),
      expected_return: Number(expectedReturn) / 100,
      employer_match: Number(employerMatch) / 100,
      linked_income_id: linkEnabled && linkedIncomeId ? linkedIncomeId : null,
    };

    dispatch({ type: "UPDATE_ACCOUNT", payload: updatedAccount });

    onClose();
  };

  const linkedJob = linkedIncomeId ? allJobs.find(job => job.id === linkedIncomeId) : null;

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#5FA7AB18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
          🏢
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}>
            Edit Employer Retirement Account
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
            Update your 401(k), 403(b), or pension details.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Account Details
            </p>

            {/* Account Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Account Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={formInputStyle} placeholder="Fidelity 401(k)" />
            </div>

            {/* Starting Balance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Starting Balance</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <input value={balance} onChange={e => setBalance(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px" }} placeholder="25,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Monthly Contribution</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.72rem",
                    color: "#5FA7AB",
                    pointerEvents: "none",
                  }}>
                  $
                </span>
                <span
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.68rem",
                    color: "#5FA7AB99",
                    pointerEvents: "none",
                  }}>
                  /mo
                </span>
                <input value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} style={{ ...formInputStyle, paddingLeft: "22px", paddingRight: "38px" }} placeholder="500" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Expected Annual Return</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(expectedReturn).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>

            {/* Employer Match slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Employer Match</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {Number(employerMatch).toFixed(1)}%
                </span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={e => setEmployerMatch(e.target.value)} style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }} />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--teal)",
                paddingBottom: "8px",
                borderBottom: "1px solid #5FA7AB22",
              }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input value={startYear} onChange={e => setStartYear(e.target.value)} style={{ ...formInputStyle }} placeholder="1" type="number" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>End yr</label>
                <input value={endYear} onChange={e => setEndYear(e.target.value)} style={{ ...formInputStyle }} placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to job card */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB33",
                background: "#FAFCFC",
                overflow: "hidden",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "15px" }}>💼</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--primary)",
                        marginBottom: "1px",
                      }}>
                      Link to a job
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Sync contribution years automatically</div>
                  </div>
                </div>
                {/* Toggle */}
                <div
                  onClick={() => hasIncomes && handleLinkToggle(!linkEnabled)}
                  style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    cursor: hasIncomes ? "pointer" : "not-allowed",
                    background: linkEnabled ? "#5FA7AB" : "#D1D5DB",
                    position: "relative",
                    transition: "background 0.2s",
                  }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: linkEnabled ? "19px" : "3px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>

              {linkEnabled && (
                <div
                  style={{
                    padding: "0 14px 14px",
                    borderTop: "1px solid #5FA7AB22",
                    paddingTop: "12px",
                  }}>
                  {!hasIncomes ? (
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>No jobs yet — add a qualifying job first.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <select value={linkedIncomeId} onChange={e => handleJobSelect(e.target.value)} style={{ ...formInputStyle, background: "#fff" }}>
                        <option value="">Select a job</option>
                        {allJobs.map(job => (
                          <option key={job.id} value={job.id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                      {linkedJob && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}>
                          🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Annual contribution preview */}
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB22",
                background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)",
                padding: "16px",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px" }}>✨</span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#5FA7AB",
                  }}>
                  Annual Contribution
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}>
                ${annualTotal.toLocaleString()}
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 400,
                    color: "var(--text-secondary)",
                    marginLeft: "4px",
                  }}>
                  /yr
                </span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "28px",
            paddingTop: "18px",
            borderTop: "1px solid #5FA7AB22",
          }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...formSubmitButtonStyle,
              background: "transparent",
              color: "var(--primary)",
              border: "1px solid #5FA7AB44",
              fontWeight: 500,
            }}>
            Cancel
          </button>
          <button type="submit" style={formSubmitButtonStyle}>
            Update Account
          </button>
        </div>
      </form>
    </div>
  );
}
/* -------------------- Feedback Model -------------------- */
function getAnonymousId() {
  const storageKey = "vantage_anonymous_id";

  let anonymousId = localStorage.getItem(storageKey);

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    localStorage.setItem(storageKey, anonymousId);
  }

  return anonymousId;
}

function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rating, setRating] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const feedbackPayload = {
      userProvided: {
        satisfaction: Number(rating),
        category,
        message,
        email: email || null,
      },
      metaData: {
        anonymousId: getAnonymousId(),
        pageUrl: window.location.href,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        browserAndOS: navigator.userAgent,
        referralSource: document.referrer || null,
        utmParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      },
    };

    console.log("User Feedback Submitted:", feedbackPayload);

    setRating("");
    setCategory("General");
    setMessage("");
    setEmail("");

    onClose();
  }

  return (
    <div style={feedbackOverlayStyle} onClick={onClose}>
      <div style={feedbackModalStyle} onClick={event => event.stopPropagation()}>
        <div style={feedbackHeaderStyle}>
          <div>
            <h2 style={feedbackTitleStyle}>Leave Feedback</h2>
            <p style={feedbackDescriptionStyle}>We’re a small team building quickly, and we’d genuinely appreciate any feedback that could help us improve.</p>
          </div>

          <button type="button" style={feedbackCloseStyle} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={feedbackFormStyle}>
          <label style={feedbackLabelStyle}>
            Satisfaction Rating
            <select value={rating} onChange={event => setRating(event.target.value)} required style={feedbackInputStyle}>
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(number => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>

          <label style={feedbackLabelStyle}>
            Feedback Category
            <select value={category} onChange={event => setCategory(event.target.value)} style={feedbackInputStyle}>
              <option>Bug</option>
              <option>Feature Request</option>
              <option>UX Confusion</option>
              <option>Questions</option>
              <option>General</option>
            </select>
          </label>

          <label style={feedbackLabelStyle}>
            Feedback / Questions
            <textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Write your feedback or questions..." rows={5} required style={feedbackInputStyle} />
          </label>

          <label style={feedbackLabelStyle}>
            Email Optional
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Only if you want a follow-up" style={feedbackInputStyle} />
          </label>

          <div style={feedbackActionsStyle}>
            <button type="button" style={feedbackSecondaryStyle} onClick={onClose}>
              Cancel
            </button>

            <button type="submit" style={feedbackPrimaryStyle}>
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const feedbackOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 12, 30, 0.45)",
  backdropFilter: "blur(8px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "24px",
};

const feedbackModalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "85vh",
  overflowY: "auto",
  background: "#ffffff",
  border: "1px solid rgba(124, 58, 237, 0.14)",
  borderRadius: "24px",
  boxShadow: "0 24px 80px rgba(31, 18, 74, 0.24)",
  padding: "28px",
  position: "relative",

  fontFamily: '"Inter", "Manrope", "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const feedbackHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const feedbackTitleStyle: CSSProperties = {
  margin: 0,
  color: "#161225",
  fontSize: "1.85rem",
  fontWeight: 900,
  letterSpacing: "-0.04em",
  lineHeight: 1.05,
};

const feedbackDescriptionStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#6b647c",
  fontSize: "0.95rem",
  fontWeight: 500,
  lineHeight: 1.55,
};

const feedbackCloseStyle: CSSProperties = {
  border: "none",
  background: "#f4efff",
  color: "#6d28d9",
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  fontSize: "24px",
  cursor: "pointer",
  lineHeight: 1,
};

const feedbackFormStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
};

const feedbackLabelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  color: "#27213a",
  fontSize: "0.9rem",
  fontWeight: 800,
  letterSpacing: "-0.01em",
};

const feedbackInputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #e4ddf5",
  background: "#fbfaff",
  borderRadius: "14px",
  padding: "12px 14px",
  color: "#161225",
  font: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const feedbackActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "8px",
};

const feedbackSecondaryStyle: CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f5f2fb",
  color: "#4b4263",
  letterSpacing: "-0.02em",
};

const feedbackPrimaryStyle: CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(135deg, #7c3aed, #9f67ff)",
  color: "white",
  boxShadow: "0 10px 28px rgba(124, 58, 237, 0.28)",
  letterSpacing: "-0.02em",
};

const feedbackNavButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  marginTop: "512px",
};

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
  borderRadius: "12px",
  width: "90vw",
  maxWidth: "700px", // or 800px for your 2-col form
  maxHeight: "90vh",
  overflow: "hidden", // Prevent body overflow
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
  border: "1px solid #e5e7eb",
};

const closeBtn: CSSProperties = {
  marginLeft: "auto",
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

const modalHeaderStyle: CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "16px",
  marginBottom: "0",
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "20px 24px",
  justifyContent: "space-between",
};

const modalBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
  margin: "25px",
};

export function FinancialEntityModalCell({ item, setSelectedVariant }) {
  return (
    <div style={cellStyle} onClick={() => setSelectedVariant(item.id)}>
      <span>{item.emoji}</span>
      <span>{item.name}</span>
    </div>
  );
}

export function Modal({ setIsModalOpen, data, category, dispatch, variantBeingEdited, state }) {
  const [selectedVariant, setSelectedVariant] = useState(variantBeingEdited?.variant || null);

  const goBack = () => setSelectedVariant(null);
  const closeModal = () => setIsModalOpen(false);

  const FormComponent = selectedVariant ? (variantBeingEdited ? ENTITY_CONFIG[category][selectedVariant]?.editFormComponent : ENTITY_CONFIG[category][selectedVariant]?.formComponent) : null;

  let renderedForm;

  if (selectedVariant) {
    if (!FormComponent) {
      renderedForm = <div>Form not implemented</div>;
    } else if (variantBeingEdited) {
      // i'm not sure how passing state for one edit form doesn't affect others check on this, but it works for now
      renderedForm = <FormComponent item={variantBeingEdited} state={state} dispatch={dispatch} onClose={closeModal} />;
    }
    // else if (selectedVariant === "employer_retirement") {
    //   renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} />;
    // }
    // else if (selectedVariant === "salary") {
    //   renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} />;
    // }
    else {
      renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} />;
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ENTITY PICKER HEADER */}
        {!selectedVariant && !variantBeingEdited && (
          <div style={modalHeaderStyle}>
            <button style={closeBtn} onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ADD FORM HEADER */}
        {selectedVariant && !variantBeingEdited && (
          <div style={modalHeaderStyle}>
            <button onClick={goBack}>← Back</button>

            <button style={closeBtn} onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* EDIT FORM HEADER */}
        {variantBeingEdited && (
          <div style={modalHeaderStyle}>
            {/* <div>icon + title + description</div> */}

            <button style={closeBtn} onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ENTITY SOURCE SELECTION MODAL */}
        {!selectedVariant && !variantBeingEdited && (
          <div style={modalBodyStyle}>
            {data.map(item => (
              <FinancialEntityModalCell key={item.id} item={item} setSelectedVariant={setSelectedVariant} />
            ))}
          </div>
        )}

        {/* EDIT/ADD MODAL */}
        {renderedForm}
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
      account: "DELETE_ACCOUNT",
      income: "DELETE_INCOME",
      expense: "DELETE_EXPENSE",
      asset: "DELETE_ASSET",
    }[category];

    dispatch({
      type: deleteType,
      payload: { id: item.id, variant: item.variant },
    });
  };

  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <p style={rowNameStyle}>{item.name}</p>
        <div style={rowMetaStyle}>
          {item.balance != null && <span>${formatNumberWithCommas(item.balance.toString())}</span>}
          {item.net_income != null && <span>${formatNumberWithCommas(item.net_income.toString())}</span>}
          {item.monthly_expense != null && <span>${formatNumberWithCommas(item.monthly_expense.toString())}</span>}
          {item.asset_value != null && <span>${formatNumberWithCommas(item.asset_value.toString())}</span>}
          <span>
            {item.start_year}–{item.end_year}
          </span>
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

  const handleEdit = item => {
    setVariantBeingEdited(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVariantBeingEdited(null);
  };

  const data = Object.values(ENTITY_CONFIG[category]).map(v => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
  }));

  const getItems = () => {
    switch (category) {
      case "account":
        return [...state.accounts.checking, ...state.accounts.taxable_investments, ...state.accounts.employer_retirement];
      case "income":
        return [...state.incomes.salary, ...state.incomes.hourly, ...state.incomes.side];
      case "expense":
        return [...state.expenses.living, ...state.expenses.rent, ...state.expenses.debt];
      case "asset":
        return [...state.assets.house, ...state.assets.car];
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

        {getItems().map(item => (
          <EntityRow key={item.id} item={item} category={category} dispatch={dispatch} onEdit={handleEdit} />
        ))}
      </div>

      {isModalOpen && <Modal state={state} setIsModalOpen={handleCloseModal} data={data} category={category} dispatch={dispatch} variantBeingEdited={variantBeingEdited} />}
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

  const scrollByStep = direction => {
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
          <FinancialEntity state={state} entityName="Incomes" category="income" dispatch={dispatch} />
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
  return simResult.map(year => {
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

  const cash = payload.find(p => p.dataKey === "cash")?.value || 0;
  const assets = payload.find(p => p.dataKey === "assets")?.value || 0;

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

export function SimulationControls({ state, setSimResult }) {
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

function generateMockResults(years = 20, sourcesPerYear = 2): SimYearResult[] {
  return Array.from({ length: years }, (_, i) => {
    const year = 1 + i;

    return {
      year,
      net_worth: 500000 + i * 25000,
      total_cash: 50000 + i * 5000,
      total_income: 120000 + i * 3000,
      total_expenses: 80000 + i * 2000,

      sources: Array.from({ length: sourcesPerYear }, (_, j) => ({
        id: `${year}-${j}`,
        name: `Asset ${j + 1}`,
        source_type: j % 2 === 0 ? "investment" : "property",
        asset_value: 100000 + j * 10000,
        annual_cashflow: 5000 + j * 500,
        start_value: 80000 + j * 8000,
        end_value: 120000 + j * 12000,
      })),
    };
  });
}

export function SimResultViewer({ simResult }: { simResult: SimYearResult[] }) {
  const [openYears, setOpenYears] = useState<number[]>([]);

  const toggleYear = (year: number) => {
    setOpenYears(previousState => {
      console.log("Previous state from React:", previousState);

      const isOpen = previousState.includes(year);

      if (isOpen) {
        const nextState = previousState.filter(y => y !== year);
        console.log("Closing year → new state:", nextState);
        return nextState;
      }

      const nextState = [...previousState, year];
      console.log("Opening year → new state:", nextState);
      return nextState;
    });
  };

  const mockResults = generateMockResults();

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2>Simulation Results</h2>

        {/* to generate fake data use mockResults instead of simResult */}
        <button onClick={() => setOpenYears(simResult.map(y => y.year))}>Expand All</button>
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
          {/* to generate fake data use mockResults instead of simResult */}
          {simResult.map(yearData => (
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
                yearData.sources.map(src => (
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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
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
        <button type="button" className="dash-nav-item" style={feedbackNavButtonStyle} onClick={() => setIsFeedbackOpen(true)}>
          LEAVE FEEDBACK
        </button>
      </aside>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

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
