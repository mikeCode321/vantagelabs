import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput, handleTierThresholdInput } from "@/app/visuals/utils";

// ─────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────

export type ID = string;

export type Tier = {
  threshold: number;
  annual_rate: number;
};

// ─────────────────────────────────────────────
// LIQUID ACCOUNTS
// ─────────────────────────────────────────────

export type CheckingAccount = {
  source_type: "liquid";
  variant: "checking";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  starting_balance: number;
  interest_tiers: Tier[];
};

export type TaxableInvestmentAccount = {
  source_type: "liquid";
  variant: "taxable_investments";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  starting_balance: number;
  monthly_contribution: number;
  expected_return: number;
  dividend_yield: number;
  dividend_reinvestment: "drip" | "cash_out";
  cash_out_account_id?: string;
};

export type EmployerRetirementAccount = {
  source_type: "liquid";
  variant: "employer_retirement";
  id: ID;
  name: string;
  start_year: number;
  end_year: number;
  starting_balance: number;
  monthly_contribution: number;
  expected_return: number;
  employer_match: number;
  linked_income_id?: string;
};

export type LiquidAccount = CheckingAccount | TaxableInvestmentAccount | EmployerRetirementAccount;

// ACCOUNT FORMS
export function CheckingAccountForm({ dispatch }) {
  const [name, setName] = useState("Checking Account");
  const [balance, setBalance] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [tiers, setTiers] = useState<Array<{ threshold: number; annual_rate: number }>>([{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "checking",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        interest_tiers: tiers,
      },
    });

    setName("Checking Account");
    setBalance("");
    setStartYear("");
    setEndYear("");
    setTiers([{ threshold: 0, annual_rate: 0 }]);
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: tiers[tiers.length - 1]?.threshold ?? 0,
        annual_rate: 0.0,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: "threshold" | "annual_rate", value: string) => {
    const updated = [...tiers];
    updated[index][field] = Number(value);
    setTiers(updated);
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💰</div>
        <div>
          <h3 className="form-header-title">Add Checking Account</h3>
          <p className="form-header-desc">Track your checking account balance and tiered interest rates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Main Checking, Emergency Fund" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="10,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            {/* Interest Tiers */}
            <div className="tier-list">
              <div className="tier-header">
                <label className="tier-title">Interest Tiers</label>
                <button type="button" className="tier-btn-add" onClick={addTier}>
                  + Add Tier
                </button>
              </div>

              {tiers.map((tier, index) => (
                <div key={index}>
                  <div className="tier-item">
                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">APY (%)</label>
                      <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} className="form-input" placeholder="0.03" type="number" step="0.0001" />
                    </div>

                    {tiers.length > 1 && (
                      <button type="button" className="tier-btn-remove" onClick={() => removeTier(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
          Add Checking Account
        </button>
      </form>
    </div>
  );
}

export function TaxableInvestmentAccountForm({ dispatch }) {
  const [name, setName] = useState("Taxable Investments");
  const [balance, setBalance] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [dividendYield, setDividendYield] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [dividendStrategy, setDividendStrategy] = useState<"drip" | "cash_out">("drip");
  const [cashOutAccountId, setCashOutAccountId] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dividendStrategy === "cash_out" && !cashOutAccountId) {
      alert("Please select a checking account for dividend payouts");
      return;
    }

    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "taxable_investments",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
        cash_out_account_id: dividendStrategy === "cash_out" ? cashOutAccountId : undefined,
      },
    });

    setName("Taxable Investments");
    setBalance("");
    setMonthlyContribution("");
    setExpectedReturn("");
    setDividendYield("");
    setStartYear("");
    setEndYear("");
    setDividendStrategy("drip");
    setCashOutAccountId("");
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">📈</div>
        <div>
          <h3 className="form-header-title">Add Taxable Investment Account</h3>
          <p className="form-header-desc">Track your brokerage account with returns and dividend strategies.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="50,000" type="text" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="1,000" type="text" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Dividend Yield slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
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
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
          Add Taxable Investment Account
        </button>
      </form>
    </div>
  );
}

