import { useReducer, useEffect, useRef } from "react";
import { CASH_ON_HAND_DEFAULTS, API, SIM_MAX } from "@/app/dashboard/constants";
import { buildPayload, propagateInputs } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Tier {
  threshold: number;
  annual_rate: number;
}

export interface CashFlowInputs {
  net_income: number;
  income_growth: number;
  expenses: number;
  expense_growth: number;
  tiers: Tier[];
}

export interface AssetFlowInputs {
  asset_value: number;
}

export interface CashFlowResult {
  year: number;
  cash_on_hand: number;
  start_net_income: number;
  start_expenses: number;
  net_income: number;
  expenses: number;
}

export interface Inputs {
  cashflow: CashFlowInputs;

}

export interface YearData {
  year: number;
  inputs: CashFlowInputs;
  userEditedFields: Set<keyof CashFlowInputs>; // which fields this year explicitly owns
  result?: CashFlowResult; 
}


// ─── State ────────────────────────────────────────────────────────────────────
type SimState = {
  timeline: YearData[];
  currentYear: number;
  isPlaying: boolean;
  error: string | null;
  rerunFromYear: number | null;
};

function buildInitialTimeline(): YearData[] {
  return Array.from({ length: SIM_MAX }, (_, i) => ({
    year: i + 1,
    inputs: { ...CASH_ON_HAND_DEFAULTS },
    userEditedFields: new Set<keyof CashFlowInputs>(),
  }));
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type SimAction =
  | { type: "UPDATE_YEAR"; year: number; inputs: CashFlowInputs }
  | { type: "SIMULATION_COMPLETE"; fromYear: number; snapshots: CashFlowResult[] }
  | { type: "SIMULATION_ERROR"; error: string }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SEEK"; year: number }
  | { type: "ADVANCE_YEAR" }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "UPDATE_YEAR": {
      const timeline = propagateInputs(state.timeline, action.year, action.inputs);
      return {
        ...state,
        timeline,
        rerunFromYear: state.rerunFromYear === null ? action.year: Math.min(state.rerunFromYear, action.year),
      };
    }
    case "SIMULATION_COMPLETE": {
      const timeline = state.timeline.map((yearData) => {
        const snapshot = action.snapshots.find((s) => s.year === yearData.year);

        if (!snapshot) return yearData;
        return { ...yearData, result: snapshot };
      });

      return { ...state, timeline, rerunFromYear: null, error: null };
    }
    case "SIMULATION_ERROR":
      return { ...state, error: action.error };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };
    case "SEEK":
      return { ...state, isPlaying: false, currentYear: Math.max(1, Math.min(SIM_MAX, action.year)) };
    case "ADVANCE_YEAR":
      return { ...state, currentYear: state.currentYear + 1 };
    case "RESET":
      return { timeline: buildInitialTimeline(), currentYear: 1, isPlaying: false, error: null, rerunFromYear: 1 };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulation() {
  const [state, dispatch] = useReducer(simReducer, undefined, () => ({
    timeline: buildInitialTimeline(),
    currentYear: 1,
    isPlaying: false,
    error: null,
    rerunFromYear: 1,
  }));

  console.log("sim state", state);
  const { timeline, currentYear, isPlaying, error, rerunFromYear } = state;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentYearData = timeline[currentYear - 1];
  function getDisplayInputs(yearData: YearData): CashFlowInputs {
    return {
      ...yearData.inputs,

      // override with actual values used in simulation IF they exist
      net_income: yearData.result?.start_net_income ?? yearData.inputs.net_income,
      expenses: yearData.result?.start_expenses ?? yearData.inputs.expenses,
    };
  }
  // const currentInputs = currentYearData.inputs;
  const currentInputs = getDisplayInputs(currentYearData);

  const hasResult = currentYearData.result?.cash_on_hand !== undefined;
  const displayResult = hasResult ? {
    year: currentYearData.year,
    cash_on_hand: currentYearData.result!.cash_on_hand,
  } : null;
 
  const status = isPlaying ? "playing" : rerunFromYear !== null ? "edited" : currentYear >= SIM_MAX ? "done" : "paused";

  const runSimulation = async (fromYear: number) => {
    try {
      const payload = buildPayload(timeline, fromYear);
      console.log("simulation payload", payload);

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const snapshots: CashFlowResult[] = await res.json();
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

  const updateYear = (year: number, inputs: CashFlowInputs) => {
    dispatch({ type: "UPDATE_YEAR", year, inputs });
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (currentYear >= SIM_MAX) { dispatch({ type: "SET_PLAYING", isPlaying: false }); return; }
    timerRef.current = setTimeout(() => dispatch({ type: "ADVANCE_YEAR" }), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentYear]);

  return {
    currentYear,
    currentYearData,
    isPlaying,
    status,
    error,
    currentInputs,
    displayResult,
    play,
    pause,
    reset,
    seekTo,
    updateYear,
    getDisplayInputs
  };
}