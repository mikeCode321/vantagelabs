"use client";
import "./CashOnHandCalc.css";
import { useState, useEffect, useCallback } from "react";

interface InterestRateTier {
  threshold: number;
  annual_rate: number;
}

interface FormData {
  years: number;
  cash_on_hand: number;
  net_income: { net_income: number; interest_rate: number };
  expenses: { expenses: number; interest_rate: number };
  tiers: InterestRateTier[];
}

interface CashOnHandCalcProps {
  currentYear: number;
}

const DEFAULT: FormData = {
  years: 0,
  cash_on_hand: 100000,
  net_income: { net_income: 80000, interest_rate: 0.03 },
  expenses: { expenses: 50000, interest_rate: 0.02 },
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function CashOnHandCalc({ currentYear }: CashOnHandCalcProps) {
  const [saved, setSaved] = useState<FormData>(DEFAULT);
  const [draft, setDraft] = useState<FormData>(DEFAULT);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTier = (i: number, field: keyof InterestRateTier, value: number) => {
    const tiers = [...draft.tiers];
    tiers[i] = { ...tiers[i], [field]: value };
    setDraft({ ...draft, tiers });
  };

  const openModal = () => {
    setDraft(saved);
    setError(null);
    setOpen(true);
  };

  // Core fetch — accepts the form data and year explicitly so it can be called
  // both from handleSave (with draft) and the year-change effect (with saved).
  const fetchResult = useCallback(async (data: FormData, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data, years: year };

      const res = await fetch("http://localhost:8000/api/finance/calc_cash_on_hand/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setResult(typeof json === "number" ? json : json.result ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever currentYear changes, but only after the user has saved once.
  useEffect(() => {
    if (!currentYear) return;
    fetchResult(saved, currentYear);
  }, [currentYear]);

  const handleSave = async () => {
    await fetchResult(draft, currentYear);
    setSaved(draft);
    setOpen(false);
  };

  return (
    <>
      {/* ── Static Card ── */}
      <div className="coh-card">
        <div className="coh-card-header">
          <span className="coh-card-title">Cash on Hand</span>
          <button className="coh-edit-btn" onClick={openModal}>Edit</button>
        </div>

        <div className="coh-stat-grid">
          <div className="coh-stat">
            <span className="coh-stat-label">Starting Cash</span>
            <span className="coh-stat-value">${fmt(saved.cash_on_hand)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Horizon</span>
            <span className="coh-stat-value">{currentYear} yrs</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Net Income</span>
            <span className="coh-stat-value">${fmt(saved.net_income.net_income)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Income Growth</span>
            <span className="coh-stat-value">{pct(saved.net_income.interest_rate)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Expenses</span>
            <span className="coh-stat-value">${fmt(saved.expenses.expenses)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Expense Growth</span>
            <span className="coh-stat-value">{pct(saved.expenses.interest_rate)}</span>
          </div>
        </div>

        {result !== null ? (
          <div className="coh-projection">
            <span className="coh-projection-label">
              Year {currentYear} Projection{loading ? " …" : ""}
            </span>
            <span className="coh-projection-value">${fmt(result)}</span>
          </div>
        ) : (
          <div className="coh-projection-empty">
            {loading ? "Calculating…" : "Edit values and save to calculate projection"}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {open && (
        <div className="coh-overlay" onClick={() => setOpen(false)}>
          <div className="coh-modal" onClick={e => e.stopPropagation()}>
            <div className="coh-modal-header">
              <span className="coh-modal-title">Edit Projection</span>
              <button className="coh-close-btn" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="coh-modal-body">
              <div className="coh-group">
                <span className="coh-group-label">Horizon</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Starting Cash ($)</label>
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

              {error && <div className="coh-error">{error}</div>}
            </div>

            <div className="coh-modal-footer">
              <button className="coh-cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="coh-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save & Calculate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}