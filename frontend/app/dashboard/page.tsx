"use client";
import "./dashboard.css";
// import CashFlowPanel from "@/components/Dashboard/CashFlowPanel/CashFlowPanel";
// import SimControls from "@/components/Dashboard/SimControls/SimControls";
// import AssetPortfolio from "@/components/Dashboard/Assets/AssetPortfolio";
import { SIM_MAX } from "@/app/dashboard/constants";
// import { useSimulation } from "./useSimulation";
import { useState, useReducer, useEffect } from "react";
import React from "react";
import { start } from "repl";

type Tier = {
  threshold: number;
  annual_rate: number;
};

type LiquidSegment = {
  id: string;
  start_year: number;
  end_year: number;

  balance: number;
  interest_tiers: {
    threshold: number;
    annual_rate: number;
  }[];
};

type LiquidAccount = {
  source_type: "liquid";
  id: string;
  name: string;
  segments: LiquidSegment[];
};

type IncomeSegment = {
  id: string;
  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;
};

type IncomeSource = {
  source_type: "income";
  id: string;
  name: string;
  segments: IncomeSegment[];
};

type RentalSegment = {
  id: string;
  start_year: number;
  end_year: number;

  purchase_price: number;
  down_payment: number;
  annual_appreciation: number;
  monthly_income: number;
  monthly_expenses: number;
};

type RentalProperty = {
  source_type: "rental";
  id: string;
  name: string;
  segments: RentalSegment[];
};

type StockSegment = {
  id: string;
  start_year: number;
  end_year: number;

  initial_value: number;
  annual_return: number;
  monthly_contribution: number;
  dividend_yield: number;
};

type StockPortfolio = {
  source_type: "stock";
  id: string;
  name: string;
  segments: StockSegment[];
};
type AssetSource = RentalProperty | StockPortfolio;

type ExpenseSegment = {
  id: string;
  start_year: number;
  end_year: number;

  annual_expense: number;
  expense_growth: number;
};

