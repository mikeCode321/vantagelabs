"use client";
import "./CashFlowPanel.css";
import { useState } from "react";
import type { YearInputs, YearData, SimYearResult, Tier } from "@/app/dashboard/useSimulation";

interface Props {
  currentYear: number;
  inputs: YearInputs;
  yearData: YearData;
  displayResult: {
    year: number;
    total_cash: number;
    net_worth: number;
    total_income: number;
    total_expenses: number;
    sources: SimYearResult["sources"];
  } | null;
  onUpdate: (year: number, inputs: YearInputs) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function CashFlowPanel({ currentYear, inputs, yearData, displayResult, onUpdate }: Props) {
  const [draft, setDraft] = useState<YearInputs | null>(null);
  const [open, setOpen] = useState(false);

  const openModal = () => { setDraft(structuredClone(inputs)); setOpen(true); };
  const closeModal = () => { setDraft(null); setOpen(false); };

  const updateTier = (i: number, field: keyof Tier, value: number) => {
    if (!draft) return;
    const tiers = [...draft.interest_tiers];
    tiers[i] = { ...tiers[i], [field]: value };
    setDraft({ ...draft, interest_tiers: tiers });
  };

  const handleSave = () => {
    if (!draft) return;
    onUpdate(currentYear, draft);
    closeModal();
  };

  const hasResult = yearData.result !== undefined;

  // Pull per-source display values from result
  const jobSnap = yearData.result?.sources.find((s) => s.source_type === "job");
  const expSnap = yearData.result?.sources.find((s) => s.source_type === "expense");
  const liquidSnap = yearData.result?.sources.find(
    (s) => s.source_type === "liquid" || s.source_type === "cash"
  );

  return (
    <>
      <div className="coh-card">
        <div className="coh-card-header">
          <span className="coh-card-title">Cash Flow</span>
          <button className="coh-edit-btn" onClick={openModal}>Edit</button>
        </div>

        <div className="coh-stat-grid">
          <div className="coh-stat">
            <span className="coh-stat-label">Year</span>
            <span className="coh-stat-value">{currentYear}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Income Growth</span>
            <span className="coh-stat-value">{pct(inputs.income_growth)}</span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">Expense Growth</span>
            <span className="coh-stat-value">{pct(inputs.expense_growth)}</span>
          </div>

          {/* Income row */}
          <div className="coh-stat">
            <span className="coh-stat-label">Start Income</span>
            <span className="coh-stat-value">
              {hasResult && jobSnap?.start_value != null
                ? `$${fmt(jobSnap.start_value)}`
                : `$${fmt(inputs.net_income)}`}
            </span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">End Income</span>
            <span className="coh-stat-value">
              {hasResult && jobSnap?.end_value != null ? `$${fmt(jobSnap.end_value)}` : "—"}
            </span>
          </div>
          <div className="coh-stat" />

          {/* Expense row */}
          <div className="coh-stat">
            <span className="coh-stat-label">Start Expenses</span>
            <span className="coh-stat-value">
              {hasResult && expSnap?.start_value != null
                ? `$${fmt(expSnap.start_value)}`
                : `$${fmt(inputs.annual_expense)}`}
            </span>
          </div>
          <div className="coh-stat">
            <span className="coh-stat-label">End Expenses</span>
            <span className="coh-stat-value">
              {hasResult && expSnap?.end_value != null ? `$${fmt(expSnap.end_value)}` : "—"}
            </span>
          </div>
          <div className="coh-stat" />

          {/* Interest earned */}
          {hasResult && liquidSnap && (
            <>
              <div className="coh-stat">
                <span className="coh-stat-label">Interest Earned</span>
                <span className="coh-stat-value">${fmt(liquidSnap.annual_cashflow)}</span>
              </div>
              <div className="coh-stat" />
              <div className="coh-stat" />
            </>
          )}
        </div>

        <div className="coh-projection">
          <span className="coh-projection-label">
            {hasResult ? `End of Year ${currentYear}` : "\u00A0"}
          </span>
          <span className="coh-projection-value">
            {displayResult
              ? `$${fmt(displayResult.total_cash)}`
              : "Press play to calculate"}
          </span>
        </div>

        {/* Net worth row — only shown once results exist */}
        {displayResult && (
          <div className="coh-networth">
            <span className="coh-networth-label">Net Worth </span>
            <span className="coh-networth-value">${fmt(displayResult.net_worth)}</span>
          </div>
        )}
      </div>

      {open && draft && (
        <div className="coh-overlay" onClick={closeModal}>
          <div className="coh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coh-modal-header">
              <span className="coh-modal-title">Edit — Year {currentYear}</span>
              <button className="coh-close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="coh-modal-body">
              <div className="coh-group">
                <span className="coh-group-label">Net Income</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      value={draft.net_income}
                      onChange={(e) =>
                        setDraft({ ...draft, net_income: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="coh-field">
                    <label>Annual Growth</label>
                    <input
                      type="number"
                      step="0.01"
                      value={draft.income_growth}
                      onChange={(e) =>
                        setDraft({ ...draft, income_growth: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="coh-group">
                <span className="coh-group-label">Expenses</span>
                <div className="coh-row">
                  <div className="coh-field">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      value={draft.annual_expense}
                      onChange={(e) =>
                        setDraft({ ...draft, annual_expense: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="coh-field">
                    <label>Annual Growth</label>
                    <input
                      type="number"
                      step="0.01"
                      value={draft.expense_growth}
                      onChange={(e) =>
                        setDraft({ ...draft, expense_growth: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="coh-group">
                <div className="coh-tier-header">
                  <span className="coh-group-label">Interest Tiers</span>
                  <button
                    className="coh-add-btn"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        interest_tiers: [
                          ...draft.interest_tiers,
                          { threshold: 0, annual_rate: 0 },
                        ],
                      })
                    }
                  >
                    + Add
                  </button>
                </div>
                {draft.interest_tiers.map((tier, i) => (
                  <div key={i} className="coh-tier-row">
                    <div className="coh-field">
                      <label>Threshold ($)</label>
                      <input
                        type="number"
                        value={tier.threshold}
                        onChange={(e) =>
                          updateTier(i, "threshold", Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="coh-field">
                      <label>Annual Rate</label>
                      <input
                        type="number"
                        step="0.001"
                        value={tier.annual_rate}
                        onChange={(e) =>
                          updateTier(i, "annual_rate", Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <button
                      className="coh-remove-btn"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          interest_tiers: draft.interest_tiers.filter((_, j) => j !== i),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="coh-modal-footer">
              <button className="coh-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="coh-save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}