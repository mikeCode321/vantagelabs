"use client";
import "./dashboard.css";
import { SIM_MAX } from "@/app/testing/constants";
import { useState, useReducer, useEffect, useRef } from "react";
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
    car_loan: CarLoanExpense[];
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
          [variant]: state.accounts[variant].map((a) => (a.id === account.id ? account : a)),
        },
      };
    }

    case "DELETE_ACCOUNT": {
      const { id, variant } = action.payload;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: state.accounts[variant].filter((a) => a.id !== id),
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
          [variant]: state.incomes[variant].map((i) => (i.id === income.id ? income : i)),
        },
      };
    }

    case "DELETE_INCOME": {
      const { id, variant } = action.payload;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: state.incomes[variant].filter((i) => i.id !== id),
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
          [variant]: state.expenses[variant].map((e) => (e.id === expense.id ? expense : e)),
        },
      };
    }

    case "DELETE_EXPENSE": {
      const { id, variant } = action.payload;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: state.expenses[variant].filter((e) => e.id !== id),
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
          [variant]: state.assets[variant].map((a) => (a.id === asset.id ? asset : a)),
        },
      };
    }

    case "DELETE_ASSET": {
      const { id, variant } = action.payload;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: state.assets[variant].filter((a) => a.id !== id),
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💰</div>
        <div>
          <h3 className="form-header-title">Add Checking Account</h3>
          <p className="form-header-desc">Track your checking account balance and tiered interest rates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Main Checking, Emergency Fund" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="10,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            {/* Interest Tiers */}
            <div className="tier-list">
              <div className="tier-header">
                <label className="tier-title">Interest Tiers</label>
                <button type="button" className="tier-btn-add" onClick={addTier}>
                  + Add Tier
                </button>
              </div>

              {tiers.map((tier, index) => (
                <div key={index}>
                  <div className="tier-item">
                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">APY (%)</label>
                      <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} className="form-input" placeholder="0.03" type="number" step="0.0001" />
                    </div>

                    {tiers.length > 1 && (
                      <button type="button" className="tier-btn-remove" onClick={() => removeTier(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">📈</div>
        <div>
          <h3 className="form-header-title">Add Taxable Investment Account</h3>
          <p className="form-header-desc">Track your brokerage account with returns and dividend strategies.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="50,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="1,000" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Dividend Yield slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
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

  const handleLinkToggle = (enabled) => {
    setLinkEnabled(enabled);
    if (enabled && hasIncomes && !linkedIncomeId) {
      // Auto-select first job and sync years
      const firstJob = allJobs[0];
      setLinkedIncomeId(firstJob.id);
      setStartYear(firstJob.start_year.toString());
      setEndYear(firstJob.end_year.toString());
    }
  };

  const handleJobSelect = (jobId) => {
    setLinkedIncomeId(jobId);
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      setStartYear(job.start_year.toString());
      setEndYear(job.end_year.toString());
    }
  };

  const onSubmit = (e) => {
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
      const linkedJob = allJobs.find((j) => j.id === linkedIncomeId);
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

  const linkedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Add Employer Retirement Account</h3>
          <p className="form-header-desc">Track your 401(k), 403(b), or pension and optionally link it to a job.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="500" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Employer Match slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Employer Match</label>
                <span className="form-slider-value">{Number(employerMatch).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card__header">
                <div className="link-card__info">
                  <span className="preview-icon">💼</span>
                  <div>
                    <div className="link-card__title">Link to a job</div>
                    <div className="link-card__sub">Sync contribution years automatically</div>
                  </div>
                </div>
                {/* Toggle */}
                <div onClick={() => hasIncomes && handleLinkToggle(!linkEnabled)} className={`toggle ${linkEnabled ? "toggle--on" : ""} ${hasIncomes ? "toggle--enabled" : "toggle--disabled"}`}>
                  <div className={`toggle__knob ${linkEnabled ? "toggle__knob--on" : "toggle__knob--off"}`} />
                </div>
              </div>

              {linkEnabled && (
                <div className="link-card__body">
                  {!hasIncomes ? (
                    <p className="link-card__no-jobs">No jobs yet — add a qualifying job first.</p>
                  ) : (
                    <div className="form-field--gap8">
                      <select value={linkedIncomeId} onChange={(e) => handleJobSelect(e.target.value)} className="form-input">
                        <option value="">Select a job</option>
                        {allJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                      {linkedJob && (
                        <div className="link-card__synced">
                          🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Annual contribution preview */}
            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">✨</span>
                <span className="preview-card__label">Annual Contribution</span>
              </div>
              <div className="preview-card__amount preview-card__amount--lg">
                ${annualTotal.toLocaleString()}
                <span className="preview-card__unit preview-card__unit--lg">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
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
  const [depreciation, setDepreciation] = useState("12");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [savedCarAsset, setSavedCarAsset] = useState<CarAsset | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const carAsset = {
      source_type: "asset",
      variant: "car",

      id: crypto.randomUUID(),
      name: name || "Car",

      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),

      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,

      down_payment: downPayment === "" ? null : Number(downPayment),
    };

    dispatch({
      type: "ADD_ASSET",
      payload: carAsset,
    });

    setSavedCarAsset(carAsset);
    setShowLoanForm(true);
  };

  const depreciatedValue =
    Number(carValue) * (1 - (Number(depreciation) || 0) / 100);

  if (showLoanForm && savedCarAsset) {
    return (
      <CarLoanExpenseForm
        dispatch={dispatch}
        carAsset={savedCarAsset}
        onBack={() => setShowLoanForm(false)}
        onClose={() => {
          setName("");
          setCarValue("");
          setDepreciation("12");
          setDownPayment("");
          setStartYear("");
          setEndYear("");
          setSavedCarAsset(null);
          setShowLoanForm(false);
        }}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "20px",
          marginBottom: "24px",
          borderBottom: "1px solid #5FA7AB22",
        }}
      >
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
          }}
        >
          🚗
        </div>

        <div>
          <h3
            style={{
              margin: "0 0 3px 0",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Add Car
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Track a vehicle asset with depreciation and optional down payment.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "28px",
          }}
        >
          {/* LEFT */}
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
              }}
            >
              Vehicle Details
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Car Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={formInputStyle}
                placeholder="Mazda 3, Tesla Model 3"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Car Value</label>
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
                  }}
                >
                  $
                </span>

                <input
                  value={carValue}
                  onChange={(e) => setCarValue(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="30,000"
                  type="number"
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>
                Down Payment{" "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>

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
                  }}
                >
                  $
                </span>

                <input
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="5,000"
                  type="number"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label style={formLabelStyle}>Annual Depreciation</label>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Number(depreciation).toFixed(1)}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={40}
                step={0.1}
                value={depreciation}
                onChange={(e) => setDepreciation(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#5FA7AB",
                  height: "4px",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* RIGHT */}
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
              }}
            >
              Timeline
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="1"
                  type="number"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>
                  End yr{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                    (opt)
                  </span>
                </label>
                <input
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="5"
                  type="number"
                />
              </div>
            </div>

            <div
              style={{
                borderRadius: "8px",
                border: "1px solid #5FA7AB22",
                background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "12px" }}>📉</span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#5FA7AB",
                  }}
                >
                  Value After Year 1
                </span>
              </div>

              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                ${depreciatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                }}
              >
                -{Number(depreciation).toFixed(1)}% per year from $
                {(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "28px",
            paddingTop: "18px",
            borderTop: "1px solid #5FA7AB22",
          }}
        >
          <button type="submit" style={formSubmitButtonStyle}>
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}
function HouseAssetForm({ dispatch }) {
  const [name, setName] = useState("");
  const [houseValue, setHouseValue] = useState("");
  const [appreciation, setAppreciation] = useState("3");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const [savedHouse, setSavedHouse] = useState<any>(null);
  const [showLoanForm, setShowLoanForm] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const houseAsset = {
      source_type: "asset",
      variant: "house",
      id: crypto.randomUUID(),
      name: name || "House",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
    };

    dispatch({
      type: "ADD_ASSET",
      payload: houseAsset,
    });

    setSavedHouse(houseAsset);
    setShowLoanForm(true);
  };

  const appreciatedValue =
    Number(houseValue) * (1 + (Number(appreciation) || 0) / 100);

  if (showLoanForm && savedHouse) {
    return (
      <HouseLoanExpenseForm
        dispatch={dispatch}
        houseAsset={savedHouse}
        onBack={() => setShowLoanForm(false)}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🏡</div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>Add House</h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Track a property asset with appreciation and optional down payment.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Property Details
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Property Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={formInputStyle}
                placeholder="Primary Residence, Rental Property"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>House Value</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <input
                  value={houseValue}
                  onChange={e => setHouseValue(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="400,000"
                  type="number"
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>
                Down Payment <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <input
                  value={downPayment}
                  onChange={e => setDownPayment(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="80,000"
                  type="number"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Annual Appreciation</label>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                  {Number(appreciation).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.1}
                value={appreciation}
                onChange={e => setAppreciation(e.target.value)}
                style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input
                  value={startYear}
                  onChange={e => setStartYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="1"
                  type="number"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>
                  End yr <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(opt)</span>
                </label>
                <input
                  value={endYear}
                  onChange={e => setEndYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="30"
                  type="number"
                />
              </div>
            </div>

            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>📈</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>
                  Value After Year 1
                </span>
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${appreciatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                +{Number(appreciation).toFixed(1)}% per year from ${(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button type="submit" style={formSubmitButtonStyle}>
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

// EXPENSE FORMS

function calculateMonthlyLoanPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
) {
  const monthlyRate = annualInterestRate / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  return (
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

function HouseLoanExpenseForm({ dispatch, houseAsset, onBack, onClose }) {
  const [interestRate, setInterestRate] = useState("6.75");
  const [loanTermYears, setLoanTermYears] = useState("30");
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState("");

  const originalPrincipal =
    Number(houseAsset.asset_value || 0) - Number(houseAsset.down_payment || 0);

  const monthlyExpense =
    originalPrincipal > 0 && Number(interestRate) >= 0 && Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          originalPrincipal,
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "house_loan",

        id: crypto.randomUUID(),
        name: `${houseAsset.name} Loan`,

        start_year: houseAsset.start_year,
        end_year: houseAsset.start_year + Number(loanTermYears),

        monthly_expense: monthlyExpense,

        original_principal: originalPrincipal,
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),

        extra_monthly_payment:
          extraMonthlyPayment === "" ? null : Number(extraMonthlyPayment),

      },
    });

    if (onClose) onClose();
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          🏦
        </div>

        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Add Home Loan
          </h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Add loan details for <strong>{houseAsset.name}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Loan Details
            </p>

            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "#5FA7AB0D", padding: "14px" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "5px" }}>
                Original Principal
              </div>

              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>
                ${originalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              <div style={{ marginTop: "5px", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                Home value minus down payment
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Interest Rate %</label>
              <input
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                style={formInputStyle}
                placeholder="6.75"
                type="number"
                step="0.01"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={e => setLoanTermYears(e.target.value)}
                style={formInputStyle}
                placeholder="30"
                type="number"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>
                Extra Monthly Payment <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>$</span>
                <input
                  value={extraMonthlyPayment}
                  onChange={e => setExtraMonthlyPayment(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="0"
                  type="number"
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
            </p>


            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB", marginBottom: "8px" }}>
                Estimated Payment
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${monthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </div>

              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Principal + interest only
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                ...formSubmitButtonStyle,
                background: "transparent",
                color: "var(--primary)",
                border: "1px solid #5FA7AB44",
                fontWeight: 500,
              }}
            >
              Back
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                ...formSubmitButtonStyle,
                background: "transparent",
                color: "var(--primary)",
                border: "1px solid #5FA7AB44",
                fontWeight: 500,
              }}
            >
              Skip Loan
            </button>
          )}

          <button type="submit" style={formSubmitButtonStyle}>
            Add Home Loan
          </button>
        </div>
      </form>
    </div>
  );
}

function CarLoanExpenseForm({ dispatch, carAsset, onBack, onClose }) {
  const [interestRate, setInterestRate] = useState("7.5");
  const [loanTermYears, setLoanTermYears] = useState("5");

  const originalPrincipal =
    Number(carAsset.asset_value || 0) - Number(carAsset.down_payment || 0);

  const monthlyExpense =
    originalPrincipal > 0 && Number(interestRate) >= 0 && Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          originalPrincipal,
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "car_loan",

        id: crypto.randomUUID(),
        name: `${carAsset.name} Loan`,

        start_year: carAsset.start_year,
        end_year: carAsset.start_year + Number(loanTermYears),

        monthly_expense: monthlyExpense,

        original_principal: originalPrincipal,
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),

        
      },
    });

    if (onClose) onClose();
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          🚗
        </div>

        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Add Car Loan
          </h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Add loan details for <strong>{carAsset.name}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Loan Details
            </p>

            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "#5FA7AB0D", padding: "14px" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "5px" }}>
                Original Principal
              </div>

              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>
                ${originalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              <div style={{ marginTop: "5px", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                Car value minus down payment
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Interest Rate %</label>
              <input
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                style={formInputStyle}
                placeholder="7.5"
                type="number"
                step="0.01"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                style={formInputStyle}
                placeholder="5"
                type="number"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>
                Extra Monthly Payment{" "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>
                  $
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Payment Preview
            </p>

            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB", marginBottom: "8px" }}>
                Estimated Payment
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${monthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </div>

              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Principal + interest only
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                ...formSubmitButtonStyle,
                background: "transparent",
                color: "var(--primary)",
                border: "1px solid #5FA7AB44",
                fontWeight: 500,
              }}
            >
              Back
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                ...formSubmitButtonStyle,
                background: "transparent",
                color: "var(--primary)",
                border: "1px solid #5FA7AB44",
                fontWeight: 500,
              }}
            >
              Skip Loan
            </button>
          )}

          <button type="submit" style={formSubmitButtonStyle}>
            Add Car Loan
          </button>
        </div>
      </form>
    </div>
  );
}

