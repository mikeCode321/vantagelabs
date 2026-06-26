import './styles/Forms.css'

import { useState, useEffect } from "react";
import { formatNumberWithCommas, handleNumberInput, handleTierThresholdInput } from "@/app/dashboard/utils";
import { CreditCard, ChartColumnIncreasing , DollarSign, Link, PiggyBank } from 'lucide-react';
import {
  TimelineAgeFields,
  getValidatedTimelinePayload,
} from "@/app/dashboard/TimelineAgeFields";
import FormSlider from "@/app/dashboard/components/FormSlider";
import FormHeader from "@/app/dashboard/components/FormHeader";
import LinkCard from '@/app/dashboard/components/LinkCard';
import FormDollarInput from '@/app/dashboard/components/FormDollarInput';
import FormSubmitButton from '@/app/dashboard/components/FormSubmitButton';
import FormToggleGroup from '@/app/dashboard/components/FormToggleButton';

// ─────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────

export type ID = string;

type TierForm = {
  threshold: string;
  annual_rate: string;
};

type Tier = {
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
  employer_match_rate: number;   // e.g. 1.0 = 100% dollar-for-dollar match
  employer_match_limit: number;  // e.g. 0.04 = capped at 4% of gross salary
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
  const [tiers, setTiers] = useState<TierForm[]>([{ threshold: "", annual_rate: "" }]);

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
        interest_tiers: tiers.map((tier) => ({
          threshold: Number(tier.threshold || 0),
          annual_rate: Number(tier.annual_rate || 0) / 100,
        })),
      },
    });

    onToast(name, "added");
    onClose();

    // setName("Checking Account");
    // setBalance("");
    // setStartAge("");
    // setEndAge("");
    // setTiers([{ threshold: "", annual_rate: "" }]);
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: tiers[tiers.length - 1]?.threshold ?? "0",
        annual_rate: "0",
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
    updated[index][field] = value;
    setTiers(updated);
  };

  return (
    <div className="form-panel">
      <FormHeader icon={<CreditCard/>} title={"Add Checking Account"} desc={"Track your checking account balance and tiered interest rates."}/>

      {hasCheckingAccount && (
        <div className="form-warning">
          At the moment we are only supporting 1 checking account. Remove the existing account or edit it.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Main Checking, Emergency Fund" required />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <FormDollarInput value={balance} onChange={setBalance} placeholder="10,000" required />
            </div>

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
                      <input value={formatNumberWithCommas(tier.threshold.toString())} onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)} className="form-input" placeholder="100000" type="text" inputMode="decimal" />
                    </div>

                    <div className="tier-input-wrap-narrow">
                      <label className="form-label">APY (%)</label>
                      <input value={tier.annual_rate} onChange={(e) => updateTier(index, "annual_rate", e.target.value)} className="form-input" placeholder="3" type="number" step="0.0001" />
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

        <FormSubmitButton label="Add Checking Account" disabled={hasCheckingAccount} topMargin />
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
  const [expectedReturn, setExpectedReturn] = useState("0");
  const [dividendYield, setDividendYield] = useState("0");
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
        contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage || 0) / 100 : undefined,        
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
      <FormHeader icon={<ChartColumnIncreasing/>} title={"Add Taxable Investment Account"} desc={"Track your brokerage account with returns and dividend strategies."}/>

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
              <FormDollarInput value={balance} onChange={setBalance} placeholder={"50,000"}/>
            </div>

            {/* Contribution Mode Toggle - Compact */}
            <FormToggleGroup
              label="Contribution"
              value={contributionMode}
              onChange={setContributionMode}
              options={[
                { value: "dollar", label: "$" },
                { value: "percentage", label: "%", disabled: !canUsePercentageMode, disabledTitle: "Link a job first" },
              ]}
            />

            {/* Dollar Mode */}
            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <FormDollarInput value={monthlyContribution} onChange={setMonthlyContribution} placeholder={"1,000"} suffix='/mo'/>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Net Income</label>
                <div className="form-input-wrap">
                  <input className="form-input form-input-has-suffix" value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} placeholder="10" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix-label">%</span>
                </div>
              </div>
            )}

            <FormSlider label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={0} max={20} step={0.1} />
            <FormSlider label="Dividend Yield" value={dividendYield} onChange={setDividendYield} min={0} max={10} step={0.1} />
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
            <LinkCard
              title="Link to a job"
              sub={contributionMode === "percentage"
                ? "Required for percentage-based contributions"
                : "Optional — enables percentage-based contributions"}
              items={allJobs}
              emptyMessage="No jobs yet — add a qualifying job first."
              selectedId={linkedIncomeId}
              onSelect={handleJobSelect}
              selectDisabled={isLoadingTaxCalc}
              error={linkError}
              loadingMessage={isLoadingTaxCalc ? "⏳ Calculating net income..." : undefined}
              syncedLabel={selectedJob ? `Synced years ${selectedJob.start_age}–${selectedJob.end_age}` : undefined}
            />

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
                  {(Number(contributionPercentage || 0)).toFixed(1)}% of ${(netIncome / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly net
                </div>
              </div>
            )}

            {/* Dividend strategy section */}
            <p className="form-section-heading">Dividend Strategy</p>

            <FormToggleGroup value={dividendStrategy} onChange={setDividendStrategy} options={[
                { value: "drip", label: "DRIP" },
                { value: "cash_out", label: "Cash Out" },
              ]}
            />

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

        <FormSubmitButton label="Add Taxable Investment Account" topMargin />
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
  const [matchRate, setMatchRate] = useState("100");   // % employer matches per $ contributed (100 = dollar-for-dollar)
  const [matchLimit, setMatchLimit] = useState("4");   // % of gross salary cap
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

  // Mirror Python's contribute_employer logic for the preview
  const monthlyNum = effectiveMonthlyContribution();
  const monthlyGross = selectedJob ? selectedJob.gross_income / 12 : 0;
  const matchCap = monthlyGross * (Number(matchLimit) / 100);
  const matchedAmount = Math.min(monthlyNum, matchCap);
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = matchedAmount * (Number(matchRate) / 100) * 12;
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
        contribution_percentage: contributionMode === "percentage" ? (parseFloat(contributionPercentage || "0") / 100): undefined,        
        expected_return: Number(expectedReturn) / 100,
        employer_match_rate: Number(matchRate) / 100,
        employer_match_limit: Number(matchLimit) / 100,
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
    setMatchRate("100");
    setMatchLimit("4");
    setStartAge("");
    setEndAge("");
    setLinkedIncomeId("");
    setLinkError("");
  };

  const linkedJob = selectedJob;

  return (
    <div className="form-panel">

      <FormHeader icon={<PiggyBank/>} title={"Add Employer Retirement Account"} desc={"Track your 401(k), 403(b), or pension and optionally link it to a job."}/>

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
              <FormDollarInput value={balance} onChange={setBalance} placeholder={"25,000"}/>
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
                <FormDollarInput value={monthlyContribution} onChange={setMonthlyContribution} placeholder="500" suffix='/mo'/>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Gross Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-has-suffix" placeholder="6" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix-label">%</span>
                </div>
              </div>
            )}

            <FormSlider label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={0} max={15} step={0.1} />
            <FormSlider label="Employer Match Rate" value={matchRate} onChange={setMatchRate} min={0} max={200} step={1} decimals={0} />
            <FormSlider label="Employer Match Cap (% of salary)" value={matchLimit} onChange={setMatchLimit} min={0} max={10} step={0.1} />
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
            <LinkCard
              title="Link to a job"
              sub="Required for percentage-based contributions and employer match preview"
              items={allJobs}
              emptyMessage="No jobs yet — add a qualifying job first."
              selectedId={linkedIncomeId}
              onSelect={handleJobSelect}
              isItemDisabled={(job) => Boolean(job.linked_401k_id)}
              error={linkError}
              syncedLabel={linkedJob ? `Synced years ${linkedJob.start_age}–${linkedJob.end_age}` : undefined}
            />

            {/* Contribution Preview - percentage mode */}
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

            {/* Annual total preview with employer match */}
            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"></span>
                <span className="preview-card-label">Annual Total</span>
              </div>
              <div className="preview-card-amount preview-card-amount-lg">
                ${Math.round(annualTotal).toLocaleString()}
                <span className="preview-card-unit preview-card-unit-lg">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${Math.round(annualEmployee).toLocaleString()} you + ${Math.round(annualEmployer).toLocaleString()} employer match
                {!selectedJob && annualEmployer === 0 && <span> (link a job to see match)</span>}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Add Employer Retirement Account" topMargin />
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
  const [tiers, setTiers] = useState<TierForm[]>(
    item.interest_tiers.length > 0
      ? item.interest_tiers.map((tier) => ({ threshold: tier.threshold.toString(), annual_rate: Number((tier.annual_rate * 100).toFixed(4)).toString(),}))
      : [{ threshold: "", annual_rate: "" }]
  );

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
        interest_tiers: tiers.map((tier) => ({
          threshold: Number(tier.threshold || 0),
          annual_rate: Number(tier.annual_rate || 0) / 100,
        })),
      },
    });

    onToast(name, "edited");
    onClose();
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        threshold: String((tiers[tiers.length - 1]?.threshold ?? 0) + 50000),
        annual_rate: "0",
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
    updated[index][field] = value;
    setTiers(updated);
  };

  return (
    <div className="form-panel">

      <FormHeader icon={<CreditCard/>} title={"Edit Checking Account"} desc={"Update your checking account balance and tiered interest rates."}/>

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
              <FormDollarInput value={balance} onChange={setBalance} placeholder="10,000"/>
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
                      <input
                        value={formatNumberWithCommas(tier.threshold)}
                        onChange={(e) => handleTierThresholdInput(e, index, tiers, setTiers)}
                        className="form-input"
                        placeholder="100000"
                        type="text"
                        inputMode="decimal"
                      />                    
                    </div>

                    <div className="tier-input-wrap-narrow">
                      <label className="form-label">APY (%)</label>
                      <input
                        value={tier.annual_rate}
                        onChange={(e) => updateTier(index, "annual_rate", e.target.value)}
                        className="form-input"
                        placeholder="3.5"
                        type="text"
                        inputMode="decimal"
                      />
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

        <FormSubmitButton label="Update Checking Account" topMargin />
      </form>
    </div>
  );
}

export function EditTaxableInvestmentAccountForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">(item.contribution_mode || "dollar");
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [contributionPercentage, setContributionPercentage] = useState(
    item.contribution_percentage != null ? (item.contribution_percentage * 100).toString() : ""
  );  
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "0");
  const [dividendYield, setDividendYield] = useState((item.dividend_yield * 100)?.toString() || "0");
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
        contribution_percentage: contributionMode === "percentage" ? parseFloat(contributionPercentage || "0") / 100 : undefined,
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
      <FormHeader icon={<ChartColumnIncreasing/>} title={"Edit Taxable Investment Account"} desc={"Update your brokerage account with returns and dividend strategies."}/>
      
      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity Brokerage" />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <FormDollarInput value={balance} onChange={setBalance} placeholder="50,000" />
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

            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <FormDollarInput value={monthlyContribution} onChange={setMonthlyContribution} placeholder="1,000" suffix='/mo'/>
              </div>
            )}

            {/* Percentage Mode */}
            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Net Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-has-suffix" placeholder="10" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix-label">%</span>
                </div>
              </div>
            )}

            <FormSlider label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={0} max={20} step={0.1} />
            <FormSlider label="Dividend Yield" value={dividendYield} onChange={setDividendYield} min={0} max={10} step={0.1} />
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
            <LinkCard
              title="Link to a job"
              sub={contributionMode === "percentage"
                ? "Required for percentage-based contributions"
                : "Optional — enables percentage-based contributions"}
              items={allJobs}
              emptyMessage="No jobs yet — add a qualifying job first."
              selectedId={linkedIncomeId}
              onSelect={handleJobSelect}
              selectDisabled={isLoadingTaxCalc}
              error={linkError}
              loadingMessage={isLoadingTaxCalc ? "⏳ Calculating net income..." : undefined}
              syncedLabel={selectedJob ? `Synced years ${selectedJob.start_age}–${selectedJob.end_age}` : undefined}            
            />

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

            <p className="form-section-heading">Dividend Strategy</p>
            <FormToggleGroup value={dividendStrategy} onChange={setDividendStrategy} options={[
                { value: "drip", label: "DRIP" },
                { value: "cash_out", label: "Cash Out" },
              ]}
            />

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

        <FormSubmitButton label="Update Taxable Investment Account" />
      </form>
    </div>
  );
}

export function EditEmployerRetirementAccountForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [balance, setBalance] = useState(item.starting_balance.toString());
  const [contributionMode, setContributionMode] = useState<"dollar" | "percentage">(item.contribution_mode || "dollar");
  const [monthlyContribution, setMonthlyContribution] = useState(item.monthly_contribution?.toString() || "");
  const [contributionPercentage, setContributionPercentage] = useState(
    item.contribution_percentage !== undefined ? (item.contribution_percentage * 100).toString() : ""
  );  
  const [expectedReturn, setExpectedReturn] = useState((item.expected_return * 100)?.toString() || "7");
  const [matchRate, setMatchRate] = useState((item.employer_match_rate * 100)?.toString() || "100");
  const [matchLimit, setMatchLimit] = useState((item.employer_match_limit * 100)?.toString() || "4");
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
  const monthlyGross = selectedJob ? selectedJob.gross_income / 12 : 0;
  const matchCap = monthlyGross * (Number(matchLimit) / 100);
  const matchedAmount = Math.min(monthlyNum, matchCap);
  const annualEmployee = monthlyNum * 12;
  const annualEmployer = matchedAmount * (Number(matchRate) / 100) * 12;
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
      contribution_percentage: contributionMode === "percentage" ? Number(contributionPercentage) / 100 : undefined,      
      expected_return: Number(expectedReturn) / 100,
      employer_match_rate: Number(matchRate) / 100,
      employer_match_limit: Number(matchLimit) / 100,
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
      <FormHeader icon={<PiggyBank/>} title={"Edit Employer Retirement Account"} desc={"Update your 401(k), 403(b), or pension details."}/>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Account Details</p>

            <div className="form-field">
              <label className="form-label">Account Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Fidelity 401(k)" />
            </div>

            <div className="form-field">
              <label className="form-label">Starting Balance</label>
              <FormDollarInput value={balance} onChange={setBalance} placeholder={"25,000"}/>
            </div>

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

            {contributionMode === "dollar" && (
              <div className="form-field">
                <label className="form-label">Monthly Contribution</label>
                <FormDollarInput value={monthlyContribution} onChange={setMonthlyContribution} placeholder={"500"} suffix='/mo'/>
              </div>
            )}

            {contributionMode === "percentage" && (
              <div className="form-field">
                <label className="form-label">Percentage of Gross Income</label>
                <div className="form-input-wrap">
                  <input value={contributionPercentage} onChange={(e) => setContributionPercentage(e.target.value)} className="form-input form-input-has-suffix" placeholder="6" type="number" min="0" max="100" step="0.1" />
                  <span className="form-input-suffix-label">%</span>
                </div>
              </div>
            )}

            <FormSlider label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={0} max={15} step={0.1} />
            <FormSlider label="Employer Match Rate" value={matchRate} onChange={setMatchRate} min={0} max={200} step={1} decimals={0} />
            <FormSlider label="Employer Match Cap (% of salary)" value={matchLimit} onChange={setMatchLimit} min={0} max={10} step={0.1} />
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

            <LinkCard
              title="Link to a job"
              sub="Required for percentage-based contributions"
              items={allJobs}
              emptyMessage="No jobs yet — add a qualifying job first."
              selectedId={linkedIncomeId}
              onSelect={handleJobSelect}
              isItemDisabled={(job) => Boolean(job.linked_401k_id)}
              error={linkError}
              isLocked={Boolean(item.linked_income_id)}
              lockedLabel={allJobs.find((j) => j.id === linkedIncomeId)?.name}
              lockedSubMessage="Delete this account to unlink and reassign"
              syncedLabel={linkedJob ? `Synced years ${linkedJob.start_age}–${linkedJob.end_age}` : undefined}
            />

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
            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"></span>
                <span className="preview-card-label">Annual Total</span>
              </div>
              <div className="preview-card-amount preview-card-amount-lg">
                ${Math.round(annualTotal).toLocaleString()}
                <span className="preview-card-unit preview-card-unit-lg">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${Math.round(annualEmployee).toLocaleString()} you + ${Math.round(annualEmployer).toLocaleString()} employer match
                {!selectedJob && annualEmployer === 0 && <span> (link a job to see match)</span>}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Update Retirement Account" />
      </form>
    </div>
  );
}