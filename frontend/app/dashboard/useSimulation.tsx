// import { useReducer, useEffect, useRef } from "react";
// import { API, SIM_MAX } from "@/app/dashboard/constants";

// /* ─────────────────────────────────────────────
//    TYPES (match backend EXACTLY)
// ───────────────────────────────────────────── */

// export interface Tier {
//   threshold: number;
//   annual_rate: number;
// }

// export interface LiquidAccount {
//   source_type: "liquid";
//   id: string;
//   name: string;
//   balance: number;
//   interest_tiers: Tier[];
// }

// export interface IncomeSource {
//   source_type: "income";
//   id: string;
//   name: string;
//   net_income: number;
//   income_growth: number;
// }

// export interface ExpenseSource {
//   source_type: "expense";
//   id: string;
//   name: string;
//   annual_expense: number;
//   expense_growth: number;
// }

// export interface RentalProperty {
//   source_type: "rental";
//   id: string;
//   name: string;
//   purchase_price: number;
//   down_payment: number;
//   annual_appreciation: number;
//   monthly_income: number;
//   monthly_expenses: number;
// }

// export type AssetSource = RentalProperty;

// /* ─── Events ───────────────────────────────── */

// export interface IncomeEvent {
//   year: number;
//   source_id: string;
//   action: "update" | "remove";
//   net_income?: number;
//   income_growth?: number;
// }

// export interface ExpenseEvent {
//   year: number;
//   source_id: string;
//   action: "update" | "remove";
//   annual_expense?: number;
//   expense_growth?: number;
// }

// export interface AssetEvent {
//   year: number;
//   action: "add" | "remove" | "update";
//   source: AssetSource;
// }

// export interface SimEvent {
//   year: number;
//   income_events: IncomeEvent[];
//   expense_events: ExpenseEvent[];
//   asset_events: AssetEvent[];
// }

// /* ─── Request / Response ───────────────────── */

// export interface SimRequest {
//   start_year: number;
//   end_year: number;

//   liquid_accounts: LiquidAccount[];
//   incomes: IncomeSource[];
//   expenses: ExpenseSource[];
//   assets: AssetSource[];

//   events: SimEvent[];
// }

// export interface SourceSnapshot {
//   id: string;
//   name: string;
//   source_type: string;
//   asset_value: number;
//   annual_cashflow: number;
//   start_value?: number;
//   end_value?: number;
// }

// export interface SimYearResult {
//   year: number;
//   net_worth: number;
//   total_cash: number;
//   total_income: number;
//   total_expenses: number;
//   sources: SourceSnapshot[];
// }

// /* ─────────────────────────────────────────────
//    STATE
// ───────────────────────────────────────────── */

// type SimState = {
//   request: SimRequest;
//   results: Map<number, SimYearResult>;

//   currentYear: number;
//   isPlaying: boolean;
//   rerunFromYear: number | null;
//   error: string | null;
// };

// /* ─────────────────────────────────────────────
//    INITIAL STATE
// ───────────────────────────────────────────── */

// const INITIAL_STATE: SimState = {
//   request: {
//     start_year: 1,
//     end_year: SIM_MAX,

//     liquid_accounts: [
//       {
//         source_type: "liquid",
//         id: "hysa_1",
//         name: "Primary Account",
//         balance: 10000,
//         interest_tiers: [
//           { threshold: 50000, annual_rate: 0.045 },
//           { threshold: 200000, annual_rate: 0.05 },
//         ],
//       },
//     ],

//     incomes: [
//       {
//         source_type: "income",
//         id: "job_1",
//         name: "Income",
//         net_income: 80000,
//         income_growth: 0.03,
//       },
//     ],

//     expenses: [
//       {
//         source_type: "expense",
//         id: "exp_1",
//         name: "Expenses",
//         annual_expense: 40000,
//         expense_growth: 0.02,
//       },
//     ],

//     assets: [],
//     events: [],
//   },

//   results: new Map(),

//   currentYear: 1,
//   isPlaying: false,
//   rerunFromYear: 1,
//   error: null,
// };

// /* ─────────────────────────────────────────────
//    HELPERS
// ───────────────────────────────────────────── */

// function updateRerun(from: number | null, year: number) {
//   return from === null ? year : Math.min(from, year);
// }

// function upsertEvent(events: SimEvent[], incoming: SimEvent): SimEvent[] {
//   const existing = events.find(e => e.year === incoming.year);

//   if (!existing) return [...events, incoming];

//   return events.map(e =>
//     e.year === incoming.year
//       ? {
//           ...e,
//           income_events: [...e.income_events, ...incoming.income_events],
//           expense_events: [...e.expense_events, ...incoming.expense_events],
//           asset_events: [...e.asset_events, ...incoming.asset_events],
//         }
//       : e
//   );
// }