function LivingExpensesForm({ dispatch }) {
  const [name, setName] = useState("Living Expenses");
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
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
        expense_growth: Number(growth) / 100,
      },
    });

    setName("Living Expense");
    setAmount("");
    setGrowth("3");
    setStartYear("");
    setEndYear("");
  };

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏠</div>
        <div>
          <h3 className="form-header-title">Add Living Expenses</h3>
          <p className="form-header-desc">Track recurring monthly costs like groceries, utilities, and subscriptions.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Expense Details</p>

            <div className="form-field">
              <label className="form-label">Expense Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Groceries, Utilities, etc." />
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="3,000" type="number" required />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Growth Rate</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Living Expenses
          </button>
        </div>
      </form>
    </div>
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

  const annualPayment = Number(monthlyPayment) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💳</div>
        <div>
          <h3 className="form-header-title">Add Debt</h3>
          <p className="form-header-desc">Track loans, credit cards, or any outstanding debt with monthly payments.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Debt Details</p>

            <div className="form-field">
              <label className="form-label">Debt Name</label>
              <input type="text" placeholder="Student Loan, Car Loan, Credit Card" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
            </div>

            <div className="form-field">
              <label className="form-label">Total Debt Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input type="number" placeholder="25,000" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="form-input form-input--prefix-dollar" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input type="number" placeholder="400" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input type="number" placeholder="6.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input--suffix" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input type="number" placeholder="1" value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input type="number" placeholder="10" value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Payment</span>
              </div>
              <div className="preview-card__amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(monthlyPayment) || 0).toLocaleString()}/mo × 12
                {interestRate && <span> · {Number(interestRate).toFixed(1)}% APR</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Debt
          </button>
        </div>
      </form>
    </div>
  );
}

