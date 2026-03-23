import { useState, useEffect, useRef } from "react";
import { CASH_ON_HAND_DEFAULTS, API } from "@/app/dashboard/constants";
import { SIM_MAX } from "./page";

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
  net_income: number;
  expenses: number;
}

// Gets all events prior to beforeYear and replays them in order, last write wins per field.
function resolveParamsAtYear(events: SimEvent[], beforeYear: number) {
  const base = { ...CASH_ON_HAND_DEFAULTS };
  for (const ev of events.filter((e) => e.year < beforeYear)) {
    if (ev.net_income !== undefined) base.net_income = ev.net_income;
    if (ev.income_growth !== undefined) base.income_growth = ev.income_growth;
    if (ev.expenses !== undefined) base.expenses = ev.expenses;
    if (ev.expense_growth !== undefined) base.expense_growth = ev.expense_growth;
    if (ev.tiers !== undefined) base.tiers = ev.tiers;
  }
  return base;
}

function buildPayload(events: SimEvent[], results: YearSnapshot[], fromYear: number) {
  const prevResult = [...results].reverse().find((r) => r.year === fromYear - 1);
  return {
    ...resolveParamsAtYear(events, fromYear),
    start_cash: prevResult?.cash_on_hand ?? CASH_ON_HAND_DEFAULTS.start_cash,
    start_year: fromYear,
    end_year: SIM_MAX,
    events: events.filter((e) => e.year >= fromYear),
  };
}

export function useSimulation() {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [results, setResults] = useState<YearSnapshot[]>([]);
  const [currentYear, setCurrentYear] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunFromYear, setRerunFromYear] = useState<number | null>(1);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentResult = results.find((r) => r.year === currentYear) ?? null;
  const lastResult = [...results].reverse().find((r) => r.year <= currentYear) ?? null;
  const displayResult = currentResult ?? (isPlaying ? lastResult : null);

  const currentEvent = events.find((e) => e.year === currentYear);
  const currentInputs = {
    net_income: currentResult?.net_income ?? currentEvent?.net_income ?? CASH_ON_HAND_DEFAULTS.net_income,
    income_growth: currentEvent?.income_growth ?? CASH_ON_HAND_DEFAULTS.income_growth,
    expenses: currentResult?.expenses ?? currentEvent?.expenses ?? CASH_ON_HAND_DEFAULTS.expenses,
    expense_growth: currentEvent?.expense_growth ?? CASH_ON_HAND_DEFAULTS.expense_growth,
    tiers: currentEvent?.tiers ?? CASH_ON_HAND_DEFAULTS.tiers,
  };

  const status =
    isPlaying ? "playing" : rerunFromYear !== null ? "edited" : currentYear >= SIM_MAX ? "done" : "paused";

  const runSimulation = async (fromYear: number) => {
    setError(null);
    try {
      const payload = buildPayload(events, results, fromYear);
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const snapshots: YearSnapshot[] = await res.json();
      setResults((prev) => [...prev.filter((r) => r.year < fromYear), ...snapshots]);
      setRerunFromYear(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const play = async () => {
    if (rerunFromYear !== null) await runSimulation(rerunFromYear);
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const reset = () => {
    pause();
    setCurrentYear(1);
    setEvents([]);
    setResults([]);
    setRerunFromYear(1);
    setError(null);
  };

  const seekTo = (year: number) => {
    pause();
    setCurrentYear(Math.max(1, Math.min(SIM_MAX, year)));
  };

  const updateEvent = (event: SimEvent) => {
    setEvents((prev) =>
      [...prev.filter((e) => e.year !== event.year), event].sort((a, b) => a.year - b.year)
    );
    setRerunFromYear((prev) => (prev === null ? event.year : Math.min(prev, event.year)));
    setResults((prev) => prev.filter((r) => r.year < event.year));
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (currentYear >= SIM_MAX) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentYear((y) => y + 1), 600);
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