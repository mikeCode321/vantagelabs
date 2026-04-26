// "use client";
// import "./dashboard.css";
// // import CashFlowPanel from "@/components/Dashboard/CashFlowPanel/CashFlowPanel";
// // import SimControls from "@/components/Dashboard/SimControls/SimControls";
// // import AssetPortfolio from "@/components/Dashboard/Assets/AssetPortfolio";
// import { SIM_MAX } from "@/app/dashboard/constants";
// // import { useSimulation } from "./useSimulation";
// import { useState, useReducer, useEffect } from "react";
// import React from "react";

// // ─────────────────────────────────────────────
// // CORE
// // ─────────────────────────────────────────────

// type ID = string;

// type Tier = {
//   threshold: number;
//   annual_rate: number;
// };

// // ─────────────────────────────────────────────
// // LIQUID ACCOUNTS
// // ─────────────────────────────────────────────

// type LiquidAccount = {
//   source_type: "liquid";
//   id: ID;
//   name: string;

//   start_year: number;
//   end_year: number;

//   balance: number;
//   interest_tiers: Tier[];
// };

// // ─────────────────────────────────────────────
// // INCOME
// // ─────────────────────────────────────────────

// type IncomeSource = {
//   source_type: "income";
//   id: ID;
//   name: string;

//   start_year: number;
//   end_year: number;

//   net_income: number;
//   income_growth: number;
// };

// // ─────────────────────────────────────────────
// // RENTAL
// // ─────────────────────────────────────────────

// type RentalProperty = {
//   source_type: "rental";
//   id: ID;
//   name: string;

//   start_year: number;
//   end_year: number;

//   purchase_price: number;
//   down_payment: number;
//   annual_appreciation: number;

//   monthly_income: number;
//   monthly_expenses: number;
// };

// // ─────────────────────────────────────────────
// // STOCKS
// // ─────────────────────────────────────────────

// type StockPortfolio = {
//   source_type: "stock";
//   id: ID;
//   name: string;

//   start_year: number;
//   end_year: number;

//   initial_value: number;
//   annual_return: number;
//   monthly_contribution: number;
//   dividend_yield: number;
// };

// // ─────────────────────────────────────────────
// // ASSETS
// // ─────────────────────────────────────────────

// type AssetSource = RentalProperty | StockPortfolio;

// // ─────────────────────────────────────────────
// // EXPENSES
// // ─────────────────────────────────────────────

// type ExpenseSource = {
//   source_type: "expense";
//   id: ID;
//   name: string;

//   start_year: number;
//   end_year: number;

//   annual_expense: number;
//   expense_growth: number;
// };
// type SimRequest = {
//   start_year: number;
//   end_year: number;

//   liquid_accounts: LiquidAccount[];
//   assets: AssetSource[];
//   incomes: IncomeSource[];
//   expenses: ExpenseSource[];
// };

// type SourceSnapshot = {
//   id: string;
//   name: string;
//   source_type: string;
//   asset_value: number;
//   annual_cashflow: number;
//   // start/end values for display — populated for income + expense sources
//   start_value?: number; // what the source was worth at year start
//   end_value?: number; // after growth applied
// };

// type SimYearResult = {
//   year: number;
//   net_worth: number; // total_cash + all asset values
//   total_cash: number; // sum across all liquid accounts
//   total_income: number; // sum of all income source cashflows
//   total_expenses: number; // sum of all expense source cashflows
//   // WIP: return interest earned on cash/liquid accounts separately in the future
//   // WIP: return appreciation/asset growth separately in the future
//   sources: SourceSnapshot[];
// };

// type Action =
//   | { type: "ADD_LIQUID_ACCOUNT"; payload: LiquidAccount }
//   | { type: "UPDATE_LIQUID_ACCOUNT"; payload: LiquidAccount }
//   | { type: "DELETE_LIQUID_ACCOUNT"; payload: { id: string } }
//   | { type: "ADD_INCOME"; payload: IncomeSource }
//   | { type: "UPDATE_INCOME"; payload: IncomeSource }
//   | { type: "DELETE_INCOME"; payload: { id: string } }
//   | { type: "ADD_EXPENSE"; payload: ExpenseSource }
//   | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
//   | { type: "DELETE_EXPENSE"; payload: { id: string } }
//   | { type: "ADD_ASSET"; payload: AssetSource }
//   | { type: "UPDATE_ASSET"; payload: AssetSource }
//   | { type: "DELETE_ASSET"; payload: { id: string } };