// /* ─────────────────────────────────────────────
//    ACTIONS
// ───────────────────────────────────────────── */

// type SimAction =
//   | { type: "ADD_EVENT"; event: SimEvent }
//   | { type: "SIMULATION_COMPLETE"; results: SimYearResult[] }
//   | { type: "SIMULATION_ERROR"; error: string }
//   | { type: "SET_PLAYING"; isPlaying: boolean }
//   | { type: "SEEK"; year: number }
//   | { type: "ADVANCE_YEAR" }
//   | { type: "RESET" };

// /* ─────────────────────────────────────────────
//    REDUCER
// ───────────────────────────────────────────── */

// function simReducer(state: SimState, action: SimAction): SimState {
//   switch (action.type) {
//     case "ADD_EVENT":
//       return {
//         ...state,
//         request: {
//           ...state.request,
//           events: upsertEvent(state.request.events, action.event),
//         },
//         rerunFromYear: updateRerun(state.rerunFromYear, action.event.year),
//       };

//     case "SIMULATION_COMPLETE": {
//       const map = new Map(state.results);

//       action.results.forEach(r => {
//         map.set(r.year, r);
//       });

//       return {
//         ...state,
//         results: map,
//         rerunFromYear: null,
//         error: null,
//       };
//     }

//     case "SIMULATION_ERROR":
//       return { ...state, error: action.error };

//     case "SET_PLAYING":
//       return { ...state, isPlaying: action.isPlaying };

//     case "SEEK":
//       return {
//         ...state,
//         isPlaying: false,
//         currentYear: Math.max(1, Math.min(SIM_MAX, action.year)),
//       };

//     case "ADVANCE_YEAR":
//       return {
//         ...state,
//         currentYear: Math.min(state.currentYear + 1, SIM_MAX),
//       };

//     case "RESET":
//       return INITIAL_STATE;

//     default:
//       return state;
//   }
// }

// /* ─────────────────────────────────────────────
//    HOOK
// ───────────────────────────────────────────── */

// export function useSimulation() {
//   const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);

//   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const clearTimer = () => {
//     if (timerRef.current) clearTimeout(timerRef.current);
//   };

//   const current = state.results.get(state.currentYear);

//   /* ─── API ───────────────────────────────── */

//   const runSimulation = async () => {
//     try {
//       const start = state.rerunFromYear ?? 1;

//       const response = await fetch(API, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...state.request,
//           start_year: start,
//         }),
//       });

//       const data: SimYearResult[] = await response.json();

//       dispatch({ type: "SIMULATION_COMPLETE", results: data });
//     } catch (err) {
//       dispatch({
//         type: "SIMULATION_ERROR",
//         error: (err as Error).message,
//       });
//     }
//   };

//   /* ─── EVENT HELPERS ─────────────────────── */

//   const updateIncome = (year: number, updates: Partial<IncomeEvent>) => {
//     dispatch({
//       type: "ADD_EVENT",
//       event: {
//         year,
//         income_events: [
//           {
//             year,
//             source_id: "job_1",
//             action: "update",
//             ...updates,
//           },
//         ],
//         expense_events: [],
//         asset_events: [],
//       },
//     });
//   };

//   const updateExpense = (year: number, updates: Partial<ExpenseEvent>) => {
//     dispatch({
//       type: "ADD_EVENT",
//       event: {
//         year,
//         income_events: [],
//         expense_events: [
//           {
//             year,
//             source_id: "exp_1",
//             action: "update",
//             ...updates,
//           },
//         ],
//         asset_events: [],
//       },
//     });
//   };

//   /* ─── PLAYBACK ─────────────────────────── */

//   const play = async () => {
//     if (state.rerunFromYear !== null) {
//       await runSimulation();
//     }
//     dispatch({ type: "SET_PLAYING", isPlaying: true });
//   };

//   const pause = () => {
//     clearTimer();
//     dispatch({ type: "SET_PLAYING", isPlaying: false });
//   };

//   const seekTo = (year: number) => {
//     clearTimer();
//     dispatch({ type: "SEEK", year });
//   };

//   /* ─── AUTO ADVANCE ─────────────────────── */

//   useEffect(() => {
//     if (!state.isPlaying) return;

//     if (state.currentYear >= SIM_MAX) {
//       dispatch({ type: "SET_PLAYING", isPlaying: false });
//       return;
//     }

//     timerRef.current = setTimeout(() => {
//       dispatch({ type: "ADVANCE_YEAR" });
//     }, 600);

//     return () => clearTimer();
//   }, [state.isPlaying, state.currentYear]);

//   return {
//     currentYear: state.currentYear,
//     currentResult: current,
//     results: state.results,

//     play,
//     pause,
//     seekTo,

//     updateIncome,
//     updateExpense,

//     isPlaying: state.isPlaying,
//     error: state.error,
//   };
// }