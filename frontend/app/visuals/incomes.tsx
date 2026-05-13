import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput, handleTierThresholdInput } from "@/app/visuals/utils";
import { ID } from "@/app/visuals/accounts";

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────
export type SalaryIncome = {
  source_type: "income";
  variant: "salary";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;

  linked_401k_id?: string;
};

export type HourlyWageIncome = {
  source_type: "income";
  variant: "hourly";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  income_growth: number;

  linked_401k_id?: string;
};

export type SideHustleIncome = {
  source_type: "income";
  variant: "side";

  id: ID;
  name: string;

  start_year: number;
  end_year: number;

  net_income: number;
  variability: number;
  frequency: string;
  average_income_per_period: number;
};

export type IncomeSource = SalaryIncome | HourlyWageIncome | SideHustleIncome;

// INCOME FORMS
export function SalaryForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [growth, setGrowth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [linked401kId, setLinked401kId] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newIncomeId = crypto.randomUUID();

    // ----------------------------
    // 1. BREAK EXISTING PAIRING on 401k (if it's already linked to another income)
    // ----------------------------
    if (linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (selectedAccount && selectedAccount.linked_income_id) {
        // This 401k is linked to another income - clear that income's link
        const allIncomes = [
          ...(state?.incomes?.salary || []),
          ...(state?.incomes?.hourly || []),
        ];
        
        const otherIncome = allIncomes.find((inc) => inc.id === selectedAccount.linked_income_id);

        if (otherIncome) {
          dispatch({
            type: "UPDATE_INCOME",
            payload: {
              ...otherIncome,
              linked_401k_id: undefined,
            },
          });
        }
      }

      // ----------------------------
      // 2. UPDATE the 401k account with new link
      // ----------------------------
      if (selectedAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...selectedAccount,
            linked_income_id: newIncomeId,
          },
        });
      }
    }

    // ----------------------------
    // 3. ADD the new income
    // ----------------------------
    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "salary",
        id: newIncomeId,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: Number(netIncome),
        income_growth: Number(growth),
        linked_401k_id: linked401kId || undefined,
      },
    });

    setName("");
    setNetIncome("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
    setLinked401kId("");
  };


  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💼</div>
        <div>
          <h3 className="form-header-title">Add Salary Income</h3>
          <p className="form-header-desc">Track your employment income and annual growth rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Software Engineer" required />
            </div>

            {/* Annual Income */}
            <div className="form-field">
              <label className="form-label">Annual Net Income</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(netIncome)} onChange={(e) => handleNumberInput(e, setNetIncome)} className="form-input form-input--prefix-dollar" placeholder="120,000" type="text" required />
              </div>
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input--suffix" placeholder="3" type="number" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" required />
              </div>
            </div>

            {/* Link to 401k card */}
            <div className="link-card">
              <label className="link-card__option" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--teal)" }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                    <option value="">Select an account</option>

                    {available401ks.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      className="link-card__synced"
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="preview-card__sub"
                  style={{
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}
                >
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Salary
          </button>
        </div>
      </form>
    </div>
  );
}

export function HourlyWageForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState("");
  const [linked401kId, setLinked401kId] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;

   const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newIncomeId = crypto.randomUUID();

    // ----------------------------
    // 1. BREAK EXISTING PAIRING on 401k (if it's already linked to another income)
    // ----------------------------
    if (linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (selectedAccount && selectedAccount.linked_income_id) {
        // This 401k is linked to another income - clear that income's link
        const allIncomes = [
          ...(state?.incomes?.salary || []),
          ...(state?.incomes?.hourly || []),
        ];
        
        const otherIncome = allIncomes.find((inc) => inc.id === selectedAccount.linked_income_id);

        if (otherIncome) {
          dispatch({
            type: "UPDATE_INCOME",
            payload: {
              ...otherIncome,
              linked_401k_id: undefined,
            },
          });
        }
      }

      // ----------------------------
      // 2. UPDATE the 401k account with new link
      // ----------------------------
      if (selectedAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...selectedAccount,
            linked_income_id: newIncomeId,
          },
        });
      }
    }

    // ----------------------------
    // 3. ADD the new income
    // ----------------------------
    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "hourly",
        id: newIncomeId,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        income_growth: Number(growth),
        hourly_rate: Number(hourlyRate),
        hours_per_week: Number(hoursPerWeek),
        linked_401k_id: linked401kId || undefined,
      },
    });

    setName("");
    setStartYear("");
    setEndYear("");
    setHourlyRate("");
    setHoursPerWeek("");
    setGrowth("");
    setLinked401kId("");
  };


  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">⏱️</div>
        <div>
          <h3 className="form-header-title">Add Hourly Wage Income</h3>
          <p className="form-header-desc">Track hourly income, weekly hours, and projected growth.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/hr</span>
                <input value={formatNumberWithCommas(hourlyRate)} onChange={(e) => handleNumberInput(e, setHourlyRate)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="25" type="text" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(hoursPerWeek)} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="form-input form-input--suffix" placeholder="40" type="text" />
                <span className="form-input-suffix">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input--suffix" placeholder="3" type="text" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div className="link-card">
                <label className="form-label">Link 401(k) Account</label>
                <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                  <option value="">None - No linking</option>
                  {available401ks.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div className="link-card__synced">🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Hourly Income
          </button>
        </div>
      </form>
    </div>
  );
}

