"use client";
import "./CashOnHandCalc.css";
import { useState, useEffect, useRef } from "react";
import { LedgerEntry, YearInputs, YearResult } from "@/app/dashboard/page";

interface Props {
  currentYear: number;
  ledger: LedgerEntry[];
  commitResult: (year: number, result: YearResult) => void;
  updateYear: (year: number, inputs: YearInputs) => void;
  pause: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function CashOnHandCalc({ currentYear, ledger, commitResult, updateYear, pause }: Props) {
  const entry = ledger.find((e) => e.year === currentYear) ?? ledger[0];
  const inputs = entry.inputs;
  const result = entry.result;

  const [draft, setDraft] = useState<YearInputs | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingYear = useRef<number | null>(null);
  // Keep the last known result so we can show it while the next year is loading
  const lastResult = useRef<YearResult | null>(null);
  if (result !== null) lastResult.current = result;

  useEffect(() => {
    if (currentYear === 0) return;
    if (result !== null) return;
    if (fetchingYear.current === currentYear) return;

    fetchingYear.current = currentYear;

    Promise.resolve().then(async () => {
      setError(null);
      try {
        const target = ledger.find((e) => e.year === currentYear);
        if (!target) return;
        const res = await fetch("http://localhost:8000/api/finance/calc_cash_on_hand/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...target.inputs, years: 1 }),
        });
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        const json: YearResult = await res.json();
        commitResult(currentYear, json);
      } catch (err) {
        setError((err as Error).message);
        pause();
      } finally {
        fetchingYear.current = null;
      }
    });
  }, [currentYear, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // What to display in the projection area:
  // - year 0: always show starting cash
  // - year N with result: show result
  // - year N loading: show last known result (no flash) with a subtle label update
  const displayResult = result ?? lastResult.current;
  const isLoading = currentYear > 0 && result === null;

  const handleSave = () => {
    if (!draft) return;
    updateYear(currentYear, draft);
    lastResult.current = null; // clear so we don't show stale data after an edit
    setOpen(false);
  };

  const updateTier = (i: number, field: "threshold" | "annual_rate", value: number) => {
    if (!draft) return;
    const tiers = [...draft.tiers];
    tiers[i] = { ...tiers[i], [field]: value };
    setDraft({ ...draft, tiers });
  };

  return (
    <>
      <div className="coh-card">
        <div className="coh-card-header">
          <span className="coh-card-title">Cash on Hand</span>
          <button className="coh-edit-btn" onClick={() => { setDraft(structuredClone(inputs)); setOpen(true); }}>Edit</button>
        </div>

        <div className="coh-stat-grid">
          {/* <div className="coh-stat">
            <span className="coh-stat-label">Starting Cash</span>
            <span className="coh-stat-value">${fmt(inputs.cash_on_hand)}</span>
          </div> */}
          <div className="coh-stat">
            <span className="coh-stat-label">Year</span>
            <span className="coh-stat-value">{currentYear}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Net Income</span>
            <span className="coh-stat-value">${fmt(inputs.net_income.net_income)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Income Growth</span>
            <span className="coh-stat-value">{pct(inputs.net_income.interest_rate)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Expenses</span>
            <span className="coh-stat-value">${fmt(inputs.expenses.expenses)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Expense Growth</span>
            <span className="coh-stat-value">{pct(inputs.expenses.interest_rate)}</span>
          </div>
        </div>

        <div className="coh-projection">
          {currentYear === 0 ? (
            <>
              <span className="coh-projection-label">Starting Cash</span>
              <span className="coh-projection-value">${fmt(inputs.cash_on_hand)}</span>
            </>
          ) : displayResult ? (
            <>
              <span className="coh-projection-label">
                {isLoading ? "Calculating…" : `End of Year ${currentYear}`}
              </span>
              <span className="coh-projection-value">${fmt(displayResult.cash_on_hand)}</span>
            </>
          ) : (
            <>
              <span className="coh-projection-label">&nbsp;</span>
              <span className="coh-projection-value coh-projection-empty">
                {isLoading ? "Calculating…" : "Press play to run the simulation"}
              </span>
            </>
          )}
        </div>

        {error && <div className="coh-error">{error}</div>}
      </div>

      {open && draft && (
        <div className="coh-overlay" onClick={() => setOpen(false)}>
          <div className="coh-modal" onClick={e => e.stopPropagation()}>
            <div className="coh-modal-header">
              <span className="coh-modal-title">Edit — Year {currentYear}</span>
              <button className="coh-close-btn" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="coh-modal-body">
              <div className="coh-group">
                <span className="coh-group-label">Starting Cash</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Amount ($)</label>
                    <input type="number" value={draft.cash_on_hand}
                      onChange={e => setDraft({ ...draft, cash_on_hand: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <div className="coh-group">
                <span className="coh-group-label">Net Income</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Amount ($)</label>
                    <input type="number" value={draft.net_income.net_income}
                      onChange={e => setDraft({ ...draft, net_income: { ...draft.net_income, net_income: Number(e.target.value) || 0 } })} />
                  </div>
                  <div className="coh-field">
                    <label>Annual Growth</label>
                    <input type="number" step="0.001" value={draft.net_income.interest_rate}
                      onChange={e => setDraft({ ...draft, net_income: { ...draft.net_income, interest_rate: Number(e.target.value) || 0 } })} />
                  </div>
                </div>
              </div>

              <div className="coh-group">
                <span className="coh-group-label">Expenses</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Amount ($)</label>
                    <input type="number" value={draft.expenses.expenses}
                      onChange={e => setDraft({ ...draft, expenses: { ...draft.expenses, expenses: Number(e.target.value) || 0 } })} />
                  </div>
                  <div className="coh-field">
                    <label>Annual Growth</label>
                    <input type="number" step="0.001" value={draft.expenses.interest_rate}
                      onChange={e => setDraft({ ...draft, expenses: { ...draft.expenses, interest_rate: Number(e.target.value) || 0 } })} />
                  </div>
                </div>
              </div>

              <div className="coh-group">
                <div className="coh-tier-header">
                  <span className="coh-group-label">Interest Tiers</span>
                  <button className="coh-add-btn"
                    onClick={() => setDraft({ ...draft, tiers: [...draft.tiers, { threshold: 0, annual_rate: 0 }] })}>
                    + Add
                  </button>
                </div>
                {draft.tiers.map((tier, i) => (
                  <div key={i} className="coh-tier-row">
                    <div className="coh-field">
                      <label>Threshold ($)</label>
                      <input type="number" value={tier.threshold}
                        onChange={e => updateTier(i, "threshold", Number(e.target.value) || 0)} />
                    </div>
                    <div className="coh-field">
                      <label>Annual Rate</label>
                      <input type="number" step="0.001" value={tier.annual_rate}
                        onChange={e => updateTier(i, "annual_rate", Number(e.target.value) || 0)} />
                    </div>
                    <button className="coh-remove-btn"
                      onClick={() => setDraft({ ...draft, tiers: draft.tiers.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="coh-modal-footer">
              <button className="coh-cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="coh-save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}