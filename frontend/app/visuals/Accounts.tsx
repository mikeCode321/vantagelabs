import { useState, useEffect } from "react";
import { formatNumberWithCommas, handleNumberInput, handleTierThresholdInput } from "@/app/visuals/utils";
import { CircleDollarSign,ChartNoAxesCombined ,ChartPie , HandCoins, PieChart, Landmark,Grid3x3 , ChevronLeft, ChevronRight, Handbag, CreditCard, ChartColumnIncreasing , Accessibility, Luggage, Clock, Rocket, House,BanknoteArrowDown, Building,ShoppingCart ,Car, HousePlus, TrendingUpDown, ArrowBigDownDash, BanknoteArrowUp, DollarSign, Link } from 'lucide-react';
import {
  TimelineAgeFields,
  getValidatedTimelinePayload,
} from "@/app/visuals/TimelineAgeFields";

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
  start_age: number;
  end_age: number;
  starting_balance: number;
  interest_tiers: Tier[];
};

export type TaxableInvestmentAccount = {
  source_type: "liquid";
  variant: "taxable_investments";
  id: ID;
  name: string;
  start_age: number;
  end_age: number;
  starting_balance: number;

  contribution_mode: "dollar" | "percentage";
  monthly_contribution: number;
  contribution_percentage?: number;

  expected_return: number;
  dividend_yield: number;
  dividend_reinvestment: "drip" | "cash_out";
  cash_out_account_id?: string;
  linked_income_id?: string;
};

export type EmployerRetirementAccount = {
  source_type: "liquid";
  variant: "employer_retirement";
  id: ID;
  name: string;
  start_age: number;
  end_age: number;
  starting_balance: number;

  contribution_mode: "dollar" | "percentage";
  monthly_contribution: number;
  contribution_percentage?: number;

  expected_return: number;
  employer_match: number;
  linked_income_id?: string;
};

export type LiquidAccount = CheckingAccount | TaxableInvestmentAccount | EmployerRetirementAccount;

// ACCOUNT FORMS
export function CheckingAccountForm({ dispatch, state, onClose, onToast }) {
  const hasCheckingAccount = state.accounts?.checking?.length > 0;
  const [name, setName] = useState("Checking Account");
  const [balance, setBalance] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [tiers, setTiers] = useState<Array<{ threshold: number; annual_rate: number }>>([{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        source_type: "liquid",
        variant: "checking",
        id: crypto.randomUUID(),
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        starting_balance: Number(balance),
        interest_tiers: tiers,
      },
    });

    onToast(name, "added");

    onClose();

    // setName("Checking Account");
    // setBalance("");
    // setStartAge("");
    // setEndAge("");
    // setTiers([{ threshold: 0, annual_rate: 0 }]);
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
        <div className="form-header-icon"><CreditCard/></div>
        <div>
          <h3 className="form-header-title">Add Checking Account</h3>
          <p className="form-header-desc">Track your checking account balance and tiered interest rates.</p>
        </div>
      </div>
      {hasCheckingAccount && (
        <div className="form-warning">
          At the moment we are only supporting 1 checking account. Remove the existing account or edit it.
        </div>
      )}

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
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="10,000" type="text" inputMode="decimal" required />
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
                    <div className="tier-input-wrap-narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap-narrow">
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
          <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />
        </div>
        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit-mt" disabled={hasCheckingAccount}>
            Add Checking Account
        </button>
      </form>
    </div>
  );
}