function RentExpenseForm({ dispatch }) {
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
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

  const annualRent = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Add Rent</h3>
          <p className="form-header-desc">Track monthly rent payments with expected annual rent growth.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Rent Details</p>

            <div className="form-field">
              <label className="form-label">Monthly Rent</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="2,000" type="number" required />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Rent Growth</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Rent Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(amount) || 0).toLocaleString()}/mo · grows {Number(growth).toFixed(1)}%/yr
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Rent
          </button>
        </div>
      </form>
    </div>
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💼</div>
        <div>
          <h3 className="form-header-title">Add Salary Income</h3>
          <p className="form-header-desc">Track your employment income and annual growth rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Software Engineer" required />
            </div>

            {/* Annual Income */}
            <div className="form-field">
              <label className="form-label">Annual Net Income</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="120,000" type="number" required />
              </div>
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input--suffix" placeholder="3" type="number" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" required />
              </div>
            </div>

            {/* Link to 401k card */}
            <div className="link-card">
              <label className="link-card__option" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--teal)" }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                    <option value="">Select an account</option>

                    {available401ks.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      className="link-card__synced"
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="preview-card__sub"
                  style={{
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}
                >
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">⏱️</div>
        <div>
          <h3 className="form-header-title">Add Hourly Wage Income</h3>
          <p className="form-header-desc">Track hourly income, weekly hours, and projected growth.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/hr</span>
                <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="25" type="number" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="form-input form-input--suffix" placeholder="40" type="number" />
                <span className="form-input-suffix">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input--suffix" placeholder="3" type="number" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div className="link-card">
                <label className="form-label">Link 401(k) Account</label>
                <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                  <option value="">None - No linking</option>
                  {available401ks.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div className="link-card__synced">🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚀</div>
        <div>
          <h3 className="form-header-title">Add Side Hustle Income</h3>
          <p className="form-header-desc">Track variable income with frequency and variability estimates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Side Hustle Name */}
            <div className="form-field">
              <label className="form-label">Side Hustle Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={averageIncome} onChange={(e) => setAverageIncome(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="500" type="number" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div className="form-field">
              <label className="form-label">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Income Variability</label>
                <span className="form-slider-value">±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={(e) => setVariability(e.target.value)} className="form-slider" />
              <p className="preview-card__sub">
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💼</div>

        <div>
          <h3 className="form-header-title">Edit Salary Income</h3>

          <p className="form-header-desc">Update your employment income and growth details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>

              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Software Engineer" />
            </div>

            {/* Annual Income */}
            <div className="form-field">
              <label className="form-label">Annual Net Income</label>

              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>

                <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="120,000" type="number" />
              </div>
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>

              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input--suffix" placeholder="3" type="number" step="0.1" />

                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>

                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>

              <div className="form-field">
                <label className="form-label">End yr</label>

                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            <div className="link-card">
              <label className="link-card__option" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--teal)" }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                    <option value="">Select an account</option>

                    {available401ks.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      className="link-card__synced"
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="preview-card__sub"
                  style={{
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}
                >
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>

          <button type="submit" className="form-btn-submit">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">⏱️</div>
        <div>
          <h3 className="form-header-title">Edit Hourly Wage Income</h3>
          <p className="form-header-desc">Update hourly rate, weekly hours, and growth details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/hr</span>
                <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="25" type="number" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="form-input form-input--suffix" placeholder="40" type="number" />
                <span className="form-input-suffix">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input--suffix" placeholder="3" type="number" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div className="link-card">
                <label className="form-label">Link 401(k) Account</label>
                <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                  <option value="">None - No linking</option>
                  {available401ks.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div className="link-card__synced">🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚀</div>
        <div>
          <h3 className="form-header-title">Edit Side Hustle Income</h3>
          <p className="form-header-desc">Update frequency, variability, and income details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Side Hustle Name */}
            <div className="form-field">
              <label className="form-label">Side Hustle Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={averageIncome} onChange={(e) => setAverageIncome(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="500" type="number" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div className="form-field">
              <label className="form-label">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Income Variability</label>
                <span className="form-slider-value">±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={(e) => setVariability(e.target.value)} className="form-slider" />
              <p className="preview-card__sub">
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
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
  const [appreciation, setAppreciation] = useState(
    (item.annual_appreciation * 100).toString()
  );
  const [downPayment, setDownPayment] = useState(
    item.down_payment == null ? "" : item.down_payment.toString()
  );
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [savedHouseAsset, setSavedHouseAsset] = useState(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedHouseAsset = {
      ...item,
      source_type: "asset",
      variant: "house",
      name: name || "House",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
    };

    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedHouseAsset,
    });

    setSavedHouseAsset(updatedHouseAsset);
    setShowLoanForm(true);
  };

  const appreciatedValue =
    Number(houseValue) * (1 + (Number(appreciation) || 0) / 100);

  if (showLoanForm && savedHouseAsset) {
    return (
      <HouseLoanExpenseForm
        dispatch={dispatch}
        houseAsset={savedHouseAsset}
        onBack={() => setShowLoanForm(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", margin: "25px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "20px", marginBottom: "24px", borderBottom: "1px solid #5FA7AB22" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#5FA7AB18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          🏡
        </div>
        <div>
          <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>
            Edit House
          </h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Update property value, appreciation rate, and timeline.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Property Details
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>Property Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={formInputStyle}
                placeholder="Primary Residence"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>House Value</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>
                  $
                </span>
                <input
                  value={houseValue}
                  onChange={(e) => setHouseValue(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="400,000"
                  type="number"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={formLabelStyle}>
                Down Payment{" "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "#5FA7AB", pointerEvents: "none" }}>
                  $
                </span>
                <input
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  style={{ ...formInputStyle, paddingLeft: "22px" }}
                  placeholder="80,000"
                  type="number"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={formLabelStyle}>Annual Appreciation</label>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                  {Number(appreciation).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.1}
                value={appreciation}
                onChange={(e) => setAppreciation(e.target.value)}
                style={{ width: "100%", accentColor: "#5FA7AB", height: "4px", cursor: "pointer" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal)", paddingBottom: "8px", borderBottom: "1px solid #5FA7AB22" }}>
              Timeline
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>Start yr</label>
                <input
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="1"
                  type="number"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={formLabelStyle}>
                  End yr{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                    (opt)
                  </span>
                </label>
                <input
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  style={formInputStyle}
                  placeholder="30"
                  type="number"
                />
              </div>
            </div>

            <div style={{ borderRadius: "8px", border: "1px solid #5FA7AB22", background: "linear-gradient(135deg, #5FA7AB0D 0%, #fff 100%)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>📈</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5FA7AB" }}>
                  Value After Year 1
                </span>
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${appreciatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                +{Number(appreciation).toFixed(1)}% per year from $
                {(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #5FA7AB22" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...formSubmitButtonStyle,
              background: "transparent",
              color: "var(--primary)",
              border: "1px solid #5FA7AB44",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>

          <button type="submit" style={formSubmitButtonStyle}>
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditCarAssetForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [carValue, setCarValue] = useState(item.asset_value.toString());
  const [depreciation, setDepreciation] = useState((item.annual_depreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [savedCarAsset, setSavedCarAsset] = useState(null);


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const updatedCarAsset = {
      ...item,
      source_type: "asset",
      variant: "car",
      name: name || "Car",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
    };
  
    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedCarAsset,
    });
  
    setSavedCarAsset(updatedCarAsset);
    setShowLoanForm(true);
  };
  
  if (showLoanForm && savedCarAsset) {
    return (
      <CarLoanExpenseForm
        dispatch={dispatch}
        carAsset={savedCarAsset}
        onBack={() => setShowLoanForm(false)}
        onClose={onClose}
      />
    );

    onClose();
  };

  const depreciatedValue = Number(carValue) * (1 - (Number(depreciation) || 0) / 100);

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚗</div>
        <div>
          <h3 className="form-header-title">Edit Car</h3>
          <p className="form-header-desc">Update vehicle value, depreciation rate, and timeline.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Vehicle Details</p>

            <div className="form-field">
              <label className="form-label">Car Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Toyota Camry" />
            </div>

            <div className="form-field">
              <label className="form-label">Car Value</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={carValue} onChange={(e) => setCarValue(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="30,000" type="number" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="5,000" type="number" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Depreciation</label>
                <span className="form-slider-value">{Number(depreciation).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={30} step={0.5} value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Value Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">📉</span>
                <span className="preview-card__label">Value After Year 1</span>
              </div>
              <div className="preview-card__amount">${depreciatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="preview-card__sub">
                −{Number(depreciation).toFixed(1)}% per year from ${(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Car
          </button>
        </div>
      </form>
    </div>
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

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏠</div>
        <div>
          <h3 className="form-header-title">Edit Living Expenses</h3>
          <p className="form-header-desc">Update monthly amount and growth rate for this expense.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Expense Details</p>

            <div className="form-field">
              <label className="form-label">Expense Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Groceries, Utilities, etc." />
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="3,000" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Growth Rate</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Living Expenses
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditRentExpenseForm({ item, dispatch, onClose }) {
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [name, setName] = useState(item.name || "Rent");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "rent",
        name: name || "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onClose();
  };

  const annualRent = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Edit Rent</h3>
          <p className="form-header-desc">Update monthly rent and annual growth rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Rent Details</p>

            <div className="form-field">
              <label className="form-label">Monthly Rent</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="2,000" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Rent Growth</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Rent Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(amount) || 0).toLocaleString()}/mo · grows {Number(growth).toFixed(1)}%/yr
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Rent
          </button>
        </div>
      </form>
    </div>
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

  const annualPayment = Number(monthlyPayment) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💳</div>
        <div>
          <h3 className="form-header-title">Edit Debt</h3>
          <p className="form-header-desc">Update loan balance, monthly payment, and interest rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Debt Details</p>

            <div className="form-field">
              <label className="form-label">Debt Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Student Loan" />
            </div>

            <div className="form-field">
              <label className="form-label">Total Debt Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="number" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="400" type="number" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input--suffix" placeholder="6.5" type="number" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Payment</span>
              </div>
              <div className="preview-card__amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(monthlyPayment) || 0).toLocaleString()}/mo × 12
                {interestRate && <span> · {Number(interestRate).toFixed(1)}% APR</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Debt
          </button>
        </div>
      </form>
    </div>
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💰</div>
        <div>
          <h3 className="form-header-title">Edit Checking Account</h3>
          <p className="form-header-desc">Update your checking account balance and tiered interest rates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Main Checking, Emergency Fund" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="10,000" type="number" />
              </div>
            </div>

            {/* Interest Tiers */}
            <div className="tier-list">
              <div className="tier-header">
                <label className="tier-title">Interest Tiers</label>
                <button type="button" className="tier-btn-add" onClick={addTier}>
                  + Add Tier
                </button>
              </div>

              {tiers.map((tier, index) => (
                <div key={index}>
                  <div className="tier-item">
                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">APY (%)</label>
                      <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} className="form-input" placeholder="0.03" type="number" step="0.0001" />
                    </div>

                    {tiers.length > 1 && (
                      <button type="button" className="tier-btn-remove" onClick={() => removeTier(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
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
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">📈</div>
        <div>
          <h3 className="form-header-title">Edit Taxable Investment Account</h3>
          <p className="form-header-desc">Update your brokerage account with returns and dividend strategies.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="50,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="1,000" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Dividend Yield slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
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

  const handleLinkToggle = (enabled) => {
    setLinkEnabled(enabled);
    if (enabled && hasIncomes && !linkedIncomeId) {
      // Auto-select first job and sync years
      const firstJob = allJobs[0];
      setLinkedIncomeId(firstJob.id);
      setStartYear(firstJob.start_year.toString());
      setEndYear(firstJob.end_year.toString());
    }
  };

  const handleJobSelect = (jobId) => {
    setLinkedIncomeId(jobId);
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      setStartYear(job.start_year.toString());
      setEndYear(job.end_year.toString());
    }
  };

  const onSubmit = (e) => {
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

  const linkedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Edit Employer Retirement Account</h3>
          <p className="form-header-desc">Update your 401(k), 403(b), or pension details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="number" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="500" type="number" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Employer Match slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Employer Match</label>
                <span className="form-slider-value">{Number(employerMatch).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card__header">
                <div className="link-card__info">
                  <span className="preview-icon">💼</span>
                  <div>
                    <div className="link-card__title">Link to a job</div>
                    <div className="link-card__sub">Sync contribution years automatically</div>
                  </div>
                </div>
                {/* Toggle */}
                <div
                  onClick={() => hasIncomes && handleLinkToggle(!linkEnabled)}
                  className="toggle toggle--on"
                  style={{
                    borderRadius: "10px",
                    flexShrink: 0,
                    cursor: hasIncomes ? "pointer" : "not-allowed",
                    background: linkEnabled ? "#5FA7AB" : "#D1D5DB",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    className="toggle__knob toggle__knob--on"
                    style={{
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
                <div className="link-card__body">
                  {!hasIncomes ? (
                    <p className="link-card__no-jobs">No jobs yet — add a qualifying job first.</p>
                  ) : (
                    <div className="form-field--gap8">
                      <select value={linkedIncomeId} onChange={(e) => handleJobSelect(e.target.value)} className="form-input">
                        <option value="">Select a job</option>
                        {allJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                      {linkedJob && (
                        <div className="link-card__synced">
                          🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Annual contribution preview */}
            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">✨</span>
                <span className="preview-card__label">Annual Contribution</span>
              </div>
              <div className="preview-card__amount preview-card__amount--lg">
                ${annualTotal.toLocaleString()}
                <span className="preview-card__unit preview-card__unit--lg">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
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
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-header">
          <div>
            <h2 className="feedback-title">Leave Feedback</h2>
            <p className="feedback-desc">We’re a small team building quickly, and we’d genuinely appreciate any feedback that could help us improve.</p>
          </div>

          <button type="button" className="feedback-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label className="feedback-label">
            Satisfaction Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)} required className="feedback-input">
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>

          <label className="feedback-label">
            Feedback Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="feedback-input">
              <option>Bug</option>
              <option>Feature Request</option>
              <option>UX Confusion</option>
              <option>Questions</option>
              <option>General</option>
            </select>
          </label>

          <label className="feedback-label">
            Feedback / Questions
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your feedback or questions..." rows={5} required className="feedback-input" />
          </label>

          <label className="feedback-label">
            Email Optional
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Only if you want a follow-up" className="feedback-input" />
          </label>

          <div className="feedback-actions">
            <button type="button" className="feedback-btn-secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="feedback-btn-primary">
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Modal -------------------- */

export function FinancialEntityModalCell({ item, setSelectedVariant }) {
  return (
    <div className="entity-cell" onClick={() => setSelectedVariant(item.id)}>
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
    <div className="modal-overlay">
      <div className="modal">
        {/* ENTITY PICKER HEADER */}
        {!selectedVariant && !variantBeingEdited && (
          <div className="modal-header">
            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ADD FORM HEADER */}
        {selectedVariant && !variantBeingEdited && (
          <div className="modal-header">
            <button onClick={goBack}>← Back</button>

            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* EDIT FORM HEADER */}
        {variantBeingEdited && (
          <div className="modal-header">
            {/* <div>icon + title + description</div> */}

            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ENTITY SOURCE SELECTION MODAL */}
        {!selectedVariant && !variantBeingEdited && (
          <div className="modal-body">
            {data.map((item) => (
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
    <div className="entity-row">
      <div className="entity-row__main">
        <p className="entity-row__name">{item.name}</p>
        <div className="entity-row__meta">
          {item.balance != null && <span>${formatNumberWithCommas(item.balance.toString())}</span>}
          {item.net_income != null && <span>${formatNumberWithCommas(item.net_income.toString())}</span>}
          {item.monthly_expense != null && <span>${formatNumberWithCommas(item.monthly_expense.toString())}</span>}
          {item.asset_value != null && <span>${formatNumberWithCommas(item.asset_value.toString())}</span>}
          <span>
            {item.start_year}–{item.end_year}
          </span>
        </div>
      </div>

      <div className="entity-row__actions">
        <button className="entity-row__btn-edit" onClick={() => onEdit(item, item.variant)}>
          Edit
        </button>
        <button className="entity-row__btn-delete" onClick={handleDelete}>
          ✕
        </button>
      </div>
    </div>
  );
}
/* -------------------- Financial Entity Card -------------------- */

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

  const data = Object.values(ENTITY_CONFIG[category]).map((v) => ({
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
      <div className="entity-card">
        <div className="entity-card__header">
          <h1 className="entity-card__title">{entityName}</h1>

          <button className="entity-card__add-btn" onClick={() => setIsModalOpen(true)}>
            +
          </button>
        </div>

        {getItems().map((item) => (
          <EntityRow key={item.id} item={item} category={category} dispatch={dispatch} onEdit={handleEdit} />
        ))}
      </div>

      {isModalOpen && <Modal state={state} setIsModalOpen={handleCloseModal} data={data} category={category} dispatch={dispatch} variantBeingEdited={variantBeingEdited} />}
    </>
  );
}
/* -------------------- Financial Entities (Horizontal Container) -------------------- */

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
    <div className="entities-wrapper">
      {showArrows && canScrollLeft && (
        <button className="entities-arrow entities-arrow--left" onClick={() => scrollByStep("left")}>
          ◀
        </button>
      )}

      {showArrows && canScrollRight && (
        <button className="entities-arrow entities-arrow--right" onClick={() => scrollByStep("right")}>
          ▶
        </button>
      )}

      <div ref={ref} className="entities-scroll hide-scrollbar" onScroll={updateScrollState}>
        <div className="entities-item">
          <FinancialEntity state={state} entityName="Accounts" category="account" dispatch={dispatch} />
        </div>

        <div className="entities-item">
          <FinancialEntity state={state} entityName="Incomes" category="income" dispatch={dispatch} />
        </div>

        <div className="entities-item">
          <FinancialEntity state={state} entityName="Expenses" category="expense" dispatch={dispatch} />
        </div>

        <div className="entities-item">
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
    <div className="chart-tooltip">
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
        <div className="chart-wrap">
          <h3>Net Worth Over Time</h3>
          <h5>Not Ready</h5>
        </div>
      </>
    );

  const data = transformData(simResult);

  return (
    <div className="chart-wrap">
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

  const mockResults = generateMockResults();

  return (
    <div className="section">
      <div className="section-header">
        <h2>Simulation Results</h2>

        {/* to generate fake data use mockResults instead of simResult */}
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
          {/* to generate fake data use mockResults instead of simResult */}
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
        <button type="button" className="dash-nav-item feedback-nav-btn" onClick={() => setIsFeedbackOpen(true)}>
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
