import { useReducer, useEffect, useRef } from "react";
import { API, SIM_MAX, DEFAULTS } from "@/app/dashboard/constants";
import { buildPayload, propagateInputs } from "./utils";
import { clear } from "console";

// ─── API Types (mirrors backend schemas) ─────────────────────────────────────
export interface Tier {
  threshold: number;
  annual_rate: number;
}

export interface LiquidAccount {
  source_type: "liquid" | "cash";
  id: string;
  name: string;
  balance: number;
  interest_tiers: Tier[];
}

export interface JobIncome {
  source_type: "job";
  id: string;
  name: string;
  net_income: number;
  income_growth: number;
}

export interface ExpenseSource {
  source_type: "expense";
  id: string;
  name: string;
  annual_expense: number;
  expense_growth: number;
}

export interface RentalProperty {
  source_type: "rental";
  id: string;
  name: string;
  purchase_price: number;
  down_payment: number;
  annual_appreciation: number;
  monthly_rent: number;
  monthly_expenses: number;
}

export type AssetSource = RentalProperty; // extend union as more types added

export interface SourceSnapshot {
  id: string;
  name: string;
  source_type: string;
  asset_value: number;
  annual_cashflow: number;
  start_value: number | null;
  end_value: number | null;
}

export interface SimYearResult {
  year: number;
  net_worth: number;
  total_cash: number;
  total_income: number;
  total_expenses: number;
  sources: SourceSnapshot[];
}

// ─── Per-year editable inputs ─────────────────────────────────────────────────
// These are the fields the user can override on a per-year basis.
// Mirrors the "base" cashflow — liquid account tiers, job income, expenses.

export interface YearInputs {
  // liquid account (one for now)
  liquid_balance: number;
  interest_tiers: Tier[];
  // job income
  net_income: number;
  income_growth: number;
  // living expenses
  annual_expense: number;
  expense_growth: number;
}

export interface YearData {
  year: number;
  inputs: YearInputs;
  userEditedFields: Set<keyof YearInputs>;
  result?: SimYearResult;
}

// ─── Asset state (managed separately from timeline) ──────────────────────────

export interface AssetEntry {
  id: string;
  source: AssetSource;
  addedYear: number; // sim year the asset was added
  soldYear?: number; // sim year the asset was sold
}

// ─── Sim state ────────────────────────────────────────────────────────────────

type SimState = {
  timeline: YearData[];
  assets: AssetEntry[];
  currentYear: number;
  isPlaying: boolean;
  error: string | null;
  rerunFromYear: number | null;
};