// function simReducer(state: SimRequest, action: Action): SimRequest {
//   switch (action.type) {
//     case "ADD_LIQUID_ACCOUNT":
//       return {
//         ...state,
//         liquid_accounts: [...state.liquid_accounts, action.payload],
//       };

//     case "UPDATE_LIQUID_ACCOUNT":
//       return {
//         ...state,
//         liquid_accounts: state.liquid_accounts.map((a) => (a.id === action.payload.id ? action.payload : a)),
//       };

//     case "DELETE_LIQUID_ACCOUNT":
//       return {
//         ...state,
//         liquid_accounts: state.liquid_accounts.filter((a) => a.id !== action.payload.id),
//       };

//     // INCOME  ==================
//     case "ADD_INCOME":
//       return {
//         ...state,
//         incomes: [...state.incomes, action.payload],
//       };

//     case "UPDATE_INCOME":
//       return {
//         ...state,
//         incomes: state.incomes.map((i) => (i.id === action.payload.id ? action.payload : i)),
//       };

//     case "DELETE_INCOME":
//       return {
//         ...state,
//         incomes: state.incomes.filter((i) => i.id !== action.payload.id),
//       };

//     // EXPENSE  ==================
//     case "ADD_EXPENSE":
//       return {
//         ...state,
//         expenses: [...state.expenses, action.payload],
//       };

//     case "UPDATE_EXPENSE":
//       return {
//         ...state,
//         expenses: state.expenses.map((e) => (e.id === action.payload.id ? action.payload : e)),
//       };

//     case "DELETE_EXPENSE":
//       return {
//         ...state,
//         expenses: state.expenses.filter((e) => e.id !== action.payload.id),
//       };

//     // ASSET ==================
//     case "ADD_ASSET":
//       return {
//         ...state,
//         assets: [...state.assets, action.payload],
//       };

//     case "UPDATE_ASSET":
//       return {
//         ...state,
//         assets: state.assets.map((a) => (a.id === action.payload.id ? action.payload : a)),
//       };

//     case "DELETE_ASSET":
//       return {
//         ...state,
//         assets: state.assets.filter((a) => a.id !== action.payload.id),
//       };

//     default:
//       return state;
//   }
// }

// const INITIAL_STATE: SimRequest = {
//   start_year: 1,
//   end_year: SIM_MAX,

//   liquid_accounts: [],
//   assets: [],
//   incomes: [],
//   expenses: [],

//   // events: []
// };

// export function LiquidAccountForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   const [name, setName] = useState("");
//   const [balance, setBalance] = useState("");
//   const [threshold, setThreshold] = useState("");
//   const [rate, setRate] = useState("");

//   const [startYear, setStartYear] = useState("");
//   const [endYear, setEndYear] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     const payload: LiquidAccount = {
//       source_type: "liquid",
//       id: crypto.randomUUID(),
//       name: name,

//       start_year: Number(startYear),
//       end_year: Number(endYear),

//       balance: Number(balance),
//       interest_tiers: [
//         {
//           threshold: Number(threshold),
//           annual_rate: Number(rate),
//         },
//       ],
//     };

//     dispatch({
//       type: "ADD_LIQUID_ACCOUNT",
//       payload,
//     });

//     setName("");
//     setBalance("");
//     setThreshold("");
//     setRate("");
//     setStartYear("");
//     setEndYear("");
//   };

//   return (
//     <div>
//       <p>Balance: {balance}</p>

//       <form onSubmit={onSubmit}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

//         <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />

//         <input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Threshold" />

//         <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" />

//         <button type="submit">Add</button>
//       </form>
//     </div>
//   );
// }

// export function AssetForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   type AssetSourceType = "rental" | "stock";

//   const [sourceType, setSourceType] = useState<AssetSourceType>("rental");
//   const [name, setName] = useState("");

//   const [startYear, setStartYear] = useState("");
//   const [endYear, setEndYear] = useState("");

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

