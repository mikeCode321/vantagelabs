import { useReducer, useEffect, useRef } from "react";
import { API, SIM_MAX } from "@/app/dashboard/constants";
import { getSimParamsAsOf, buildPayload } from "./utils";

export interface Tier {
  threshold: number;
  annual_rate: number;
}

export interface SimEvent {
  year: number;
  net_income?: number;
  income_growth?: number;
  expenses?: number;
  expense_growth?: number;
  tiers?: Tier[];
}

export interface YearSnapshot {
  year: number;
  cash_on_hand: number;
  start_net_income: number;
  start_expenses: number;
  net_income: number;
  expenses: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

type SimState = {
  events: SimEvent[];
  results: YearSnapshot[];
  currentYear: number;
  isPlaying: boolean;
  error: string | null;
  rerunFromYear: number | null;
};

const INITIAL_STATE: SimState = {
  events: [],
  results: [],
  currentYear: 1,
  isPlaying: false,
  error: null,
  rerunFromYear: 1,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type SimAction =
  | { type: "UPDATE_EVENT"; event: SimEvent }
  | { type: "SIMULATION_COMPLETE"; fromYear: number; snapshots: YearSnapshot[] }
  | { type: "SIMULATION_ERROR"; error: string }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SEEK"; year: number }
  | { type: "ADVANCE_YEAR" }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "UPDATE_EVENT":
      return {
        ...state,
        events: [...state.events.filter((e) => e.year !== action.event.year), action.event]
          .sort((a, b) => a.year - b.year),
        rerunFromYear: state.rerunFromYear === null
          ? action.event.year
          : Math.min(state.rerunFromYear, action.event.year),
        results: state.results.filter((r) => r.year < action.event.year),
      };
    case "SIMULATION_COMPLETE":
      return {
        ...state,
        results: [...state.results.filter((r) => r.year < action.fromYear), ...action.snapshots],
        rerunFromYear: null,
        error: null,
      };
    case "SIMULATION_ERROR":
      return { ...state, error: action.error };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };
    case "SEEK":
      return { ...state, isPlaying: false, currentYear: Math.max(1, Math.min(SIM_MAX, action.year)) };
    case "ADVANCE_YEAR":
      return { ...state, currentYear: state.currentYear + 1 };
    case "RESET":
      return { ...INITIAL_STATE };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulation() {
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
  const { events, results, currentYear, isPlaying, error, rerunFromYear } = state;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentResult = results.find((r) => r.year === currentYear) ?? null;
  const lastResult = [...results].reverse().find((r) => r.year <= currentYear) ?? null;
  const displayResult = currentResult ?? (isPlaying ? lastResult : null);

  const currentEvent = events.find((e) => e.year === currentYear);
  const resolvedBase = getSimParamsAsOf(events, currentYear);
  const currentInputs = {
    net_income: currentResult?.net_income ?? currentEvent?.net_income ?? resolvedBase.net_income,
    income_growth: currentEvent?.income_growth ?? resolvedBase.income_growth,
    expenses: currentResult?.expenses ?? currentEvent?.expenses ?? resolvedBase.expenses,
    expense_growth: currentEvent?.expense_growth ?? resolvedBase.expense_growth,
    tiers: currentEvent?.tiers ?? resolvedBase.tiers,
  };

  const status =
    isPlaying ? "playing" : rerunFromYear !== null ? "edited" : currentYear >= SIM_MAX ? "done" : "paused";

  const runSimulation = async (fromYear: number) => {
    try {
      const payload = buildPayload(events, results, fromYear);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const snapshots: YearSnapshot[] = await res.json();
      dispatch({ type: "SIMULATION_COMPLETE", fromYear, snapshots });
    } catch (err) {
      dispatch({ type: "SIMULATION_ERROR", error: (err as Error).message });
    }
  };

  const play = async () => {
    if (rerunFromYear !== null) await runSimulation(rerunFromYear);
    dispatch({ type: "SET_PLAYING", isPlaying: true });
  };

  const pause = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: "SET_PLAYING", isPlaying: false });
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: "RESET" });
  };

  const seekTo = (year: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: "SEEK", year });
  };

  const updateEvent = (event: SimEvent) => {
    dispatch({ type: "UPDATE_EVENT", event });
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (currentYear >= SIM_MAX) { dispatch({ type: "SET_PLAYING", isPlaying: false }); return; }
    timerRef.current = setTimeout(() => dispatch({ type: "ADVANCE_YEAR" }), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentYear]);

  return {
    currentYear,
    isPlaying,
    status,
    error,
    currentInputs,
    currentResult,
    displayResult,
    play,
    pause,
    reset,
    seekTo,
    updateEvent,
  };
}