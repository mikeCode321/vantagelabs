"use client";
import "./dashboard.css";
import { useState, useEffect, useRef } from "react";
import CashOnHandCalc from "@/components/Dashboard/CashOnHandCalc/CashOnHandCalc";
import SimControls from "@/components/Dashboard/SimControls/SimControls";

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
  dirty: boolean; // true = inputs were edited, don't auto-fetch until play/seek
}

const DEFAULT_INPUTS: YearInputs = {
  cash_on_hand: 100000,
  net_income: { net_income: 80000, interest_rate: 0.03 },
  expenses: { expenses: 50000, interest_rate: 0.02 },
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

const API = "http://localhost:8000/api/finance/calc_cash_on_hand/";

function nextInputs(entry: LedgerEntry): YearInputs {
  const { inputs, result } = entry;
  if (!result) return structuredClone(inputs);
  return {
    ...structuredClone(inputs),
    cash_on_hand: result.cash_on_hand,
    net_income: { ...inputs.net_income, net_income: result.net_income },
    expenses: { ...inputs.expenses, expenses: result.expenses },
  };
}

export default function Dashboard() {
  const [currentYear, setCurrentYear] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([{ year: 1, inputs: structuredClone(DEFAULT_INPUTS), result: null, dirty: false },]);
  const [error, setError] = useState<string | null>(null);
  const fetchingYear = useRef<number | null>(null);

  const currentEntry = ledger.find((e) => e.year === currentYear) ?? ledger[0];
  const lastCachedResult = [...ledger].reverse().find((e) => e.result !== null)?.result ?? null;
  const displayResult = currentEntry.result ?? lastCachedResult;

  async function fetchSnapshots(fromInputs: YearInputs, fromYear: number, years: number) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fromInputs, years }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    const snapshots: YearResult[] = await res.json();

    setLedger((prev) => {
      let updated = [...prev];
      snapshots.forEach((snapshot, i) => {
        const year = fromYear + i;
        if (updated.some((e) => e.year === year)) {
          updated = updated.map((e) =>
            e.year === year ? { ...e, result: snapshot, dirty: false } : e
          );
        } else {
          const prevEntry = updated.find((e) => e.year === year - 1);
          updated.push({
            year,
            inputs: prevEntry ? nextInputs(prevEntry) : structuredClone(fromInputs),
            result: snapshot,
            dirty: false,
          });
        }
      });
      return updated.sort((a, b) => a.year - b.year);
    });
  }

  useEffect(() => {
    console.log('ledger', ledger);
  }, [ledger]);

  useEffect(() => {
    const entry = ledger.find((e) => e.year === currentYear);
    if (!entry) return;

    if (entry.dirty) return;

    if (entry.result === null && fetchingYear.current !== currentYear) {
      fetchingYear.current = currentYear;
      Promise.resolve().then(() =>
        fetchSnapshots(entry.inputs, currentYear, 1)
          .catch((err) => { setError(err.message); setIsPlaying(false); })
          .finally(() => { fetchingYear.current = null; })
      );
      return;
    }

    if (entry.result !== null && isPlaying) {
      if (currentYear >= SIM_MAX) {
        setTimeout(() => setIsPlaying(false), 0);
        return;
      }
      const t = setTimeout(() => {
        setLedger((prev) => {
          const nextYear = currentYear + 1;
          if (prev.some((e) => e.year === nextYear)) return prev;
          const cur = prev.find((e) => e.year === currentYear)!;
          return [...prev, { year: nextYear, inputs: nextInputs(cur), result: null, dirty: false }]
            .sort((a, b) => a.year - b.year);
        });
        setCurrentYear((y) => y + 1);
      }, 300);
      return () => clearTimeout(t);
    }

  }, [currentYear, isPlaying, ledger]);

  const seekTo = (year: number) => {
    const clamped = Math.max(1, Math.min(SIM_MAX, year));
    setIsPlaying(false);
    setError(null);
    setCurrentYear(clamped);

    if (ledger.find((e) => e.year === clamped && e.result !== null)) return;

    const maxCached = Math.max(0, ...ledger.filter((e) => e.result !== null).map((e) => e.year));
    const yearsNeeded = clamped - maxCached;
    if (yearsNeeded <= 0) return;

    const fromEntry = ledger.find((e) => e.year === maxCached) ?? ledger[0];
    fetchingYear.current = clamped;

    setLedger((prev) =>
      prev.map((e) => e.year >= maxCached + 1 && e.year <= clamped ? { ...e, dirty: false } : e)
    );

    fetchSnapshots(nextInputs(fromEntry), maxCached + 1, yearsNeeded)
      .catch((err) => setError(err.message))
      .finally(() => { fetchingYear.current = null; });
  };

  const updateYear = (year: number, inputs: YearInputs) => {
    setLedger((prev) =>
      prev
        .filter((e) => e.year <= year)
        .map((e) => e.year === year ? { ...e, inputs, result: null, dirty: true } : e)
    );
    fetchingYear.current = null;
  };

  const play = () => {
    setLedger((prev) => prev.map((e) => ({ ...e, dirty: false })));
    setIsPlaying(true);
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentYear(1);
    setError(null);
    fetchingYear.current = null;
    setLedger([{ year: 1, inputs: structuredClone(DEFAULT_INPUTS), result: null, dirty: false }]);
  };

  const status = isPlaying ? "playing" : currentYear >= SIM_MAX ? "done" : "paused";

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
              entry={currentEntry}
              displayResult={displayResult}
              onUpdateYear={updateYear}
            />
          </div>
          <div className="dash-cell dash-cell-md">
            <div className="dash-placeholder">Net Worth Tracker</div>
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
              onPause={() => setIsPlaying(false)}
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