export function SideHustleForm({ dispatch }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [averageIncome, setAverageIncome] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [variability, setVariability] = useState("5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "side",
        id: crypto.randomUUID(),
        name: name || "Side Hustle",
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });

    setName("");
    setStartYear("");
    setEndYear("");
    setAverageIncome("");
    setFrequency("monthly");
    setVariability("5");
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚀</div>
        <div>
          <h3 className="form-header-title">Add Side Hustle Income</h3>
          <p className="form-header-desc">Track variable income with frequency and variability estimates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Side Hustle Name */}
            <div className="form-field">
              <label className="form-label">Side Hustle Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(averageIncome)} onChange={(e) => handleNumberInput(e, setAverageIncome)} className="form-input form-input--prefix-dollar" placeholder="500" type="text" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div className="form-field">
              <label className="form-label">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Income Variability</label>
                <span className="form-slider-value">±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={(e) => setVariability(e.target.value)} className="form-slider" />
              <p className="preview-card__sub">
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Side Hustle
          </button>
        </div>
      </form>
    </div>
  );
}


/* -------------------- EDIT INCOME FORMS -------------------- */

export function EditSalaryForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [netIncome, setNetIncome] = useState(item.net_income.toString());
  const [growth, setGrowth] = useState(item.income_growth.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const previousLinked401kId = item.linked_401k_id;
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");

  const available401ks = state?.accounts?.employer_retirement || [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ----------------------------
    // 1. REMOVE OLD LINK from previous 401k (if this income was previously linked)
    // ----------------------------
    if (previousLinked401kId && previousLinked401kId !== linked401kId) {
      const oldAccount = available401ks.find((acc) => acc.id === previousLinked401kId);

      if (oldAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...oldAccount,
            linked_income_id: undefined,
          },
        });
      }
    }

    // ----------------------------
    // 2. BREAK EXISTING PAIRING on new 401k (if it's already linked to another income)
    // ----------------------------
    if (linked401kId) {
      const newAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (newAccount && newAccount.linked_income_id && newAccount.linked_income_id !== item.id) {
        // This 401k is linked to a different income - find and clear that income's link
        const allIncomes = [
          ...(state?.incomes?.salary || []),
          ...(state?.incomes?.hourly || []),
        ];
        
        const otherIncome = allIncomes.find((inc) => inc.id === newAccount.linked_income_id);

        if (otherIncome) {
          dispatch({
            type: "UPDATE_INCOME",
            payload: {
              ...otherIncome,
              linked_401k_id: undefined,
            },
          });
        }
      }

      // ----------------------------
      // 3. UPDATE NEW 401k account
      // ----------------------------
      if (newAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...newAccount,
            linked_income_id: item.id,
          },
        });
      }
    }

    // ----------------------------
    // 4. UPDATE THIS INCOME
    // ----------------------------
    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        net_income: Number(netIncome),
        income_growth: Number(growth),
        start_year: Number(startYear),
        end_year: Number(endYear),
        linked_401k_id: linked401kId || undefined,
      },
    });

    onClose();
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💼</div>

        <div>
          <h3 className="form-header-title">Edit Salary Income</h3>

          <p className="form-header-desc">Update your employment income and growth details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>

              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Software Engineer" />
            </div>

            {/* Annual Income */}
            <div className="form-field">
              <label className="form-label">Annual Net Income</label>

              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>

                <input value={formatNumberWithCommas(netIncome)} onChange={(e) => handleNumberInput(e, setNetIncome)} className="form-input form-input--prefix-dollar" placeholder="120,000" type="text" />
              </div>
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>

              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input--suffix" placeholder="3" type="text" step="0.1" />

                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>

                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>

              <div className="form-field">
                <label className="form-label">End yr</label>

                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            <div className="link-card">
              <label className="link-card__option" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--teal)" }}>
                Link to a 401(k) Account
              </label>

              {available401ks.length > 0 ? (
                <>
                  <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                    <option value="">Select an account</option>

                    {available401ks.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  {linked401kId && (
                    <div
                      className="link-card__synced"
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="preview-card__sub"
                  style={{
                    padding: "10px 12px",
                    border: "1px dashed #5FA7AB44",
                    borderRadius: "6px",
                    background: "#fff",
                  }}
                >
                  No 401(k) accounts available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>

          <button type="submit" className="form-btn-submit">
            Update Salary
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditHourlyWageForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [hourlyRate, setHourlyRate] = useState(item.hourly_rate?.toString() || "");
  const [hoursPerWeek, setHoursPerWeek] = useState(item.hours_per_week?.toString() || "");
  const [growth, setGrowth] = useState(item.income_growth.toString());
  const previousLinked401kId = item.linked_401k_id;
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;

    const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ----------------------------
    // 1. REMOVE OLD LINK from previous 401k (if this income was previously linked)
    // ----------------------------
    if (previousLinked401kId && previousLinked401kId !== linked401kId) {
      const oldAccount = available401ks.find((acc) => acc.id === previousLinked401kId);

      if (oldAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...oldAccount,
            linked_income_id: undefined,
          },
        });
      }
    }

    // ----------------------------
    // 2. BREAK EXISTING PAIRING on new 401k (if it's already linked to another income)
    // ----------------------------
    if (linked401kId) {
      const newAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (newAccount && newAccount.linked_income_id && newAccount.linked_income_id !== item.id) {
        // This 401k is linked to a different income - find and clear that income's link
        const allIncomes = [
          ...(state?.incomes?.salary || []),
          ...(state?.incomes?.hourly || []),
        ];
        
        const otherIncome = allIncomes.find((inc) => inc.id === newAccount.linked_income_id);

        if (otherIncome) {
          dispatch({
            type: "UPDATE_INCOME",
            payload: {
              ...otherIncome,
              linked_401k_id: undefined,
            },
          });
        }
      }

      // ----------------------------
      // 3. UPDATE NEW 401k account
      // ----------------------------
      if (newAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...newAccount,
            linked_income_id: item.id,
          },
        });
      }
    }

    // ----------------------------
    // 4. UPDATE THIS INCOME
    // ----------------------------
    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        hourly_rate: Number(hourlyRate),
        hours_per_week: Number(hoursPerWeek),
        net_income: annualIncome,
        income_growth: Number(growth),
        linked_401k_id: linked401kId || undefined,
      },
    });

    onClose();
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">⏱️</div>
        <div>
          <h3 className="form-header-title">Edit Hourly Wage Income</h3>
          <p className="form-header-desc">Update hourly rate, weekly hours, and growth details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Job Name */}
            <div className="form-field">
              <label className="form-label">Job Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Barista" />
            </div>

            {/* Hourly Rate */}
            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/hr</span>
                <input value={formatNumberWithCommas(hourlyRate)} onChange={(e) => handleNumberInput(e, setHourlyRate)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="25" type="text" step="0.01" />
              </div>
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(hoursPerWeek)} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="form-input form-input--suffix" placeholder="40" type="text" />
                <span className="form-input-suffix">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input--suffix" placeholder="3" type="text" step="0.1" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Link to 401k card */}
            {available401ks.length > 0 && (
              <div className="link-card">
                <label className="form-label">Link 401(k) Account</label>
                <select value={linked401kId} onChange={(e) => setLinked401kId(e.target.value)} className="form-input">
                  <option value="">None - No linking</option>
                  {available401ks.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {linked401kId && <div className="link-card__synced">🔗 Linked to {available401ks.find((a) => a.id === linked401kId)?.name}</div>}
              </div>
            )}

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Update Hourly Income
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditSideHustleForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [averageIncome, setAverageIncome] = useState(item.average_income_per_period?.toString() || "");
  const [frequency, setFrequency] = useState(item.frequency || "monthly");
  const [variability, setVariability] = useState((item.variability * 100)?.toString() || "5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        net_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });

    onClose();
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚀</div>
        <div>
          <h3 className="form-header-title">Edit Side Hustle Income</h3>
          <p className="form-header-desc">Update frequency, variability, and income details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Income Details</p>

            {/* Side Hustle Name */}
            <div className="form-field">
              <label className="form-label">Side Hustle Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Freelance Writing" />
            </div>

            {/* Average Income Per Period */}
            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(averageIncome)} onChange={(e) => handleNumberInput(e, setAverageIncome)} className="form-input form-input--prefix-dollar" placeholder="500" type="text" step="0.01" />
              </div>
            </div>

            {/* Frequency */}
            <div className="form-field">
              <label className="form-label">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Variability Slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Income Variability</label>
                <span className="form-slider-value">±{variabilityPercent.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={50} step={0.1} value={variability} onChange={(e) => setVariability(e.target.value)} className="form-slider" />
              <p className="preview-card__sub">
                Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💰</span>
                <span className="preview-card__label">Estimated Annual Income</span>
              </div>
              <div className="preview-card__amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Update Side Hustle
          </button>
        </div>
      </form>
    </div>
  );
}