export function TaxableInvestmentAccountForm({ dispatch, state, onToast }) {
  const [name, setName] = useState("Taxable Investments");
  const [balance, setBalance] = useState("");
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">("dollar");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [contributionPercentage, setContributionPercentage] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [dividendYield, setDividendYield] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [dividendStrategy, setDividendStrategy] = useState<"drip" | "cash_out">("drip");
  const [cashOutAccountId, setCashOutAccountId] = useState("");
  const [linkedIncomeId, setLinkedIncomeId] = useState("");
  const [linkError, setLinkError] = useState("");
  const [netIncome, setNetIncome] = useState<number | null>(null);
  const [isLoadingTaxCalc, setIsLoadingTaxCalc] = useState(false);

  const salaries = state?.incomes?.salary || [];
  const hourlyIncomes = state?.incomes?.hourly || [];
  const allJobs = [...salaries, ...hourlyIncomes];
  const checkingAccounts = state?.accounts?.checking || [];
  const selectedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  const calculateNetIncome = async (grossIncome: number, jobId: string) => {
    // TODO: Call tax API here when implemented
    // const response = await fetch('/api/calculate-taxes', { jobId, year: ... })
    // return response.net_income

    // For now we will use a placeholder estimate 
    return grossIncome * 0.75;
  };

  const handleJobSelect = async (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      setNetIncome(null);
      return;
    }

    const job = allJobs.find((job) => job.id === jobId);
    if (!job) return;

    setLinkedIncomeId(jobId);
    setStartAge(job.start_age.toString());
    setEndAge(job.end_age.toString());

    // Calculate net income
    setIsLoadingTaxCalc(true);
    try {
      const calculated = await calculateNetIncome(job.gross_income, jobId);
      setNetIncome(calculated);
    } finally {
      setIsLoadingTaxCalc(false);
    }
  };

  // Calculate effective monthly contribution based on mode
  const effectiveMonthlyContribution = () => {
    if (contributionMode === "dollar") {
      return Number(monthlyContribution) || 0;
    } else if (netIncome && contributionMode === "percentage") {
      const monthlyNet = netIncome / 12;
      return (monthlyNet * Number(contributionPercentage)) / 100;
    }
    return 0;
  };


  const canUsePercentageMode = netIncome !== null && !isLoadingTaxCalc;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

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
        start_age: timeline.start,
        end_age: timeline.end,
        starting_balance: Number(balance),
        contribution_mode: contributionMode,
        monthly_contribution: effectiveMonthlyContribution(),
        contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage) : undefined,
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
        cash_out_account_id: dividendStrategy === "cash_out" ? cashOutAccountId : undefined,
        linked_income_id: linkedIncomeId || undefined,
      },
    });

    onToast(name, "added");

    setName("Taxable Investments");
    setBalance("");
    setContributionMode("dollar");
    setMonthlyContribution("");
    setContributionPercentage("");
    setExpectedReturn("");
    setDividendYield("");
    setStartAge("");
    setEndAge("");
    setDividendStrategy("drip");
    setCashOutAccountId("");
    setLinkedIncomeId("");
    setNetIncome(null);
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><ChartColumnIncreasing/></div>
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

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" required />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="50,000" type="text" />
              </div>
            </div>

            {/* Contribution Mode Toggle - Compact */}
            <div className="form-field">
              <label className="form-label">Contribution</label>
              <div style={{ display: "flex", gap: "4px" }}>
                <div className="form-toggle-group">
                  <button type="button" className={`form-btn-secondary${contributionMode === "dollar" ? " active" : ""}`} onClick={() => setContributionMode("dollar")}>
                    $
                  </button>
                  <button type="button" className={`form-btn-secondary${contributionMode === "percentage" ? " active" : ""}`} onClick={() => setContributionMode("percentage")} disabled={!canUsePercentageMode} title={!canUsePercentageMode ? "Link a job first" : ""}>
                    %
                  </button>
                </div>
              </div>
            </div>

            {/* Dollar Mode */}
            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <div className="form-input-wrap">
                  <span className="form-input-prefix">$</span>
                  <span className="form-input-suffix">/mo</span>
                  <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="1,000" type="text" />
                </div>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Net Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-suffix" placeholder="10" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>
            )}

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline & Dividend</p>

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />

            {/* 🔧 FIX: Link to job card - NOW SHOWS IN BOTH MODES */}
            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a job</div>
                    <div className="link-card-sub">
                      {contributionMode === "percentage" 
                        ? "Required for percentage-based contributions"
                        : "Optional — enables percentage-based contributions"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {allJobs.length === 0 ? (
                  <p className="link-card-no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : (
                  <div className="form-field-gap8">
                    <select 
                      value={linkedIncomeId} 
                      onChange={(e) => handleJobSelect(e.target.value)} 
                      className="form-input" 
                      disabled={isLoadingTaxCalc}
                    >
                      <option value="">None - No linking</option>
                      {allJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.name}
                        </option>
                      ))}
                    </select>
                    {linkError && <p className="form-inline-error">{linkError}</p>}
                    {isLoadingTaxCalc && <p className="form-inline-loading">⏳ Calculating net income...</p>}
                  
                  </div>
                )}
              </div>
            </div>

            {/* Merged Contribution Preview - Only show in percentage mode */}
            {contributionMode === "percentage" && selectedJob && netIncome && !isLoadingTaxCalc && (
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon">💵</span>
                  <span className="preview-card-label">Contribution Preview</span>
                </div>
                <div className="preview-card-row">
                  <div className="preview-card-col">
                    <span className="preview-card-meta-label">Monthly</span>
                    <span className="preview-card-value">${effectiveMonthlyContribution().toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                  <div className="preview-card-col preview-card-col-right">
                    <span className="preview-card-meta-label">Annual</span>
                    <span className="preview-card-value">${(effectiveMonthlyContribution() * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                </div>
                <div className="preview-card-footer">
                  {Number(contributionPercentage).toFixed(1)}% of ${(netIncome / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly net
                </div>
              </div>
            )}

            {/* Dividend strategy section */}
            <p className="form-section-heading">Dividend Strategy</p>

            <div className="form-field">
              <div className="form-toggle-group">
                <button type="button" className={dividendStrategy === "drip" ? "form-btn-secondary active" : "form-btn-secondary"} onClick={() => setDividendStrategy("drip")}>
                  DRIP
                </button>
                <button type="button" className={dividendStrategy === "cash_out" ? "form-btn-secondary active" : "form-btn-secondary"} onClick={() => setDividendStrategy("cash_out")}>
                  Cash Out
                </button>
              </div>
            </div>

            {dividendStrategy === "cash_out" && (
              <div className="form-field">
                <label className="form-label">Cash Out Account</label>
                <select value={cashOutAccountId} onChange={(e) => setCashOutAccountId(e.target.value)} className="form-input" required>
                  <option value="">Select a checking account</option>
                  {checkingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit form-btn-submit-mt">
            Add Taxable Investment Account
          </button>
        </div>
      </form>
    </div>
  );
}

export function EmployerRetirementAccountForm({ dispatch, state, onToast }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">("dollar");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [contributionPercentage, setContributionPercentage] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("7");
  const [employerMatch, setEmployerMatch] = useState("4");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [linkedIncomeId, setLinkedIncomeId] = useState("");
  const [linkError, setLinkError] = useState("");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];
  const selectedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  // Calculate effective monthly contribution based on mode
  const effectiveMonthlyContribution = () => {
    if (contributionMode === "dollar") {
      return Number(monthlyContribution) || 0;
    } else if (selectedJob && contributionMode === "percentage") {
      const annualGross = selectedJob.gross_income;
      const monthlyGross = annualGross / 12;
      return (monthlyGross * Number(contributionPercentage)) / 100;
    }
    return 0;
  };

  // Calculate annual contribution preview
  const monthlyNum = effectiveMonthlyContribution();
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const canUsePercentageMode = !!selectedJob;

  const handleJobSelect = (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      return;
    }

    const job = allJobs.find((job) => job.id === jobId);

    if (job?.linked_401k_id) {
      setLinkError("This job is already linked to another 401(k) account.");
      setLinkedIncomeId("");
      return;
    }

    setLinkedIncomeId(jobId);
    setStartAge(job.start_age.toString());
    setEndAge(job.end_age.toString());
  };

  const onSubmit = (e: React.FormEvent) => {
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }
    e.preventDefault();

    if (linkError) {
      return;
    }

    const newAccountId = crypto.randomUUID();

    if (linkedIncomeId) {
      const job = allJobs.find((job) => job.id === linkedIncomeId);

      if (job) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...job,
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
        start_age: timeline.start,
        end_age: timeline.end,
        starting_balance: Number(balance),
        contribution_mode: contributionMode,
        monthly_contribution: effectiveMonthlyContribution(),
        contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage) : undefined,
        expected_return: Number(expectedReturn) / 100,
        employer_match: Number(employerMatch) / 100,
        linked_income_id: linkedIncomeId || undefined,
      },
    });

    onToast(name, "added");

    setName("");
    setBalance("");
    setContributionMode("dollar");
    setMonthlyContribution("");
    setContributionPercentage("");
    setExpectedReturn("7");
    setEmployerMatch("4");
    setStartAge("");
    setEndAge("");
    setLinkedIncomeId("");
    setLinkError("");
  };

  const linkedJob = selectedJob;

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><Accessibility/></div>
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

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" required />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="25,000" type="text" />
              </div>
            </div>

            {/* Contribution Mode Toggle - Compact */}
            <div className="form-field">
              <label className="form-label">Contribution</label>
              <div className="form-toggle-group">
                <button type="button" className={`form-btn-secondary${contributionMode === "dollar" ? " active" : ""}`} onClick={() => setContributionMode("dollar")}>
                  $
                </button>
                <button type="button" className={`form-btn-secondary${contributionMode === "percentage" ? " active" : ""}`} onClick={() => setContributionMode("percentage")} disabled={!canUsePercentageMode} title={!canUsePercentageMode ? "Link a job first" : ""}>
                  %
                </button>
              </div>
            </div>

            {/* Dollar Mode */}
            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <div className="form-input-wrap">
                  <span className="form-input-prefix">$</span>
                  <span className="form-input-suffix">/mo</span>
                  <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="500" type="text" />
                </div>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Gross Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-suffix" placeholder="6" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>
            )}

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a job</div>
                    <div className="link-card-sub">Required for percentage-based contributions</div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {allJobs.length === 0 ? (
                  <p className="link-card-no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : (
                  <div className="form-field-gap8">
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
                      <div className="link-card-synced">
                        <Link/> Synced years {linkedJob.start_age}–{linkedJob.end_age}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Merged Contribution Preview - Only show in percentage mode */}
            {contributionMode === "percentage" && selectedJob && (
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon"><DollarSign/></span>
                  <span className="preview-card-label">Contribution Preview</span>
                </div>
                <div className="preview-card-row">
                  <div className="preview-card-col">
                    <span className="preview-card-meta-label">Monthly</span>
                    <span className="preview-card-value">${effectiveMonthlyContribution().toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                  <div className="preview-card-col preview-card-col-right">
                    <span className="preview-card-meta-label">Annual</span>
                    <span className="preview-card-value">${(effectiveMonthlyContribution() * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                </div>
                <div className="preview-card-footer">
                  {Number(contributionPercentage).toFixed(1)}% of ${(selectedJob.gross_income / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly gross
                </div>
              </div>
            )}

            {/* Annual contribution preview with employer match */}
            {contributionMode == "dollar" && (
              <div className="preview-card">
                <div className="preview-card-header preview-card-header-mb10">
                  <span className="preview-icon"></span>
                  <span className="preview-card-label">Annual Total</span>
                </div>
                <div className="preview-card-amount preview-card-amount-lg">
                  ${annualTotal.toLocaleString()}
                  <span className="preview-card-unit preview-card-unit-lg">/yr</span>
                </div>
                <div className="preview-card-sub">
                  ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit form-btn-submit-mt">
            Add Employer Retirement Account
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- EDIT ACCOUNT FORMS -------------------- */

export function EditCheckingAccountForm({ item,state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [tiers, setTiers] = useState(item.interest_tiers && item.interest_tiers.length > 0 ? item.interest_tiers : [{ threshold: 0, annual_rate: 0 }]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: {
        ...item,
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        starting_balance: Number(balance),
        interest_tiers: tiers,
      },
    });

    onToast(name, "edited");
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
        <div className="form-header-icon"><CreditCard/></div>
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
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="10,000" type="text" />
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
                    <div className="tier-input-wrap-narrow">
                      <label className="form-label">Threshold</label>
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="e.g. 100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap-narrow">
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

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-btn-submit form-btn-submit-mt">
          Save Checking Account
        </button>
      </form>
    </div>
  );
}

export function EditTaxableInvestmentAccountForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">(item.contribution_mode || "dollar");
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [contributionPercentage, setContributionPercentage] = useState(item.contribution_percentage?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "");
  const [dividendYield, setDividendYield] = useState((item.dividend_yield * 100)?.toString() || "");
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [dividendStrategy, setDividendStrategy] = useState(item.dividend_reinvestment || "drip");
  const [cashOutAccountId, setCashOutAccountId] = useState(item.cash_out_account_id || "");
  const [linkedIncomeId, setLinkedIncomeId] = useState(item.linked_income_id || "");
  const [linkError, setLinkError] = useState("");
  const [netIncome, setNetIncome] = useState<number | null>(null);
  const [isLoadingTaxCalc, setIsLoadingTaxCalc] = useState(false);

  const salaries = state?.incomes?.salary || [];
  const hourlyIncomes = state?.incomes?.hourly || [];
  const allJobs = [...salaries, ...hourlyIncomes];
  const checkingAccounts = state?.accounts?.checking || [];
  const selectedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  useEffect(() => {
    if (linkedIncomeId && selectedJob && !netIncome) {
      handleJobSelect(linkedIncomeId);
    }
  }, []); // Run once on mount

  const calculateNetIncome = async (grossIncome: number, jobId: string) => {
    // TODO: Call our future tax API here when implemented
    // For now we use a placeholder estimate
    return grossIncome * 0.75;
  };

  const handleJobSelect = async (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      setNetIncome(null);
      return;
    }

    const job = allJobs.find((job) => job.id === jobId);
    if (!job) return;

    setLinkedIncomeId(jobId);
    setStartAge(job.start_age.toString());
    setEndAge(job.end_age.toString());

    setIsLoadingTaxCalc(true);
    try {
      const calculated = await calculateNetIncome(job.gross_income, jobId);
      setNetIncome(calculated);
    } finally {
      setIsLoadingTaxCalc(false);
    }
  };

  // Calculate effective monthly contribution based on mode
  const effectiveMonthlyContribution = () => {
    if (contributionMode === "dollar") {
      return Number(monthlyContribution) || 0;
    } else if (netIncome && contributionMode === "percentage") {
      const monthlyNet = netIncome / 12;
      return (monthlyNet * Number(contributionPercentage)) / 100;
    }
    return 0;
  };

  const canUsePercentageMode = netIncome !== null && !isLoadingTaxCalc;

  const onSubmit = (e) => {
    e.preventDefault();

    if (dividendStrategy === "cash_out" && !cashOutAccountId) {
      alert("Please select a checking account for dividend payouts");
      return;
    }
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: {
        ...item,
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        starting_balance: Number(balance),
        contribution_mode: contributionMode,
        monthly_contribution: effectiveMonthlyContribution(),
        contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage) : undefined,
        expected_return: Number(expectedReturn) / 100,
        dividend_yield: Number(dividendYield) / 100,
        dividend_reinvestment: dividendStrategy,
        cash_out_account_id: dividendStrategy === "cash_out" ? cashOutAccountId : undefined,
        linked_income_id: linkedIncomeId || undefined,
      },
    });

    onToast(name, "edited");

    onClose();
  };

  return (
    <div className="form-panel">
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

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="50,000" type="text" />
              </div>
            </div>

            {/* Contribution Mode Toggle - Compact */}
            <div className="form-field">
              <label className="form-label">Contribution</label>
              <div className="form-toggle-group">
                <button type="button" className={`form-btn-secondary${contributionMode === "dollar" ? " active" : ""}`} onClick={() => setContributionMode("dollar")}>
                  $
                </button>
                <button type="button" className={`form-btn-secondary${contributionMode === "percentage" ? " active" : ""}`} onClick={() => setContributionMode("percentage")} disabled={!canUsePercentageMode} title={!canUsePercentageMode ? "Link a job first" : ""}>
                  %
                </button>
              </div>
            </div>

            {/* Dollar Mode */}
            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <div className="form-input-wrap">
                  <span className="form-input-prefix">$</span>
                  <span className="form-input-suffix">/mo</span>
                  <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="1,000" type="text" />
                </div>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Net Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-suffix" placeholder="10" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>
            )}

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Dividend Yield</label>
                <span className="form-slider-value">{Number(dividendYield).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={dividendYield} onChange={(e) => setDividendYield(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline & Dividend</p>

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />

            {/* 🔧 FIX: Link to job card - NOW SHOWS IN BOTH MODES */}
            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a job</div>
                    <div className="link-card-sub">
                      {contributionMode === "percentage" 
                        ? "Required for percentage-based contributions"
                        : "Optional — enables percentage-based contributions"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {allJobs.length === 0 ? (
                  <p className="link-card-no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : (
                  <div className="form-field-gap8">
                    <select 
                      value={linkedIncomeId} 
                      onChange={(e) => handleJobSelect(e.target.value)} 
                      className="form-input" 
                      disabled={isLoadingTaxCalc}
                    >
                      <option value="">None - No linking</option>
                      {allJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.name}
                        </option>
                      ))}
                    </select>
                    {linkError && <p className="form-inline-error">{linkError}</p>}
                    {isLoadingTaxCalc && <p className="form-inline-loading">⏳ Calculating net income...</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Merged Contribution Preview - Only show in percentage mode */}
            {contributionMode === "percentage" && selectedJob && netIncome && !isLoadingTaxCalc && (
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon"><DollarSign/></span>
                  <span className="preview-card-label">Contribution Preview</span>
                </div>
                <div className="preview-card-row">
                  <div className="preview-card-col">
                    <span className="preview-card-meta-label">Monthly</span>
                    <span className="preview-card-value">${effectiveMonthlyContribution().toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                  <div className="preview-card-col preview-card-col-right">
                    <span className="preview-card-meta-label">Annual</span>
                    <span className="preview-card-value">${(effectiveMonthlyContribution() * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                </div>
                <div className="preview-card-footer">
                  {Number(contributionPercentage).toFixed(1)}% of ${(netIncome / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly net
                </div>
              </div>
            )}

            {/* Dividend strategy section */}
            <p className="form-section-heading">Dividend Strategy</p>

            <div className="form-field">
              <div style={{ display: "flex", gap: "4px" }}>
                <button type="button" className={dividendStrategy === "drip" ? "form-btn-secondary active" : "form-btn-secondary"} onClick={() => setDividendStrategy("drip")} style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}>
                  DRIP
                </button>
                <button type="button" className={dividendStrategy === "cash_out" ? "form-btn-secondary active" : "form-btn-secondary"} onClick={() => setDividendStrategy("cash_out")} style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}>
                  Cash Out
                </button>
              </div>
            </div>

            {dividendStrategy === "cash_out" && (
              <div className="form-field">
                <label className="form-label">Cash Out Account</label>
                <select value={cashOutAccountId} onChange={(e) => setCashOutAccountId(e.target.value)} className="form-input" required>
                  <option value="">Select a checking account</option>
                  {checkingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

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

export function EditEmployerRetirementAccountForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">(item.contribution_mode || "dollar");
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [contributionPercentage, setContributionPercentage] = useState(item.contribution_percentage?.toString() || "");
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "7");
  const [employerMatch, setEmployerMatch] = useState((item.employer_match * 100)?.toString() || "4");
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [linkedIncomeId, setLinkedIncomeId] = useState(item.linked_income_id || "");
  const [linkError, setLinkError] = useState("");

  const salaries = state.incomes.salary;
  const hourlyIncomes = state.incomes.hourly;
  const allJobs = [...salaries, ...hourlyIncomes];
  const selectedJob = linkedIncomeId ? allJobs.find((job) => job.id === linkedIncomeId) : null;

  const effectiveMonthlyContribution = () => {
    if (contributionMode === "dollar") {
      return Number(monthlyContribution) || 0;
    } else if (selectedJob && contributionMode === "percentage") {
      const annualGross = selectedJob.gross_income;
      const monthlyGross = annualGross / 12;
      return (monthlyGross * Number(contributionPercentage)) / 100;
    }
    return 0;
  };

  const monthlyNum = effectiveMonthlyContribution();
  const matchPercent = Number(employerMatch) || 0;
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = (annualEmployee * matchPercent) / 100;
  const annualTotal = annualEmployee + annualEmployer;

  const canUsePercentageMode = !!selectedJob;

  const handleJobSelect = (jobId: string) => {
    setLinkError("");

    if (!jobId) {
      setLinkedIncomeId("");
      return;
    }

    const job = allJobs.find((job) => job.id === jobId);

    if (job?.linked_401k_id && job.linked_401k_id !== item.id) {
      setLinkError("This job is already linked to another 401(k) account.");
      setLinkedIncomeId("");
      return;
    }

    setLinkedIncomeId(jobId);
    setStartAge(job.start_age.toString());
    setEndAge(job.end_age.toString());
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    if (linkError) {
      return;
    }

    const updatedAccount = {
      ...item,
      name,
      start_age: timeline.start,
      end_age: timeline.end,
      starting_balance: Number(balance),
      contribution_mode: contributionMode,
      monthly_contribution: effectiveMonthlyContribution(),
      contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage) : undefined,
      expected_return: Number(expectedReturn) / 100,
      employer_match: Number(employerMatch) / 100,
      linked_income_id: linkedIncomeId || undefined,
    };

    if (!item.linked_income_id && linkedIncomeId) {
      const job = allJobs.find((job) => job.id === linkedIncomeId);

      if (job) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...job,
            linked_401k_id: item.id,
          },
        });
      }
    }

    dispatch({
      type: "UPDATE_ACCOUNT",
      payload: updatedAccount,
    });

    onToast(name, "edited");

    onClose();
  };

  const linkedJob = selectedJob;

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><Building/></div>
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

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(balance)} onChange={(e) => handleNumberInput(e, setBalance)} className="form-input form-input-prefix-dollar" placeholder="25,000" type="text" />
              </div>
            </div>

            {/* Contribution Mode Toggle - Compact */}
            <div className="form-field">
              <label className="form-label">Contribution</label>
              <div className="form-toggle-group">
                <button type="button" className={`form-btn-secondary${contributionMode === "dollar" ? " active" : ""}`} onClick={() => setContributionMode("dollar")}>
                  $
                </button>
                <button type="button" className={`form-btn-secondary${contributionMode === "percentage" ? " active" : ""}`} onClick={() => setContributionMode("percentage")} disabled={!canUsePercentageMode} title={!canUsePercentageMode ? "Link a job first" : ""}>
                  %
                </button>
              </div>
            </div>

            {/* Dollar Mode */}
            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <div className="form-input-wrap">
                  <span className="form-input-prefix">$</span>
                  <span className="form-input-suffix">/mo</span>
                  <input value={formatNumberWithCommas(monthlyContribution)} onChange={(e) => handleNumberInput(e, setMonthlyContribution)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="500" type="text" />
                </div>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Gross Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-suffix" placeholder="6" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>
            )}

            <div className="form-field-gap8">
              <div className="form-slider-header">
                <label className="form-label">Expected Annual Return</label>
                <span className="form-slider-value">{Number(expectedReturn).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="form-slider" />
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />

            {/* Link to job card */}
            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a job</div>
                    <div className="link-card-sub">Required for percentage-based contributions</div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {allJobs.length === 0 ? (
                  <p className="link-card-no-jobs">No jobs yet — add a qualifying job first.</p>
                ) : item.linked_income_id ? (
                  <div>
                    <div className="link-card-synced">
                      🔗 Linked to {allJobs.find((j) => j.id === linkedIncomeId)?.name}
                      <p className="form-inline-muted">Delete this account to unlink and reassign</p>
                    </div>
                  </div>
                ) : (
                  <div className="form-field-gap8">
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
                      <div className="link-card-synced">
                        <Link/> Synced years {linkedJob.start_age}–{linkedJob.end_age}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Merged Contribution Preview - Only show in percentage mode */}
            {contributionMode === "percentage" && selectedJob && (
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon"><DollarSign/></span>
                  <span className="preview-card-label">Contribution Preview</span>
                </div>
                <div className="preview-card-row">
                  <div className="preview-card-col">
                    <span className="preview-card-meta-label">Monthly</span>
                    <span className="preview-card-value">${effectiveMonthlyContribution().toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                  <div className="preview-card-col preview-card-col-right">
                    <span className="preview-card-meta-label">Annual</span>
                    <span className="preview-card-value">${(effectiveMonthlyContribution() * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                </div>
                <div className="preview-card-footer">
                  {Number(contributionPercentage).toFixed(1)}% of ${(selectedJob.gross_income / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly net
                </div>
              </div>
            )}

            {/* Annual contribution preview with employer match */}
            {contributionMode == "dollar" && (
              <div className="preview-card">
                <div className="preview-card-header preview-card-header-mb10">
                  <span className="preview-icon"></span>
                  <span className="preview-card-label">Annual Total</span>
                </div>
                <div className="preview-card-amount preview-card-amount-lg">
                  ${annualTotal.toLocaleString()}
                  <span className="preview-card-unit preview-card-unit-lg">/yr</span>
                </div>
                <div className="preview-card-sub">
                  ${annualEmployee.toLocaleString()} you + ${annualEmployer.toLocaleString()} employer match
                </div>
              </div>
            )}
          </div>
        </div>

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
