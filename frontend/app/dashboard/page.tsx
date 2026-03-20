"use client";
import "./dashboard.css";
import { useState, useEffect, useRef } from "react";
import CashOnHandCalc from "@/components/Dashboard/CashOnHandCalc/CashOnHandCalc";
import SimControls from "@/components/Dashboard/SimControls/SimControls";
import AssetPortfolio from "@/components/Dashboard/Assets/AssetPortfolio";
import { Asset, NewAsset, DEFAULT_GROWTH_RATES } from "@/components/Dashboard/Assets/types";

export const SIM_MAX = 30;
const API = "http://localhost:8000/api/finance/simulate/";

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

const DEFAULTS = {
  start_cash: 0,
  base_net_income: 80000,
  base_income_growth: 0.03,
  base_expenses: 50000,
  base_expense_growth: 0.02,
  base_tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

// Derive the effective base values by replaying all events before a given year.
// This ensures growth rates and other settings carry forward correctly
// when restarting the simulation from mid-timeline.
function getBaseAtYear(events: SimEvent[], beforeYear: number) {
  const priorEvents = events.filter((e) => e.year < beforeYear);
  return priorEvents.reduce(
    (base, ev) => ({
      base_net_income: ev.net_income ?? base.base_net_income,
      base_income_growth: ev.income_growth ?? base.base_income_growth,
      base_expenses: ev.expenses ?? base.base_expenses,
      base_expense_growth: ev.expense_growth ?? base.base_expense_growth,
      base_tiers: ev.tiers ?? base.base_tiers,
    }),
    {
      base_net_income: DEFAULTS.base_net_income,
      base_income_growth: DEFAULTS.base_income_growth,
      base_expenses: DEFAULTS.base_expenses,
      base_expense_growth: DEFAULTS.base_expense_growth,
      base_tiers: DEFAULTS.base_tiers,
    }
  );
}

const INITIAL_ASSETS: Asset[] = [
  {
    id: 1,
    name: "Rental House",
    type: "house",
    value: 250000,
    downPayment: 50000,
    monthlyExpense: 1800,
    sold: false,
    compound: DEFAULT_GROWTH_RATES.house,
    year: 0,
  },
  {
    id: 2,
    name: "Gold Bar",
    type: "gold",
    value: 3000,
    downPayment: 0,
    monthlyExpense: 0,
    sold: false,
    compound: DEFAULT_GROWTH_RATES.gold,
    year: 0,
  },
];

export default function Dashboard() {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [results, setResults] = useState<YearSnapshot[]>([]);
  const [currentYear, setCurrentYear] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyFromYear, setDirtyFromYear] = useState<number | null>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentResult = results.find((r) => r.year === currentYear) ?? null;
  const lastResult = [...results].reverse().find((r) => r.year <= currentYear) ?? null;
  const displayResult = currentResult ?? (isPlaying ? lastResult : null);

  const currentEvent = events.find((e) => e.year === currentYear);
  const currentInputs = {
    net_income: currentResult?.net_income ?? currentEvent?.net_income ?? DEFAULTS.base_net_income,
    income_growth: currentEvent?.income_growth ?? DEFAULTS.base_income_growth,
    expenses: currentResult?.expenses ?? currentEvent?.expenses ?? DEFAULTS.base_expenses,
    expense_growth: currentEvent?.expense_growth ?? DEFAULTS.base_expense_growth,
    tiers: currentEvent?.tiers ?? DEFAULTS.base_tiers,
  };

  // completely separate from cash simulation
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentYear >= SIM_MAX) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => setCurrentYear((y) => y + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentYear]);

  const runSimulation = async (fromYear: number) => {
    setError(null);
    try {
      const prevResult = [...results].reverse().find((r) => r.year === fromYear - 1);

      // Get the effective base by replaying all events before fromYear
      // so growth rates and settings from past edits carry forward correctly
      const base = getBaseAtYear(events, fromYear);

      const payload = {
        ...base,
        start_cash: prevResult?.cash_on_hand ?? DEFAULTS.start_cash,
        start_year: fromYear,
        end_year: SIM_MAX,
        events: events.filter((e) => e.year >= fromYear),
      };

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const snapshots: YearSnapshot[] = await res.json();

      console.log(`payload: ${JSON.stringify(payload, null, 2)}`);
      console.log(`snapshots: ${JSON.stringify(snapshots, null, 2)}`);
      setResults((prev) => [...prev.filter((r) => r.year < fromYear), ...snapshots]);
      setDirtyFromYear(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const play = async () => {
    if (dirtyFromYear !== null) await runSimulation(dirtyFromYear);
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
    setDirtyFromYear(1);
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
    setDirtyFromYear((prev) => (prev === null ? event.year : Math.min(prev, event.year)));
    setResults((prev) => prev.filter((r) => r.year < event.year));
  };

  const addAsset = (asset: NewAsset) => {
    setAssets((prev) => {
      const nextId =
        prev.length > 0 ? Math.max(...prev.map((a) => a.id)) + 1 : 1;

      return [
        ...prev,
        {
          id: nextId,
          sold: false,
          ...asset,
        },
      ];
    });
  };

  const sellAsset = (id: number) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === id ? { ...asset, sold: true } : asset
      )
    );
  };

  const status =
    isPlaying ? "playing" : dirtyFromYear !== null ? "edited" : currentYear >= SIM_MAX ? "done" : "paused";

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-mark">VL</span>
          <span className="dash-logo-text">VantageLabs</span>
        </div>
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item dash-nav-active">Overview</a>
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

        <div className="dash-grid">
          <div className="dash-cell dash-cell-md">
            <CashOnHandCalc
              currentYear={currentYear}
              inputs={currentInputs}
              result={currentResult}
              displayResult={displayResult}
              onUpdate={(changes) => updateEvent({ year: currentYear, ...changes })}
            />
          </div>

          <div className="dash-cell dash-cell-md">
            <AssetPortfolio
              assets={assets}
              onAddAsset={addAsset}
              onSell={sellAsset}
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
              currentYear={currentYear}
              isPlaying={isPlaying}
              status={status}
              simMax={SIM_MAX}
              onPlay={play}
              onPause={pause}
              onReset={reset}
              onSeek={seekTo}
            />
          </div>
        </div>

        {error && <div className="dash-error">{error}</div>}
      </main>
    </div>
  );
}