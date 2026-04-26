// import { SIM_MAX, DEFAULTS } from "@/app/dashboard/constants";
// import type { YearData, YearInputs, AssetEntry } from "./useSimulation";

// // Propagate changed fields forward through the timeline.
// // Each field stops propagating when a year explicitly owns it.
// export function propagateInputs(timeline: YearData[], editedYear: number, newInputs: YearInputs): YearData[] {
//   return timeline.map((entry) => {
//     if (entry.year < editedYear) return entry;

//     // edited year: replace inputs entirely
//     if (entry.year === editedYear) {
//       const updatedEditedFields = new Set(entry.userEditedFields);

//       (Object.keys(newInputs) as (keyof YearInputs)[]).forEach((k) => {
//         updatedEditedFields.add(k);
//       });

//       return {
//         ...entry,
//         inputs: newInputs,
//         userEditedFields: updatedEditedFields,
//         result: undefined,
//       };
//     }

//     // future years: rebuild inputs from previous + overrides
//     const prev = timeline.find((y) => y.year === entry.year - 1)?.inputs ?? newInputs;

//     const merged: YearInputs = {
//       ...prev,
//       ...entry.inputs, // preserves user edits in that year
//     };

//     return {
//       ...entry,
//       inputs: merged,
//       result: undefined,
//     };
//   });
// }

// // Build the API payload from timeline + assets state.
// // Matches the backend SimulateRequest schema exactly.
// export function buildPayload(timeline: YearData[], assets: AssetEntry[], fromYear: number) {
//   const prevYear = timeline.find((y) => y.year === fromYear - 1);
//   const startBalance = prevYear?.result?.total_cash ?? DEFAULTS.liquid_balance;
//   const base = prevYear?.inputs ?? { ...DEFAULTS };

//   // ── Asset events ────────────────────────────────────────────────────────
//   // AssetEvent shape: { year, action, source }
//   const assetEventsByYear: Record<number, object[]> = {};

//   for (const entry of assets) {
//     if (entry.addedYear >= fromYear) {
//       const yr = entry.addedYear;
//       if (!assetEventsByYear[yr]) assetEventsByYear[yr] = [];
//       assetEventsByYear[yr].push({
//         year: yr, // backend AssetEvent has year field
//         action: "add",
//         source: entry.source,
//       });
//     }
//     if (entry.soldYear !== undefined && entry.soldYear >= fromYear) {
//       const yr = entry.soldYear;
//       if (!assetEventsByYear[yr]) assetEventsByYear[yr] = [];
//       assetEventsByYear[yr].push({
//         year: yr, // backend AssetEvent has year field
//         action: "remove",
//         source: entry.source,
//       });
//     }
//   }

//   // ── Income / expense events ──────────────────────────────────────────────
//   // IncomeEvent shape:  { year, source_id, action, net_income?, income_growth? }
//   // ExpenseEvent shape: { year, source_id, action, annual_expense?, expense_growth? }
//   const cashflowEventsByYear: Record<number, { income_events: object[]; expense_events: object[] }> = {};

//   for (const yd of timeline) {
//     if (yd.year < fromYear || yd.userEditedFields.size === 0) continue;

//     const incomeFields: Record<string, unknown> = {};
//     const expenseFields: Record<string, unknown> = {};

//     if (yd.userEditedFields.has("net_income")) incomeFields.net_income = yd.inputs.net_income;
//     if (yd.userEditedFields.has("income_growth")) incomeFields.income_growth = yd.inputs.income_growth;
//     if (yd.userEditedFields.has("annual_expense")) expenseFields.annual_expense = yd.inputs.annual_expense;
//     if (yd.userEditedFields.has("expense_growth")) expenseFields.expense_growth = yd.inputs.expense_growth;

//     if (Object.keys(incomeFields).length > 0 || Object.keys(expenseFields).length > 0) {
//       cashflowEventsByYear[yd.year] = {
//         income_events:
//           Object.keys(incomeFields).length > 0
//             ? [
//                 {
//                   year: yd.year, // backend IncomeEvent has year field
//                   source_id: "job_1",
//                   action: "update",
//                   ...incomeFields,
//                 },
//               ]
//             : [],
//         expense_events:
//           Object.keys(expenseFields).length > 0
//             ? [
//                 {
//                   year: yd.year, // backend ExpenseEvent has year field
//                   source_id: "exp_1",
//                   action: "update",
//                   ...expenseFields,
//                 },
//               ]
//             : [],
//       };
//     }
//   }

//   // ── Merge events by year ─────────────────────────────────────────────────
//   const allYears = new Set([...Object.keys(assetEventsByYear).map(Number), ...Object.keys(cashflowEventsByYear).map(Number)]);

//   const events = Array.from(allYears)
//     .sort((a, b) => a - b)
//     .map((yr) => ({
//       year: yr,
//       income_events: cashflowEventsByYear[yr]?.income_events ?? [],
//       expense_events: cashflowEventsByYear[yr]?.expense_events ?? [],
//       asset_events: assetEventsByYear[yr] ?? [],
//     }));

//   // Assets already active before fromYear (owned, not yet sold)
//   const activeAssets = assets.filter((a) => a.addedYear < fromYear && (a.soldYear === undefined || a.soldYear >= fromYear)).map((a) => a.source);

//   return {
//     start_year: fromYear,
//     end_year: SIM_MAX,
//     liquid_accounts: [
//       {
//         source_type: "liquid",
//         id: "hysa_1",
//         name: "Primary Account",
//         balance: startBalance,
//         interest_tiers: base.interest_tiers,
//       },
//     ],
//     incomes: [
//       {
//         source_type: "job",
//         id: "job_1",
//         name: "Income",
//         net_income: base.net_income,
//         income_growth: base.income_growth,
//       },
//     ],
//     expenses: [
//       {
//         source_type: "expense",
//         id: "exp_1",
//         name: "Expenses",
//         annual_expense: base.annual_expense,
//         expense_growth: base.expense_growth,
//       },
//     ],
//     assets: activeAssets,
//     events,
//   };
// }