function buildInitialTimeline(): YearData[] {
  return Array.from({ length: SIM_MAX }, (_, i) => ({
    year: i + 1,
    inputs: { ...DEFAULTS },
    userEditedFields: new Set<keyof YearInputs>(),
  }));
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type SimAction =
  | { type: "UPDATE_YEAR"; year: number; inputs: YearInputs }
  | { type: "SIMULATION_COMPLETE"; fromYear: number; snapshots: SimYearResult[] }
  | { type: "SIMULATION_ERROR"; error: string }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SEEK"; year: number }
  | { type: "ADVANCE_YEAR" }
  | { type: "RESET" }
  | { type: "ADD_ASSET"; asset: AssetSource; year: number }
  | { type: "SELL_ASSET"; id: string; year: number };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function updateRerun(from: number | null, year: number) {
  return from === null ? year : Math.min(from, year);
}

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "UPDATE_YEAR": {
      const updatedTimeline = propagateInputs(state.timeline, action.year, action.inputs);

      return {
        ...state,
        timeline: updatedTimeline,
        rerunFromYear: updateRerun(state.rerunFromYear, action.year),
      };
    }

    case "SIMULATION_COMPLETE": {
      const timelineWithResults = state.timeline.map((yearEntry) => {
        const matchingSnapshot = action.snapshots.find((snapshot) => snapshot.year === yearEntry.year);

        if (!matchingSnapshot) return yearEntry;

        return {
          ...yearEntry,
          result: matchingSnapshot,
        };
      });

      return {
        ...state,
        timeline: timelineWithResults,
        rerunFromYear: null,
        error: null,
      };
    }

    case "SIMULATION_ERROR":
      return {
        ...state,
        error: action.error,
      };

    case "SET_PLAYING":
      return {
        ...state,
        isPlaying: action.isPlaying,
      };

    case "SEEK":
      return {
        ...state,
        isPlaying: false,
        currentYear: Math.max(1, Math.min(SIM_MAX, action.year)),
      };

    case "ADVANCE_YEAR":
      return {
        ...state,
        currentYear: state.currentYear + 1,
      };

    case "RESET":
      return {
        timeline: buildInitialTimeline(),
        assets: [],
        currentYear: 1,
        isPlaying: false,
        error: null,
        rerunFromYear: 1,
      };

    case "ADD_ASSET":
      return {
        ...state,
        assets: [
          ...state.assets,
          {
            id: action.asset.id,
            source: action.asset,
            addedYear: action.year,
          },
        ],
        rerunFromYear: updateRerun(state.rerunFromYear, action.year),
      };

    case "SELL_ASSET":
      return {
        ...state,
        assets: state.assets.map((assetEntry) => (assetEntry.id === action.id ? { ...assetEntry, soldYear: action.year } : assetEntry)),
        rerunFromYear: updateRerun(state.rerunFromYear, action.year),
      };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// For display: prefer actual sim start values from result if available
function getDisplayInputs(yearData: YearData): YearInputs {
  const jobSnapshot = yearData.result?.sources.find((source) => source.source_type === "job");
  const expenseSnapshot = yearData.result?.sources.find((source) => source.source_type === "expense");

  return {
    ...yearData.inputs,
    net_income: jobSnapshot?.start_value ?? yearData.inputs.net_income,
    annual_expense: expenseSnapshot?.start_value ?? yearData.inputs.annual_expense,
  };
}

const initialState: SimState = {
  timeline: buildInitialTimeline(),
  assets: [],
  currentYear: 1,
  isPlaying: false,
  error: null,
  rerunFromYear: 1,
};

export function useSimulation() {
  const [state, dispatch] = useReducer(simReducer, initialState);
  // const [state, dispatch] = useReducer(simReducer, undefined, () => ({
  //   timeline: buildInitialTimeline(),
  //   assets: [],
  //   currentYear: 1,
  //   isPlaying: false,
  //   error: null,
  //   rerunFromYear: 1,
  // }));

  const { timeline, assets, currentYear, isPlaying, error, rerunFromYear } = state;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const currentYearData = timeline[currentYear - 1];

  const currentInputs = getDisplayInputs(currentYearData);

  const displayResult = currentYearData.result !== undefined ? currentYearData.result : null;

  const status = isPlaying ? "playing" : rerunFromYear !== null ? "edited" : currentYear >= SIM_MAX ? "done" : "paused";

  const runSimulation = async (fromYear: number) => {
    try {
      const simulationPayload = buildPayload(timeline, assets, fromYear);

      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulationPayload),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const simulationSnapshots: SimYearResult[] = await response.json();

      dispatch({ type: "SIMULATION_COMPLETE", fromYear, snapshots: simulationSnapshots, });
    } catch (error) {
      dispatch({ type: "SIMULATION_ERROR", error: (error as Error).message, });
    }
  };

  const play = async () => {
    if (rerunFromYear !== null) {
      await runSimulation(rerunFromYear);
    }

    dispatch({ type: "SET_PLAYING", isPlaying: true });
  };

  const pause = () => {
    clearTimer();
    dispatch({ type: "SET_PLAYING", isPlaying: false });
  };

  const reset = () => {
    clearTimer();
    dispatch({ type: "RESET" });
  };

  const seekTo = (year: number) => {
    clearTimer();
    dispatch({ type: "SEEK", year });
  };

  const updateYear = (year: number, inputs: YearInputs) => {
    dispatch({ type: "UPDATE_YEAR", year, inputs });
  };

  const addAsset = (assetSource: AssetSource) => {
    dispatch({ type: "ADD_ASSET", asset: assetSource, year: currentYear, });
  };

  const sellAsset = (assetId: string) => {
    dispatch({ type: "SELL_ASSET", id: assetId, year: currentYear });
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (currentYear >= SIM_MAX) {
      dispatch({ type: "SET_PLAYING", isPlaying: false });
      return;
    }

    timerRef.current = setTimeout(() => {
      dispatch({ type: "ADVANCE_YEAR" });
    }, 600);

    return () => clearTimer();
  }, [isPlaying, currentYear]);

  return {
    currentYear,
    currentYearData,
    assets,
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
    addAsset,
    sellAsset,
    getDisplayInputs,
  };
}
