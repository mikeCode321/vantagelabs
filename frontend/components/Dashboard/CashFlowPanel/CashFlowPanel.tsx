// "use client";
// import "./CashFlowPanel.css";
// import { useState } from "react";
// import type { Tier } from "@/app/dashboard/useSimulation";

// const fmt = (n: number) =>
//   n.toLocaleString("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// interface IncomeSource {
//   net_income: number;
//   income_growth: number;
// }

// interface ExpenseSource {
//   annual_expense: number;
//   expense_growth: number;
// }

// interface HYSAIntTier {
//   threshold: number;
//   annual_rate: number;
// }

// interface CashFlowInputs {
//   income: IncomeSource;
//   expense: ExpenseSource;
//   interest_tiers: HYSAIntTier[];
// }

// interface Props {
//   currentYear: number;
//   yearData: YearData;

//   updateIncome: (year: number, income: IncomeSource) => void;
//   updateExpense: (year: number, expense: ExpenseSource) => void;
//   updateInterestTiers: (year: number, tiers: HYSAIntTier[]) => void;
// }

// export default function CashFlowPanel({ currentYear, yearData, updateIncome, updateExpense, updateInterestTiers }: Props) {
//   const [draft, setDraft] = useState<CashFlowInputs | null>(null);
//   const [open, setOpen] = useState(false);

//   const inputs = yearData.inputs;
//   const hasResult = !!yearData.result;

//   const jobSnap = yearData.result?.sources.find((s) => s.source_type === "job");

//   const expSnap = yearData.result?.sources.find((s) => s.source_type === "expense");

//   const liquidSnap = yearData.result?.sources.find((s) => s.source_type === "liquid" || s.source_type === "cash");

//   const openModal = () => {
//     setDraft({
//       income: {
//         net_income: inputs.net_income,
//         income_growth: inputs.income_growth,
//       },
//       expense: {
//         annual_expense: inputs.annual_expense,
//         expense_growth: inputs.expense_growth,
//       },
//       interest_tiers: inputs.interest_tiers,
//     });

//     setOpen(true);
//   };

//   const closeModal = () => {
//     setDraft(null);
//     setOpen(false);
//   };

//   const updateTier = (i: number, field: keyof Tier, value: number) => {
//     if (!draft) return;

//     const tiers = [...draft.interest_tiers];
//     tiers[i] = { ...tiers[i], [field]: value };

//     setDraft({ ...draft, interest_tiers: tiers });
//   };

//   const handleSave = () => {
//     if (!draft) return;

//     updateIncome(currentYear, draft.income);
//     updateExpense(currentYear, draft.expense);
//     updateInterestTiers(currentYear, draft.interest_tiers);

//     closeModal();
//   };

//   return (
//     <>
//       <div className="coh-card">
//         <div className="coh-card-header">
//           <span className="coh-card-title">Cash Flow</span>
//           <button className="coh-edit-btn" onClick={openModal}>
//             Edit
//           </button>
//         </div>

//         <div className="coh-stat-grid">
//           <div className="coh-stat">
//             <span className="coh-stat-label">Year</span>
//             <span className="coh-stat-value">{currentYear}</span>
//           </div>

//           <div className="coh-stat">
//             <span className="coh-stat-label">Income Growth</span>
//             <span className="coh-stat-value">{pct(inputs.income_growth)}</span>
//           </div>

//           <div className="coh-stat">
//             <span className="coh-stat-label">Expense Growth</span>
//             <span className="coh-stat-value">{pct(inputs.expense_growth)}</span>
//           </div>

//           {/* Income */}
//           <div className="coh-stat">
//             <span className="coh-stat-label">Start Income</span>
//             <span className="coh-stat-value">{hasResult && jobSnap?.start_value != null ? `$${fmt(jobSnap.start_value)}` : `$${fmt(inputs.net_income)}`}</span>
//           </div>

//           <div className="coh-stat">
//             <span className="coh-stat-label">End Income</span>
//             <span className="coh-stat-value">{hasResult && jobSnap?.end_value != null ? `$${fmt(jobSnap.end_value)}` : "—"}</span>
//           </div>

//           <div className="coh-stat" />

