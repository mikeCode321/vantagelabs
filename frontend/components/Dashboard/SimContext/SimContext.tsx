"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export const SIM_MAX = 30;

export interface YearInputs {
  cash_on_hand: number;
  net_income: { net_income: number; interest_rate: number };
  expenses: { expenses: number; interest_rate: number };
  tiers: { threshold: number; annual_rate: number }[];
}

export interface YearResult {
  cash_on_hand: number;
  net_income: number;
  expenses: number;
}

export interface LedgerEntry {
  year: number;
  inputs: YearInputs;
  result: YearResult | null;
}

export const DEFAULT_INPUTS: YearInputs = {
  cash_on_hand: 100000,
  net_income: { net_income: 80000, interest_rate: 0.03 },
  expenses: { expenses: 50000, interest_rate: 0.02 },
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

interface SimContextValue {
  currentYear: number;
  isPlaying: boolean;
  ledger: LedgerEntry[];
  play: () => void;
  pause: () => void;
  reset: () => void;
  seekTo: (year: number) => void;
  updateYear: (year: number, inputs: YearInputs) => void;
  commitResult: (year: number, result: YearResult) => void;
}

const SimContext = createContext<SimContextValue | null>(null);

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [currentYear, setCurrentYear] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { year: 0, inputs: structuredClone(DEFAULT_INPUTS), result: null },
  ]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTick = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTick();
  }, [clearTick]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    clearTick();
    setCurrentYear(0);
    setLedger([{ year: 0, inputs: structuredClone(DEFAULT_INPUTS), result: null }]);
  }, [clearTick]);

  // seekTo only moves the slider — does not trigger any computation
  const seekTo = useCallback((year: number) => {
    setIsPlaying(false);
    clearTick();
    setCurrentYear(Math.max(0, Math.min(SIM_MAX, year)));
  }, [clearTick]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Update inputs for a specific year and wipe all entries after it
  const updateYear = useCallback((year: number, inputs: YearInputs) => {
    setLedger((prev) =>
      prev
        .filter((e) => e.year <= year)
        .map((e) => e.year === year ? { ...e, inputs, result: null } : e)
    );
  }, []);

  // Store a result and seed the next year's entry using the compounded values
  const commitResult = useCallback((year: number, result: YearResult) => {
    setLedger((prev) => {
      const withResult = prev.map((e) =>
        e.year === year ? { ...e, result } : e
      );
      const nextYear = year + 1;
      if (nextYear <= SIM_MAX && !withResult.some((e) => e.year === nextYear)) {
        const thisEntry = withResult.find((e) => e.year === year)!;
        withResult.push({
          year: nextYear,
          inputs: {
            ...structuredClone(thisEntry.inputs),
            cash_on_hand: result.cash_on_hand,
            net_income: { ...thisEntry.inputs.net_income, net_income: result.net_income },
            expenses: { ...thisEntry.inputs.expenses, expenses: result.expenses },
          },
          result: null,
        });
      }
      return withResult.sort((a, b) => a.year - b.year);
    });
  }, []);

  // Playback loop.
  // Year 0 has no computation — advance straight to year 1.
  // Any other year: wait until that year has a result, then advance.
  // The component's useEffect fires the API call and calls commitResult,
  // which updates the ledger, which re-runs this effect and advances.
  useEffect(() => {
    if (!isPlaying) return;

    if (currentYear >= SIM_MAX) {
      setIsPlaying(false);
      return;
    }

    const entry = ledger.find((e) => e.year === currentYear);
    const hasResult = currentYear === 0 || entry?.result != null;

    if (hasResult) {
      timeoutRef.current = setTimeout(() => {
        setCurrentYear((y) => y + 1);
      }, 600);
    }
    // If no result yet, do nothing — wait for commitResult to update ledger
    // which will trigger this effect again

    return () => clearTick();
  }, [isPlaying, currentYear, ledger, clearTick]);

  return (
    <SimContext.Provider value={{
      currentYear, isPlaying, ledger,
      play, pause, reset, seekTo, updateYear, commitResult,
    }}>
      {children}
    </SimContext.Provider>
  );
}

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used inside <SimProvider>");
  return ctx;
}