//         start_year: Number(startYear),
//         end_year: Number(endYear),

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

//         start_year: Number(startYear),
//         end_year: Number(endYear),

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
//     setStartYear("");
//     setEndYear("");

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

//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

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
//   const [startYear, setStartYear] = useState("");
//   const [endYear, setEndYear] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     dispatch({
//       type: "ADD_INCOME",
//       payload: {
//         source_type: "income",
//         id: crypto.randomUUID(),
//         name,

//         start_year: Number(startYear),
//         end_year: Number(endYear),

//         net_income: Number(netIncome),
//         income_growth: Number(growth),
//       },
//     });

//     setName("");
//     setNetIncome("");
//     setGrowth("");
//     setStartYear("");
//     setEndYear("");
//   };

//   return (
//     <div>
//       <h3>Add Income</h3>

//       <form onSubmit={onSubmit}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />
//         <input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="Annual Income" />
//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate" />

//         <button type="submit">Add Income</button>
//       </form>
//     </div>
//   );
// }

// export function ExpenseForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
//   const [name, setName] = useState("");
//   const [annualExpense, setAnnualExpense] = useState("");
//   const [growth, setGrowth] = useState("");
//   const [startYear, setStartYear] = useState("");
//   const [endYear, setEndYear] = useState("");

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     dispatch({
//       type: "ADD_EXPENSE",
//       payload: {
//         source_type: "expense",
//         id: crypto.randomUUID(),
//         name,

//         start_year: Number(startYear),
//         end_year: Number(endYear),

//         annual_expense: Number(annualExpense),
//         expense_growth: Number(growth),
//       },
//     });

//     setName("");
//     setAnnualExpense("");
//     setGrowth("");
//     setStartYear("");
//     setEndYear("");
//   };

//   return (
//     <div>
//       <h3>Add Expense</h3>

//       <form onSubmit={onSubmit}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Rent)" />

//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

//         <input value={annualExpense} onChange={(e) => setAnnualExpense(e.target.value)} placeholder="Annual Expense" />

//         <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Growth Rate" />

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
//   const [startYear, setStartYear] = useState(asset.start_year.toString());
//   const [endYear, setEndYear] = useState(asset.end_year.toString());

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

//   const resetState = () => {
//     setName(asset.name);
//     setStartYear(asset.start_year.toString());
//     setEndYear(asset.end_year.toString());

//     if (asset.source_type === "rental") {
//       setPurchasePrice(asset.purchase_price.toString());
//       setDownPayment(asset.down_payment.toString());
//       setAnnualAppreciation(asset.annual_appreciation.toString());
//       setMonthlyIncome(asset.monthly_income.toString());
//       setMonthlyExpenses(asset.monthly_expenses.toString());
//     } else {
//       setInitialValue(asset.initial_value.toString());
//       setAnnualReturn(asset.annual_return.toString());
//       setMonthlyContribution(asset.monthly_contribution.toString());
//       setDividendYield(asset.dividend_yield.toString());
//     }
//   };

//   const onSave = () => {
//     let updated: AssetSource;

//     if (asset.source_type === "rental") {
//       updated = {
//         ...asset,
//         name,
//         start_year: Number(startYear),
//         end_year: Number(endYear),
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
//         start_year: Number(startYear),
//         end_year: Number(endYear),
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
//     resetState();
//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />
//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

//         {asset.source_type === "rental" && (
//           <>
//             <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Purchase Price" />
//             <input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Down Payment" />
//             <input value={annualAppreciation} onChange={(e) => setAnnualAppreciation(e.target.value)} placeholder="Appreciation %" />
//             <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="Monthly Income" />
//             <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="Monthly Expenses" />
//           </>
//         )}

//         {asset.source_type === "stock" && (
//           <>
//             <input value={initialValue} onChange={(e) => setInitialValue(e.target.value)} placeholder="Initial Value" />
//             <input value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="Return %" />
//             <input value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder="Monthly Contribution" />
//             <input value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} placeholder="Dividend %" />
//           </>
//         )}

//         <button onClick={onSave}>Save</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", gap: "1rem" }}>
//       <span>
//         {asset.name} ({asset.start_year}-{asset.end_year}) — {asset.source_type === "rental" ? `Rental ($${asset.monthly_income}/mo)` : `Stock ($${asset.initial_value})`}
//       </span>

//       <button onClick={() => setIsEditing(true)}>Edit</button>

//       <button
//         onClick={() =>
//           dispatch({
//             type: "DELETE_ASSET",
//             payload: { id: asset.id },
//           })
//         }
//       >
//         Delete
//       </button>
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

// function LiquidAccountRow({ account, dispatch }: { account: LiquidAccount; dispatch: React.Dispatch<Action> }) {
//   const [isEditing, setIsEditing] = useState(false);

//   const [name, setName] = useState(account.name);

//   const [startYear, setStartYear] = useState(account.start_year.toString());

//   const [endYear, setEndYear] = useState(account.end_year.toString());

//   const [balance, setBalance] = useState(account.balance.toString());

//   const [threshold, setThreshold] = useState(account.interest_tiers[0]?.threshold?.toString() ?? "");

//   const [rate, setRate] = useState(account.interest_tiers[0]?.annual_rate?.toString() ?? "");

//   const onSave = () => {
//     dispatch({
//       type: "UPDATE_LIQUID_ACCOUNT",
//       payload: {
//         ...account,
//         name,
//         start_year: Number(startYear),
//         end_year: Number(endYear),
//         balance: Number(balance),
//         interest_tiers: [
//           {
//             threshold: Number(threshold),
//             annual_rate: Number(rate),
//           },
//         ],
//       },
//     });

//     setIsEditing(false);
//   };

//   const onCancel = () => {
//     setName(account.name);
//     setStartYear(account.start_year.toString());
//     setEndYear(account.end_year.toString());
//     setBalance(account.balance.toString());
//     setThreshold(account.interest_tiers[0]?.threshold?.toString() ?? "");
//     setRate(account.interest_tiers[0]?.annual_rate?.toString() ?? "");

//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div style={{ border: "1px solid gray", padding: "0.5rem" }}>
//         <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

//         <input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Start Year" />

//         <input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="End Year" />

//         <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />

//         <input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Threshold" />

//         <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" />

//         <button onClick={onSave}>Save</button>
//         <button onClick={onCancel}>Cancel</button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", gap: "1rem" }}>
//       <span>
//         {account.name} — ${account.balance} — {account.interest_tiers[0]?.annual_rate}%
//       </span>

//       <button onClick={() => setIsEditing(true)}>Edit</button>

//       <button
//         onClick={() =>
//           dispatch({
//             type: "DELETE_LIQUID_ACCOUNT",
//             payload: { id: account.id },
//           })
//         }
//       >
//         Delete
//       </button>
//     </div>
//   );
// }

// function LiquidAccountList({ accounts, dispatch }: { accounts: LiquidAccount[]; dispatch: React.Dispatch<Action> }) {
//   return (
//     <div>
//       <h3>Liquid Accounts</h3>

//       {accounts.map((account) => (
//         <LiquidAccountRow key={account.id} account={account} dispatch={dispatch} />
//       ))}
//     </div>
//   );
// }

// export function SimulationControls({ state, setSimResult }: { state: SimRequest; setSimResult: React.Dispatch<React.SetStateAction<SimYearResult[]>> }) {
//   const [hasResults, setHasResults] = useState(false);

//   async function runSimulation() {
//     try {
//       const API = "http://localhost:8000/api/finance/simulate";

//       const response = await fetch(API, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(state),
//       });

//       const data = await response.json();

//       console.log(data);
//       setSimResult(data);
//       setHasResults(true);
//     } catch (err) {
//       console.error("Simulation error:", err);
//     }
//   }

//   const clearSimulation = () => {
//     setSimResult([]);
//     setHasResults(false);
//   };

//   return (
//     <div>
//       <button onClick={runSimulation}>Run Simulation</button>
//       <button onClick={clearSimulation} disabled={!hasResults}>
//         Clear Simulation Result
//       </button>
//     </div>
//   );
// }

// export function SimResultViewer({ simResult }: { simResult: SimYearResult[] }) {
//   const [openYears, setOpenYears] = useState<number[]>([]);

//   const toggleYear = (year: number) => {
//     setOpenYears((previousState) => {
//       console.log("Previous state from React:", previousState);

//       const isOpen = previousState.includes(year);

//       if (isOpen) {
//         const nextState = previousState.filter((y) => y !== year);
//         console.log("Closing year → new state:", nextState);
//         return nextState;
//       }

//       const nextState = [...previousState, year];
//       console.log("Opening year → new state:", nextState);
//       return nextState;
//     });
//   };

//   return (
//     <div className="section">
//       <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//         <h2>Simulation Results</h2>

//         <button onClick={() => setOpenYears(simResult.map((y) => y.year))}>Expand All</button>
//         <button onClick={() => setOpenYears([])}>Collapse All</button>
//       </div>

//       <table className="mega-table">
//         <thead>
//           <tr>
//             <th>Year</th>
//             <th>Name</th>
//             <th>Type</th>
//             <th>Asset Value</th>
//             <th>Cashflow</th>
//             <th>Start</th>
//             <th>End</th>
//           </tr>
//         </thead>

//         <tbody>
//           {simResult.map((yearData) => (
//             <React.Fragment key={yearData.year}>
//               {/* YEAR SUMMARY ROW */}
//               <tr className="year-row" onClick={() => toggleYear(yearData.year)}>
//                 <td>{yearData.year}</td>
//                 <td colSpan={6}>
//                   Net Worth: ${yearData.net_worth} | Cash: ${yearData.total_cash} | Income: ${yearData.total_income} | Expenses: ${yearData.total_expenses}
//                 </td>
//               </tr>

//               {/* SOURCE ROWS */}
//               {openYears.includes(yearData.year) &&
//                 yearData.sources.map((src: any) => (
//                   <tr key={src.id} className="source-row">
//                     <td></td>
//                     <td>{src.name}</td>
//                     <td>{src.source_type}</td>
//                     <td>${src.asset_value}</td>
//                     <td>${src.annual_cashflow}</td>
//                     <td>{src.start_value ?? "-"}</td>
//                     <td>{src.end_value ?? "-"}</td>
//                   </tr>
//                 ))}
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default function Dashboard() {
//   // const sim = useSimulation();
//   const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
//   const [simResult, setSimResult] = useState<SimYearResult[]>([]);

//   return (
//     <div className="dash-root">
//       <aside className="dash-sidebar">
//         <div className="dash-logo">
//           <span className="dash-logo-mark">VL</span>
//           <span className="dash-logo-text">VantageLabs</span>
//         </div>
//         <nav className="dash-nav">
//           <a href="#" className="dash-nav-item dash-nav-active">
//             TESTING GROUNDS
//           </a>
//           <a href="/visuals" className="dash-nav-item dash-nav-active">
//             TESTING VISUALS
//           </a>
//         </nav>
//         <div className="dash-sidebar-footer">
//           <span className="dash-year-badge">FY 2025</span>
//         </div>
//       </aside>

//       <main className="dash-main">
//         <header className="dash-topbar">
//           <div>
//             <h1 className="dash-page-title">Financial Overview</h1>
//             <p className="dash-page-sub">Stepwise simulation · Annual variables</p>
//           </div>
//           <div className="dash-topbar-right">
//             <span className="dash-sim-badge">Sim: {SIM_MAX}yr</span>
//           </div>
//         </header>

//         <pre>{JSON.stringify(state, null, 2)}</pre>
//         <IncomeList incomes={state.incomes} dispatch={dispatch} />
//         <AssetList assets={state.assets} dispatch={dispatch} />
//         <ExpenseList expenses={state.expenses} dispatch={dispatch} />
//         <LiquidAccountList accounts={state.liquid_accounts} dispatch={dispatch} />

//         {/* liquid accounts */}
//         <LiquidAccountForm dispatch={dispatch} />

//         {/* assets */}
//         <AssetForm dispatch={dispatch} />

//         {/* incomes */}
//         <IncomeForm dispatch={dispatch} />

//         {/* expenses */}
//         <ExpenseForm dispatch={dispatch} />

//         <SimulationControls state={state} setSimResult={setSimResult} />
//         <SimResultViewer simResult={simResult} />

//         {/* {sim.error && <div className="dash-error">{sim.error}</div>} */}
//       </main>
//     </div>
//   );
// }
