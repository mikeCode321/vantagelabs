"use client";
import "./CashOnHandCalc.css";
import { useState } from "react";

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

const DEFAULT: FormData = {
  years: 10,
  cash_on_hand: 100000,
  net_income: { net_income: 80000, interest_rate: 0.03 },
  expenses: { expenses: 50000, interest_rate: 0.02 },
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function CashOnHandCalc() {
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

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/finance/calc_cash_on_hand/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setResult(typeof data === "number" ? data : data.result ?? null);
      setSaved(draft);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
            <span className="coh-stat-value">{saved.years} yrs</span>
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
            <span className="coh-projection-label">{saved.years}yr Projection</span>
            <span className="coh-projection-value">${fmt(result)}</span>
          </div>
        ) : (
          <div className="coh-projection-empty">
            Edit values and save to calculate projection
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
                    <label>Years</label>
                    <input type="number" value={draft.years}
                      onChange={e => setDraft({ ...draft, years: Number(e.target.value) || 0 })} />
                  </div>
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