export function EmployerRetirementAccountForm({ dispatch, state }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("7");
  const [employerMatch, setEmployerMatch] = useState("4");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [linkedIncomeId, setLinkedIncomeId] = useState("");
  const [linkError, setLinkError] = useState("");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];

  // Calculate annual contribution preview
  const monthlyNum = Number(monthlyContribution) || 0;
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const handleJobSelect = (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      return;
    }

    const selectedJob = allJobs.find((job) => job.id === jobId);

    // Check if this job is already linked to another 401k
    if (selectedJob?.linked_401k_id) {
      setLinkError("This job is already linked to another 401(k) account.");
      setLinkedIncomeId("");
      return;
    }

    setLinkedIncomeId(jobId);
    setStartYear(selectedJob.start_year.toString());
    setEndYear(selectedJob.end_year.toString());
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (linkError) {
      return;
    }

    const newAccountId = crypto.randomUUID();

    // If a job is linked, update it with the new 401k ID
    if (linkedIncomeId) {
      const selectedJob = allJobs.find((job) => job.id === linkedIncomeId);

      if (selectedJob) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...selectedJob,
            linked_401k_id: newAccountId,
          },
        });
      }
    }

    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "employer_retirement",
        id: newAccountId,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        employer_match: Number(employerMatch) / 100,
        linked_income_id: linkedIncomeId || undefined,
      },
    });

    // Reset form
    setName("");
    setBalance("");
    setMonthlyContribution("");
    setExpectedReturn("7");
    setEmployerMatch("4");
    setStartYear("");
    setEndYear("");
    setLinkedIncomeId("");
    setLinkError("");
  };

  const linkedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Add Employer Retirement Account</h3>
          <p className="form-header-desc">Track your 401(k), 403(b), or pension and optionally link it to a job.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" required />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="text" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="500" type="text" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Employer Match slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Employer Match</label>
                <span className="form-slider-value">{Number(employerMatch).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} className="form-slider" />
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
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" required />
              </div>
            </div>

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card__header">
                <div className="link-card__info">
                  <span className="preview-icon">💼</span>
                  <div>
                    <div className="link-card__title">Link to a job</div>
                    <div className="link-card__sub">Sync contribution years automatically</div>
                  </div>
                </div>
              </div>

              <div className="link-card__body">
                {allJobs.length === 0 ? (
                  <p className="link-card__no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : (
                  <div className="form-field--gap8">
                    <select value={linkedIncomeId} onChange={(e) => handleJobSelect(e.target.value)} className="form-input">
                      <option value="">None - No linking</option>
                      {allJobs.map((job) => {
                        const isLinked = job.linked_401k_id;
                        return (
                          <option key={job.id} value={job.id} disabled={isLinked}>
                            {job.name} {isLinked ? "(already linked)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {linkError && <div style={{ color: "#EF4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>{linkError}</div>}
                    {linkedJob && !linkError && (
                      <div className="link-card__synced">
                        🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Annual contribution preview */}
            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">✨</span>
                <span className="preview-card__label">Annual Contribution</span>
              </div>
              <div className="preview-card__amount preview-card__amount--lg">
                ${annualTotal.toLocaleString()}
                <span className="preview-card__unit preview-card__unit--lg">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="submit" className="form-btn-submit form-btn-submit--mt">
            Add Employer Retirement Account
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- EDIT ACCOUNT FORMS -------------------- */

export function EditCheckingAccountForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.balance.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [tiers, setTiers] = useState(item.interest_tiers && item.interest_tiers.length > 0 ? item.interest_tiers : [{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        interest_tiers: tiers,
      },
    });

    onClose();
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: (tiers[tiers.length - 1]?.threshold ?? 0) + 50000,
        annual_rate: 0.0,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: "threshold" | "annual_rate", value: string) => {
    const updated = [...tiers];
    updated[index][field] = Number(value);
    setTiers(updated);
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💰</div>
        <div>
          <h3 className="form-header-title">Edit Checking Account</h3>
          <p className="form-header-desc">Update your checking account balance and tiered interest rates.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Main Checking, Emergency Fund" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="10,000" type="text" />
              </div>
            </div>

            {/* Interest Tiers */}
            <div className="tier-list">
              <div className="tier-header">
                <label className="tier-title">Interest Tiers</label>
                <button type="button" className="tier-btn-add" onClick={addTier}>
                  + Add Tier
                </button>
              </div>

              {tiers.map((tier, index) => (
                <div key={index}>
                  <div className="tier-item">
                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap--narrow">
                      <label className="form-label">APY (%)</label>
                      <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} className="form-input" placeholder="0.03" type="number" step="0.0001" />
                    </div>

                    {tiers.length > 1 && (
                      <button type="button" className="tier-btn-remove" onClick={() => removeTier(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
          Save Checking Account
        </button>
      </form>
    </div>
  );
}

export function EditTaxableInvestmentAccountForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "");
  const [dividendYield, setDividendYield] = useState((item.dividend_yield * 100)?.toString() || "");
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [dividendStrategy, setDividendStrategy] = useState(item.dividend_reinvestment || "drip");

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: {
        ...item,
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        starting_balance: Number(balance),
        monthly_contribution: Number(monthlyContribution),
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
      },
    });
    onClose();
  };

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">📈</div>
        <div>
          <h3 className="form-header-title">Edit Taxable Investment Account</h3>
          <p className="form-header-desc">Update your brokerage account with returns and dividend strategies.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="50,000" type="text" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="1,000" type="text" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Dividend Yield slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
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
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit--mt">
          Save Taxable Investment Account
        </button>
      </form>
    </div>
  );
}

export function EditEmployerRetirementAccountForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "7");
  const [employerMatch, setEmployerMatch] = useState((item.employer_match * 100)?.toString() || "4");
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [linkedIncomeId, setLinkedIncomeId] = useState(item.linked_income_id || "");
  const [linkError, setLinkError] = useState("");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];

  // Calculate annual contribution preview
  const monthlyNum = Number(monthlyContribution) || 0;
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const handleJobSelect = (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      return;
    }

    const selectedJob = allJobs.find((job) => job.id === jobId);

    // Check if this job is already linked to another 401k
    if (selectedJob?.linked_401k_id) {
      setLinkError("This job is already linked to another 401(k) account.");
      setLinkedIncomeId("");
      return;
    }

    setLinkedIncomeId(jobId);
    setStartYear(selectedJob.start_year.toString());
    setEndYear(selectedJob.end_year.toString());
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if there's a link error
    if (linkError) {
      return;
    }

    const updatedAccount = {
      ...item,
      name,
      start_year: Number(startYear),
      end_year: Number(endYear),
      starting_balance: Number(balance),
      monthly_contribution: Number(monthlyContribution),
      expected_return: Number(expectedReturn),
      employer_match: Number(employerMatch),
      linked_income_id: linkedIncomeId || undefined,
    };

    // Only handle linking if this account wasn't previously linked
    // (If it was linked, user must delete and recreate to change the link)
    if (!item.linked_income_id && linkedIncomeId) {
      const selectedJob = allJobs.find((job) => job.id === linkedIncomeId);

      if (selectedJob) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...selectedJob,
            linked_401k_id: item.id,
          },
        });
      }
    }

    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: updatedAccount,
    });

    onClose();
  };

  const linkedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Edit Employer Retirement Account</h3>
          <p className="form-header-desc">Update your 401(k), 403(b), or pension details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            {/* Account Name */}
            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" />
            </div>

            {/* Starting Balance */}
            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="text" />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="form-field">
              <label className="form-label">Monthly Contribution</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="500" type="text" />
              </div>
            </div>

            {/* Expected Return slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            {/* Employer Match slider */}
            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Employer Match</label>
                <span className="form-slider-value">{Number(employerMatch).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} className="form-slider" />
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

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card__header">
                <div className="link-card__info">
                  <span className="preview-icon">💼</span>
                  <div>
                    <div className="link-card__title">Link to a job</div>
                    <div className="link-card__sub">Sync contribution years automatically</div>
                  </div>
                </div>
              </div>

              <div className="link-card__body">
                {allJobs.length === 0 ? (
                  <p className="link-card__no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : item.linked_income_id ? (
                  // If already linked, show read-only status
                  <div>
                    <div className="link-card__synced">
                      🔗 Linked to {allJobs.find((j) => j.id === linkedIncomeId)?.name}
                      <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "0.5rem" }}>Delete this account to unlink and reassign</div>
                    </div>
                  </div>
                ) : (
                  // Always show dropdown for selection
                  <div className="form-field--gap8">
                    <select value={linkedIncomeId} onChange={(e) => handleJobSelect(e.target.value)} className="form-input">
                      <option value="">None - No linking</option>
                      {allJobs.map((job) => {
                        const isLinked = job.linked_401k_id;
                        return (
                          <option key={job.id} value={job.id} disabled={isLinked}>
                            {job.name} {isLinked ? "(already linked)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {linkError && <div style={{ color: "#EF4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>{linkError}</div>}
                    {linkedJob && !linkError && (
                      <div className="link-card__synced">
                        🔗 Synced years {linkedJob.start_year}–{linkedJob.end_year}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Annual contribution preview */}
            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">✨</span>
                <span className="preview-card__label">Annual Contribution</span>
              </div>
              <div className="preview-card__amount preview-card__amount--lg">
                ${annualTotal.toLocaleString()}
                <span className="preview-card__unit preview-card__unit--lg">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
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
            Update Account
          </button>
        </div>
      </form>
    </div>
  );
}
