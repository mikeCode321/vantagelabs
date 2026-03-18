"use client";
import "./dashboard.css";
import { useState, useEffect } from "react";
import CashOnHandCalc from "@/components/Dashboard/CashOnHandCalc/CashOnHandCalc";
import SimControls from "@/components/Dashboard/SimControls/SimControls";
import AssetPortfolio from "@/components/Dashboard/Assets/AssetPortfolio";
import { Asset, NewAsset, DEFAULT_GROWTH_RATES } from "@/components/Dashboard/Assets/types";

export const SIM_MAX = 40;

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

const DEFAULT_INPUTS: YearInputs = {
  cash_on_hand: 100000,
  net_income: { net_income: 80000, interest_rate: 0.03 },
  expenses: { expenses: 50000, interest_rate: 0.02 },
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

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
  const [currentYear, setCurrentYear] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { year: 0, inputs: structuredClone(DEFAULT_INPUTS), result: null },
  ]);

  // completely separate from cash simulation
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentYear >= SIM_MAX) {
      const t = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(t);
    }

    const entry = ledger.find((e) => e.year === currentYear);
    const ready = currentYear === 0 || entry?.result != null;
    if (!ready) return;

    const t = setTimeout(() => {
      const nextYear = currentYear + 1;
      setLedger((prev) => {
        if (prev.some((e) => e.year === nextYear)) return prev;
        const current = prev.find((e) => e.year === currentYear)!;
        return [...prev, { year: nextYear, inputs: structuredClone(current.inputs), result: null }]
          .sort((a, b) => a.year - b.year);
      });
      setCurrentYear(nextYear);
    }, 600);

    return () => clearTimeout(t);
  }, [isPlaying, currentYear, ledger]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  const reset = () => {
    setIsPlaying(false);
    setCurrentYear(0);
    setLedger([{ year: 0, inputs: structuredClone(DEFAULT_INPUTS), result: null }]);
  };

  const seekTo = (year: number) => {
    setIsPlaying(false);
    const simulatedYears = ledger
      .filter((e) => e.year === 0 || e.result !== null)
      .map((e) => e.year);
    const maxReachable = Math.max(...simulatedYears);
    const clamped = Math.max(0, Math.min(maxReachable, year));
    setCurrentYear(clamped);
  };

  const commitResult = (year: number, result: YearResult) => {
    setLedger((prev) => {
      const thisEntry = prev.find((e) => e.year === year);
      if (!thisEntry) return prev;

      const updated = prev.map((e) => e.year === year ? { ...e, result } : e);
      const nextYear = year + 1;
      const nextInputs: YearInputs = {
        ...structuredClone(thisEntry.inputs),
        cash_on_hand: result.cash_on_hand,
        net_income: { ...thisEntry.inputs.net_income, net_income: result.net_income },
        expenses: { ...thisEntry.inputs.expenses, expenses: result.expenses },
      };

      if (nextYear <= SIM_MAX) {
        const nextExists = updated.some((e) => e.year === nextYear);
        if (nextExists) {
          return updated
            .map((e) => e.year === nextYear ? { ...e, inputs: nextInputs } : e)
            .sort((a, b) => a.year - b.year);
        } else {
          updated.push({ year: nextYear, inputs: nextInputs, result: null });
        }
      }
      return updated.sort((a, b) => a.year - b.year);
    });
  };

  const updateYear = (year: number, inputs: YearInputs) => {
    setLedger((prev) =>
      prev
        .filter((e) => e.year <= year)
        .map((e) => e.year === year ? { ...e, inputs, result: null } : e)
    );
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
    isPlaying
      ? "playing"
      : currentYear >= SIM_MAX
      ? "done"
      : currentYear === 0
      ? "ready"
      : "paused";

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
              ledger={ledger}
              commitResult={commitResult}
              updateYear={updateYear}
              pause={pause}
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
      </main>
    </div>
  );
}