type ExpenseSource = {
  source_type: "expense";
  id: string;
  name: string;
  segments: ExpenseSegment[];
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

  | { type: "ADD_LIQUID_SEGMENT"; payload: { accountId: string; segment: LiquidSegment } }
  | { type: "UPDATE_LIQUID_SEGMENT"; payload: { accountId: string; segment: LiquidSegment } }
  | { type: "DELETE_LIQUID_SEGMENT"; payload: { accountId: string; segmentId: string } }

  | { type: "ADD_INCOME"; payload: IncomeSource }
  | { type: "UPDATE_INCOME"; payload: IncomeSource }
  | { type: "DELETE_INCOME"; payload: { id: string } }

  | { type: "ADD_EXPENSE"; payload: ExpenseSource }
  | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
  | { type: "DELETE_EXPENSE"; payload: { id: string } }

  | { type: "ADD_ASSET"; payload: AssetSource }
  | { type: "UPDATE_ASSET"; payload: AssetSource }
  | { type: "DELETE_ASSET"; payload: { id: string } }

  // | { type: "ADD_EVENT"; payload: SimEvent };

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

    case "ADD_LIQUID_SEGMENT":
      return {
        ...state,
        liquid_accounts: state.liquid_accounts.map(acc =>
          acc.id === action.payload.accountId
            ? {
                ...acc,
                segments: [...acc.segments, action.payload.segment],
              }
            : acc
        ),
      };

    case "UPDATE_LIQUID_SEGMENT":
      return {
        ...state,
        liquid_accounts: state.liquid_accounts.map(acc =>
          acc.id === action.payload.accountId
            ? {
                ...acc,
                segments: acc.segments.map(seg =>
                  seg.id === action.payload.segment.id
                    ? action.payload.segment
                    : seg
                ),
              }
            : acc
        ),
      };

    case "DELETE_LIQUID_SEGMENT":
      return {
        ...state,
        liquid_accounts: state.liquid_accounts.map(acc =>
          acc.id === action.payload.accountId
            ? {
                ...acc,
                segments: acc.segments.filter(
                  seg => seg.id !== action.payload.segmentId
                ),
              }
            : acc
        ),
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

export function LiquidAccountForm({ dispatch, }: { dispatch: React.Dispatch<Action>; }) {
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
      name: "Liquid Account",
      segments: [
        {
          id: crypto.randomUUID(),
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
      ],
    };

    dispatch({
      type: "ADD_LIQUID_ACCOUNT",
      payload,
    });

    // reset
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
        <input
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          placeholder="Start Year (e.g. 1)"
        />

        <input
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          placeholder="End Year (e.g. 30)"
        />

        <input
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="Balance"
        />

        <input
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Threshold"
        />

        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Rate"
        />

        <button type="submit">Add</button>
      </form>
    </div>
  );
}

// export function AssetForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   type AssetSourceType = "rental" | "stock";

//   const [sourceType, setSourceType] = useState<AssetSourceType>("rental");
//   const [name, setName] = useState("");

//   // rental
//   const [purchasePrice, setPurchasePrice] = useState("");
//   const [downPayment, setDownPayment] = useState("");
//   const [annualAppreciation, setAnnualAppreciation] = useState("");
//   const [monthlyIncome, setMonthlyIncome] = useState("");
//   const [monthlyExpenses, setMonthlyExpenses] = useState("");

//   // stock
//   const [initialValue, setInitialValue] = useState("");
//   const [annualReturn, setAnnualReturn] = useState("");
//   const [monthlyContribution, setMonthlyContribution] = useState("");
//   const [dividendYield, setDividendYield] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     let payload: AssetSource;

//     if (sourceType === "rental") {
//       payload = {
//         source_type: "rental",
//         id: crypto.randomUUID(),
//         name,
//         purchase_price: Number(purchasePrice),
//         down_payment: Number(downPayment),
//         annual_appreciation: Number(annualAppreciation),
//         monthly_income: Number(monthlyIncome),
//         monthly_expenses: Number(monthlyExpenses),
//       };
//     } else {
//       payload = {
//         source_type: "stock",
//         id: crypto.randomUUID(),
//         name,
//         initial_value: Number(initialValue),
//         annual_return: Number(annualReturn),
//         monthly_contribution: Number(monthlyContribution),
//         dividend_yield: Number(dividendYield),
//       };
//     }

//     dispatch({
//       type: "ADD_ASSET",
//       payload,
//     });

//     // reset
//     setName("");
//     setPurchasePrice("");
//     setDownPayment("");
//     setAnnualAppreciation("");
//     setMonthlyIncome("");
//     setMonthlyExpenses("");
//     setInitialValue("");
//     setAnnualReturn("");
//     setMonthlyContribution("");
//     setDividendYield("");
//   };

//   return (
//     <div>
//       <h3>Add Asset</h3>

//       <form onSubmit={onSubmit}>
//         {/* TYPE SELECT */}
//         <select value={sourceType} onChange={(e) => setSourceType(e.target.value as AssetSourceType)}>
//           <option value="rental">Rental Property</option>
//           <option value="stock">Stock Portfolio</option>
//         </select>

//         {/* COMMON */}
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

//         {/* RENTAL FIELDS */}
//         {sourceType === "rental" && (
//           <>
//             <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Purchase Price" />
//             <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment" />
//             <input value={annualAppreciation} onChange={(e) => setAnnualAppreciation(e.target.value)} placeholder="Annual Appreciation (%)" />
//             <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="Monthly Income" />
//             <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="Monthly Expenses" />
//           </>
//         )}

//         {/* STOCK FIELDS */}
//         {sourceType === "stock" && (
//           <>
//             <input value={initialValue} onChange={(e) => setInitialValue(e.target.value)} placeholder="Initial Value" />
//             <input value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="Annual Return (%)" />
//             <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder="Monthly Contribution" />
//             <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} placeholder="Dividend Yield (%)" />
//           </>
//         )}

//         <button type="submit">Add Asset</button>
//       </form>
//     </div>
//   );
// }

// export function IncomeForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   const [name, setName] = useState("");
//   const [netIncome, setNetIncome] = useState("");
//   const [growth, setGrowth] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     dispatch({
//       type: "ADD_INCOME",
//       payload: {
//         source_type: "income",
//         id: crypto.randomUUID(),
//         name,
//         net_income: Number(netIncome),
//         income_growth: Number(growth),
//       },
//     });

//     setName("");
//     setNetIncome("");
//     setGrowth("");
//   };

//   return (
//     <div>
//       <h3>Add Income</h3>

//       <form onSubmit={onSubmit}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Salary)" />

//         <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="Annual Net Income" />

//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate (%)" />

//         <button type="submit">Add Income</button>
//       </form>
//     </div>
//   );
// }

// export function ExpenseForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   const [name, setName] = useState("");
//   const [annualExpense, setAnnualExpense] = useState("");
//   const [growth, setGrowth] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     dispatch({
//       type: "ADD_EXPENSE",
//       payload: {
//         source_type: "expense",
//         id: crypto.randomUUID(),
//         name,
//         annual_expense: Number(annualExpense),
//         expense_growth: Number(growth),
//       },
//     });

//     setName("");
//     setAnnualExpense("");
//     setGrowth("");
//   };

//   return (
//     <div>
//       <h3>Add Expense</h3>

//       <form onSubmit={onSubmit}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Rent)" />

//         <input value={annualExpense} onChange={(e) => setAnnualExpense(e.target.value)} placeholder="Annual Expense" />

//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate (%)" />

//         <button type="submit">Add Expense</button>
//       </form>
//     </div>
//   );
// }


// function IncomeRow({ income, dispatch }: { income: IncomeSource; dispatch: React.Dispatch<Action> }) {
//   const [isEditing, setIsEditing] = useState(false);

//   const [name, setName] = useState(income.name);
//   const [netIncome, setNetIncome] = useState(income.net_income.toString());
//   const [growth, setGrowth] = useState(income.income_growth.toString());

//   const onSave = () => {
//     dispatch({
//       type: "UPDATE_INCOME",
//       payload: {
//         ...income,
//         name,
//         net_income: Number(netIncome),
//         income_growth: Number(growth),
//       },
//     });

//     setIsEditing(false);
//   };

//   const onCancel = () => {
//     // reset back to original values
//     setName(income.name);
//     setNetIncome(income.net_income.toString());
//     setGrowth(income.income_growth.toString());
//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
//         <input value={name} onChange={(e) => setName(e.target.value)} />
//         <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} />
//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} />

//         <button onClick={onSave}>Save</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", gap: "1rem" }}>
//       <span>
//         {income.name} — ${income.net_income} — {income.income_growth}%
//       </span>

//       <button onClick={() => setIsEditing(true)}>Edit</button>

//       <button onClick={() => dispatch({ type: "DELETE_INCOME", payload: { id: income.id } })}>Delete</button>
//     </div>
//   );
// }

// function IncomeList({ incomes, dispatch }: { incomes: IncomeSource[]; dispatch: React.Dispatch<Action> }) {
//   return (
//     <div>
//       <h3>Incomes</h3>

//       {incomes.map((income) => (
//         <IncomeRow key={income.id} income={income} dispatch={dispatch} />
//       ))}
//     </div>
//   );
// }

// function AssetRow({ asset, dispatch }: { asset: AssetSource; dispatch: React.Dispatch<Action> }) {
//   const [isEditing, setIsEditing] = useState(false);

//   const [name, setName] = useState(asset.name);

//   // rental
//   const [purchasePrice, setPurchasePrice] = useState(asset.source_type === "rental" ? asset.purchase_price.toString() : "");
//   const [downPayment, setDownPayment] = useState(asset.source_type === "rental" ? asset.down_payment.toString() : "");
//   const [annualAppreciation, setAnnualAppreciation] = useState(asset.source_type === "rental" ? asset.annual_appreciation.toString() : "");
//   const [monthlyIncome, setMonthlyIncome] = useState(asset.source_type === "rental" ? asset.monthly_income.toString() : "");
//   const [monthlyExpenses, setMonthlyExpenses] = useState(asset.source_type === "rental" ? asset.monthly_expenses.toString() : "");

//   // stock
//   const [initialValue, setInitialValue] = useState(asset.source_type === "stock" ? asset.initial_value.toString() : "");
//   const [annualReturn, setAnnualReturn] = useState(asset.source_type === "stock" ? asset.annual_return.toString() : "");
//   const [monthlyContribution, setMonthlyContribution] = useState(asset.source_type === "stock" ? asset.monthly_contribution.toString() : "");
//   const [dividendYield, setDividendYield] = useState(asset.source_type === "stock" ? asset.dividend_yield.toString() : "");

//   const onSave = () => {
//     let updated: AssetSource;

//     if (asset.source_type === "rental") {
//       updated = {
//         ...asset,
//         name,
//         purchase_price: Number(purchasePrice),
//         down_payment: Number(downPayment),
//         annual_appreciation: Number(annualAppreciation),
//         monthly_income: Number(monthlyIncome),
//         monthly_expenses: Number(monthlyExpenses),
//       };
//     } else {
//       updated = {
//         ...asset,
//         name,
//         initial_value: Number(initialValue),
//         annual_return: Number(annualReturn),
//         monthly_contribution: Number(monthlyContribution),
//         dividend_yield: Number(dividendYield),
//       };
//     }

//     dispatch({
//       type: "UPDATE_ASSET",
//       payload: updated,
//     });

//     setIsEditing(false);
//   };

//   const onCancel = () => {
//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
//         <input value={name} onChange={(e) => setName(e.target.value)} />

//         {asset.source_type === "rental" && (
//           <>
//             <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
//             <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
//             <input value={annualAppreciation} onChange={(e) => setAnnualAppreciation(e.target.value)} />
//             <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
//             <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} />
//           </>
//         )}

//         {asset.source_type === "stock" && (
//           <>
//             <input value={initialValue} onChange={(e) => setInitialValue(e.target.value)} />
//             <input value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} />
//             <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
//             <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} />
//           </>
//         )}

//         <button onClick={onSave}>Save</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     );
//   }

//   // DISPLAY MODE
//   return (
//     <div style={{ display: "flex", gap: "1rem" }}>
//       <span>
//         {asset.name} — {asset.source_type === "rental" ? `Rental ($${asset.monthly_income}/mo)` : `Stock ($${asset.initial_value})`}
//       </span>

//       <button onClick={() => setIsEditing(true)}>Edit</button>

//       <button onClick={() => dispatch({ type: "DELETE_ASSET", payload: { id: asset.id } })}>Delete</button>
//     </div>
//   );
// }

// function AssetList({ assets, dispatch }: { assets: AssetSource[]; dispatch: React.Dispatch<Action> }) {
//   return (
//     <div>
//       <h3>Assets</h3>

//       {assets.map((asset) => (
//         <AssetRow key={asset.id} asset={asset} dispatch={dispatch} />
//       ))}
//     </div>
//   );
// }

// function ExpenseRow({ expense, dispatch }: { expense: ExpenseSource; dispatch: React.Dispatch<Action> }) {
//   const [isEditing, setIsEditing] = useState(false);

//   const [name, setName] = useState(expense.name);
//   const [annualExpense, setAnnualExpense] = useState(expense.annual_expense.toString());
//   const [growth, setGrowth] = useState(expense.expense_growth.toString());

//   const onSave = () => {
//     dispatch({
//       type: "UPDATE_EXPENSE",
//       payload: {
//         ...expense,
//         name,
//         annual_expense: Number(annualExpense),
//         expense_growth: Number(growth),
//       },
//     });

//     setIsEditing(false);
//   };

//   const onCancel = () => {
//     setName(expense.name);
//     setAnnualExpense(expense.annual_expense.toString());
//     setGrowth(expense.expense_growth.toString());
//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
//         <input value={name} onChange={(e) => setName(e.target.value)} />
//         <input value={annualExpense} onChange={(e) => setAnnualExpense(e.target.value)} />
//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} />

//         <button onClick={onSave}>Save</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", gap: "1rem" }}>
//       <span>
//         {expense.name} — ${expense.annual_expense} — {expense.expense_growth}%
//       </span>

//       <button onClick={() => setIsEditing(true)}>Edit</button>

//       <button
//         onClick={() =>
//           dispatch({
//             type: "DELETE_EXPENSE",
//             payload: { id: expense.id },
//           })
//         }
//       >
//         Delete
//       </button>
//     </div>
//   );
// }

// function ExpenseList({ expenses, dispatch }: { expenses: ExpenseSource[]; dispatch: React.Dispatch<Action> }) {
//   return (
//     <div>
//       <h3>Expenses</h3>

//       {expenses.map((expense) => (
//         <ExpenseRow key={expense.id} expense={expense} dispatch={dispatch} />
//       ))}
//     </div>
//   );
// }
function LiquidAccountRow({
  account,
  dispatch,
}: {
  account: LiquidAccount;
  dispatch: React.Dispatch<Action>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [selectedSegmentId, setSelectedSegmentId] = useState(
    account.segments[0]?.id
  );

  const segment =
    account.segments.find((s) => s.id === selectedSegmentId) ??
    account.segments[0];

  const [startYear, setStartYear] = useState(segment.start_year.toString());
  const [endYear, setEndYear] = useState(segment.end_year.toString());
  const [balance, setBalance] = useState(segment.balance.toString());

  const [threshold, setThreshold] = useState(
    segment.interest_tiers[0]?.threshold?.toString() ?? ""
  );

  const [rate, setRate] = useState(
    segment.interest_tiers[0]?.annual_rate?.toString() ?? ""
  );

  const onSave = () => {
    dispatch({
      type: "UPDATE_LIQUID_SEGMENT",
      payload: {
        accountId: account.id,
        segment: {
          ...segment,
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
      },
    });

    setIsEditing(false);
  };

  const addSegment = () => {
    const newSegment: LiquidSegment = {
      id: crypto.randomUUID(),
      start_year: Number(endYear),
      end_year: Number(endYear) + 10,

      balance: Number(balance),
      interest_tiers: [
        {
          threshold: Number(threshold),
          annual_rate: Number(rate),
        },
      ],
    };

    dispatch({
      type: "ADD_LIQUID_SEGMENT",
      payload: {
        accountId: account.id,
        segment: newSegment,
      },
    });

    setSelectedSegmentId(newSegment.id);
  };

  const deleteSegment = (segmentId: string) => {
    dispatch({
      type: "DELETE_LIQUID_SEGMENT",
      payload: {
        accountId: account.id,
        segmentId,
      },
    });
  };

  if (isEditing) {
    return (
      <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
        {/* SEGMENT SELECTOR */}
        <select
          value={selectedSegmentId}
          onChange={(e) => setSelectedSegmentId(e.target.value)}
        >
          {account.segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.start_year} → {s.end_year}
            </option>
          ))}
        </select>

        {/* EDIT FIELDS */}
        <input value={startYear} onChange={(e) => setStartYear(e.target.value)} />
        <input value={endYear} onChange={(e) => setEndYear(e.target.value)} />
        <input value={balance} onChange={(e) => setBalance(e.target.value)} />

        <input value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        <input value={rate} onChange={(e) => setRate(e.target.value)} />

        <button onClick={onSave}>Save Segment</button>

        <button onClick={addSegment}>+ Add Segment</button>

        <button
          onClick={() => deleteSegment(selectedSegmentId)}
          style={{ color: "red" }}
        >
          Delete Segment
        </button>

        <button onClick={() => setIsEditing(false)}>Close</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <span>
        {account.name} — ${segment.balance} —{" "}
        {segment.interest_tiers[0]?.annual_rate}%
      </span>

      <button onClick={() => setIsEditing(true)}>Edit</button>

      <button
        onClick={() =>
          dispatch({
            type: "DELETE_LIQUID_ACCOUNT",
            payload: { id: account.id },
          })
        }
      >
        Delete Account
      </button>
    </div>
  );
}

function LiquidAccountList({ accounts, dispatch }: { accounts: LiquidAccount[]; dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <h3>Liquid Accounts</h3>

      {accounts.map((account) => (
        <LiquidAccountRow key={account.id} account={account} dispatch={dispatch} />
      ))}
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
      setHasResults(true)
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
      <button onClick={clearSimulation} disabled={!hasResults}>Clear Simulation Result</button>
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
                yearData.sources.map((src: any) => (
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
          <a href="#" className="dash-nav-item dash-nav-active">
            Overview
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

        <pre>{JSON.stringify(state, null, 2)}</pre>
        {/* <IncomeList incomes={state.incomes} dispatch={dispatch} />
        <AssetList assets={state.assets} dispatch={dispatch} />
        <ExpenseList expenses={state.expenses} dispatch={dispatch} /> */}
        <LiquidAccountList accounts={state.liquid_accounts} dispatch={dispatch} />

        {/* base state */}
        {/* liquid accounts */}
        <LiquidAccountForm dispatch={dispatch} />

        {/* assets */}
        {/* <AssetForm dispatch={dispatch} />

        {/* incomes */}
        {/* <IncomeForm dispatch={dispatch} /> */}

        {/* expenses */}
        {/* <ExpenseForm dispatch={dispatch} /> */}

        {/* events */}
        {/* <AddEventForm dispatch={dispatch} /> */}

        {/* events only available once sim is run boolean */}
        <SimulationControls state={state} setSimResult={setSimResult} />
        <SimResultViewer simResult={simResult} />

        {/* <div className="dash-grid">
          <div className="dash-cell dash-cell-md">
            <CashFlowPanel
              currentYear={sim.currentYear}
              yearData={sim.currentYearData}
              updateYear={sim.updateYear}
            />
          </div>

          <div className="dash-cell dash-cell-md">
            <AssetPortfolio
              assets={sim.assets}
              currentYear={sim.currentYear}
              currentResult={sim.currentYearData.result}
              onAddAsset={sim.addAsset}
              onSellAsset={sim.sellAsset}
            />
          </div>

          <div className="dash-cell dash-cell-sm">
            <div className="dash-placeholder">Asset Allocation</div>
          </div>

          <div className="dash-cell dash-cell-lg">
            <div className="dash-placeholder">Scenario Timeline</div>
          </div>

          <div className="dash-cell dash-cell-sm">
            <SimControls
              currentYear={sim.currentYear}
              isPlaying={sim.isPlaying}
              status={sim.status}
              simMax={SIM_MAX}
              onPlay={sim.play}
              onPause={sim.pause}
              onReset={sim.reset}
              onSeek={sim.seekTo}
            />
          </div>
        </div>

        {sim.error && <div className="dash-error">{sim.error}</div>} */}
      </main>
    </div>
  );
}

// const [year, setYear] = useState(1);
// <button onClick={getPrevYearData} disabled={simResult.length === 0}>Prev Year</button>
// <button onClick={getNextYearData} disabled={simResult.length === 0}>Next Year</button>
// <p>Current Year: {year}</p>
//   const getNextYearData = () => {
//     if (year >= SIM_MAX){
//       const yearData = simResult.findLast((y) => y.year === SIM_MAX);
//       populateFormFromYear(yearData);
//       return
//     }
//     const nextYear = year + 1;
//     setYear(nextYear);

//     const yearData = simResult.findLast((y) => y.year === nextYear);
//     populateFormFromYear(yearData);
// };

// const getPrevYearData = () => {
//   if (year <= 0){
//     const yearData = simResult.findLast((y) => y.year === 0);
//     populateFormFromYear(yearData);
//     return
//   }

//   const nextYear = year - 1;
//   setYear(nextYear);

//   const yearData = simResult.findLast((y) => y.year === nextYear);
//   populateFormFromYear(yearData);
// }

// const populateFormFromYear = (yearData?: SimYearResult) => {
//   if (!yearData) return;

//   const liquid = yearData.sources.findLast( (s) => s.source_type === "liquid" );

//   if (!liquid) return;
//   console.log("Populating form with liquid account data from year", yearData.year, liquid);
//   console.log("Liquid account asset value:", liquid.asset_value);
//   setBalance(liquid.asset_value?.toString());
//   console.log("Set balance to", balance);
// };