//           {/* Expense */}
//           <div className="coh-stat">
//             <span className="coh-stat-label">Start Expenses</span>
//             <span className="coh-stat-value">{hasResult && expSnap?.start_value != null ? `$${fmt(expSnap.start_value)}` : `$${fmt(inputs.annual_expense)}`}</span>
//           </div>

//           <div className="coh-stat">
//             <span className="coh-stat-label">End Expenses</span>
//             <span className="coh-stat-value">{hasResult && expSnap?.end_value != null ? `$${fmt(expSnap.end_value)}` : "—"}</span>
//           </div>

//           <div className="coh-stat" />

//           {/* Interest */}
//           {hasResult && liquidSnap && (
//             <>
//               <div className="coh-stat">
//                 <span className="coh-stat-label">Interest Earned</span>
//                 <span className="coh-stat-value">${fmt(liquidSnap.annual_cashflow)}</span>
//               </div>
//               <div className="coh-stat" />
//               <div className="coh-stat" />
//             </>
//           )}
//         </div>

//         <div className="coh-projection">
//           <span className="coh-projection-label">{hasResult ? `End of Year ${currentYear}` : "\u00A0"}</span>
//           <span className="coh-projection-value">{hasResult && yearData.result?.total_cash != null ? `$${fmt(yearData.result.total_cash)}` : "Press play to calculate"}</span>
//         </div>

//         {hasResult && yearData.result?.net_worth != null && (
//           <div className="coh-networth">
//             <span className="coh-networth-label">Net Worth</span>
//             <span className="coh-networth-value">${fmt(yearData.result.net_worth)}</span>
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       {open && draft && (
//         <div className="coh-overlay" onClick={closeModal}>
//           <div className="coh-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="coh-modal-header">
//               <span className="coh-modal-title">Edit — Year {currentYear}</span>
//               <button className="coh-close-btn" onClick={closeModal}>
//                 ×
//               </button>
//             </div>

//             <div className="coh-modal-body">
//               {/* Income */}
//               <div className="coh-group">
//                 <span className="coh-group-label">Net Income</span>

//                 <div className="coh-row">
//                   <div className="coh-field">
//                     <label>Amount</label>
//                     <input
//                       type="number"
//                       value={draft.income.net_income}
//                       onChange={(e) =>
//                         setDraft({
//                           ...draft,
//                           income: {
//                             ...draft.income,
//                             net_income: Number(e.target.value) || 0,
//                           },
//                         })
//                       }
//                     />
//                   </div>

//                   <div className="coh-field">
//                     <label>Growth</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={draft.income.income_growth}
//                       onChange={(e) =>
//                         setDraft({
//                           ...draft,
//                           income: {
//                             ...draft.income,
//                             income_growth: Number(e.target.value) || 0,
//                           },
//                         })
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Expense */}
//               <div className="coh-group">
//                 <span className="coh-group-label">Expenses</span>

//                 <div className="coh-row">
//                   <div className="coh-field">
//                     <label>Amount</label>
//                     <input
//                       type="number"
//                       value={draft.expense.annual_expense}
//                       onChange={(e) =>
//                         setDraft({
//                           ...draft,
//                           expense: {
//                             ...draft.expense,
//                             annual_expense: Number(e.target.value) || 0,
//                           },
//                         })
//                       }
//                     />
//                   </div>

//                   <div className="coh-field">
//                     <label>Growth</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={draft.expense.expense_growth}
//                       onChange={(e) =>
//                         setDraft({
//                           ...draft,
//                           expense: {
//                             ...draft.expense,
//                             expense_growth: Number(e.target.value) || 0,
//                           },
//                         })
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Interest tiers */}
//               <div className="coh-group">
//                 <div className="coh-tier-header">
//                   <span className="coh-group-label">Interest Tiers</span>
//                 </div>

//                 {draft.interest_tiers.map((tier, i) => (
//                   <div key={i} className="coh-tier-row">
//                     <input type="number" value={tier.threshold} onChange={(e) => updateTier(i, "threshold", Number(e.target.value) || 0)} />
//                     <input type="number" step="0.001" value={tier.annual_rate} onChange={(e) => updateTier(i, "annual_rate", Number(e.target.value) || 0)} />
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="coh-modal-footer">
//               <button onClick={closeModal}>Cancel</button>
//               <button onClick={handleSave}>Save</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
