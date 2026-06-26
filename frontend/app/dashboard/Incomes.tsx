import './styles/Forms.css'

import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput } from "@/app/dashboard/utils";
import { ID } from "@/app/dashboard/Accounts";
import { TimelineAgeFields, getValidatedTimelinePayload } from "@/app/dashboard/TimelineAgeFields";
import { CircleDollarSign, Landmark,Handbag, Clock,Rocket,Link } from 'lucide-react';
import FormSlider from "@/app/dashboard/components/FormSlider";
import FormHeader from "@/app/dashboard/components/FormHeader";
import LinkCard from "@/app/dashboard/components/LinkCard";
import FormDollarInput from '@/app/dashboard/components/FormDollarInput';

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────
export type SalaryIncome = {
  source_type: "income";
  variant: "salary";

  id: ID;
  name: string;

  start_age: number;
  end_age: number;

  gross_income: number;
  income_growth: number;

  linked_401k_id?: string;
};

export type HourlyWageIncome = {
  source_type: "income";
  variant: "hourly";

  id: ID;
  name: string;

  start_age: number;
  end_age: number;

  hourly_rate: number;          
  hours_per_week: number;       
  gross_income: number;      
  income_growth: number;

  linked_401k_id?: string;
};

export type SideHustleIncome = {
  source_type: "income";
  variant: "side";

  id: ID;
  name: string;

  start_age: number;
  end_age: number;

  gross_income: number;
  variability: number;
  frequency: string;
  average_income_per_period: number;
};

export type IncomeSource = SalaryIncome | HourlyWageIncome | SideHustleIncome;

// INCOME FORMS
export function SalaryForm({ dispatch, state, onToast }) {
  const [name, setName] = useState("");
  const [grossIncome, setGrossIncome] = useState("");
  const [growth, setGrowth] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [linked401kId, setLinked401kId] = useState("");
  const [linkError, setLinkError] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];

  const handle401kSelect = (accountId: string) => {
    setLinkError("");

    if (!accountId) {
      setLinked401kId("");
      return;
    }

    const selectedAccount = available401ks.find((acc) => acc.id === accountId);

    // Check if this 401k is already linked to another job
    if (selectedAccount?.linked_income_id) {
      setLinkError("This 401(k) is already linked to another job.");
      setLinked401kId("");
      return;
    }

    setLinked401kId(accountId);
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

    const newIncomeId = crypto.randomUUID();

    // If a 401k is selected, update it with the link
    if (linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

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

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "salary",
        id: newIncomeId,
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        gross_income: Number(grossIncome),
        income_growth: Number(growth)/100,
        linked_401k_id: linked401kId || undefined,
      },
    });

    onToast(name, "added");

    setName("");
    setGrossIncome("");
    setGrowth("");
    setStartAge("");
    setEndAge("");
    setLinked401kId("");
  };

  return (
    <div className="form-panel">

      <FormHeader icon={<Handbag/>} title={"Add Salary Income"} desc={"Track your employment income and annual growth rate."}/>
      
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

            <div className="form-field">
              <label className="form-label">Annual Gross Income</label>
              <FormDollarInput value={grossIncome} onChange={setGrossIncome} placeholder="120,000" required />
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-input form-input-has-suffix" placeholder="3" type="number" step="0.1" />
                <span className="form-input-suffix-label">%</span>
              </div>
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

            <LinkCard
              title="Link to a 401(k) Account"
              sub="Sync this item with a retirement account"
              items={available401ks}
              emptyMessage="No 401(k) accounts available."
              selectedId={linked401kId}
              onSelect={handle401kSelect}
              isItemDisabled={(acc) => Boolean(acc.linked_income_id)}
              error={linkError}
              syncedLabel={available401ks.find((a) => a.id === linked401kId)?.name}
            />
          </div>
        </div>

        <FormSubmitButton label="Add Salary" />
      </form>
    </div>
  );
}

export function HourlyWageForm({ dispatch, state, onToast }) {
  const [name, setName] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [growth, setGrowth] = useState("");
  const [linked401kId, setLinked401kId] = useState("");
  const [linkError, setLinkError] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;

  const handle401kSelect = (accountId: string) => {
    setLinkError("");

    if (!accountId) {
      setLinked401kId("");
      return;
    }

    const selectedAccount = available401ks.find((acc) => acc.id === accountId);

    if (selectedAccount?.linked_income_id) {
      setLinkError("This 401(k) is already linked to another job.");
      setLinked401kId("");
      return;
    }

    setLinked401kId(accountId);
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

    const newIncomeId = crypto.randomUUID();

    if (linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

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

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "hourly",
        id: newIncomeId,
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        hourly_rate: Number(hourlyRate),       
        hours_per_week: Number(hoursPerWeek),  
        gross_income: Number(annualIncome),
        income_growth: Number(growth)/100,
        linked_401k_id: linked401kId || undefined,
      },
    });

    onToast(name, "added");

    setName("");
    setStartAge("");
    setEndAge("");
    setHourlyRate("");
    setHoursPerWeek("");
    setGrowth("");
    setLinked401kId("");
  };

  return (
    <div className="form-panel">
      <FormHeader icon={<Clock/>} title={"Add Hourly Wage Income"} desc={"Track hourly income, weekly hours, and projected growth."}/>

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

            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <FormDollarInput value={hourlyRate} onChange={setHourlyRate} placeholder="25" suffix="/hr" />
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(hoursPerWeek)} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="form-input form-input-has-suffix" placeholder="40" type="text" />
                <span className="form-input-suffix-label">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input-has-suffix" placeholder="3" type="text" step="0.1" />
                <span className="form-input-suffix-label">%</span>
              </div>
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

            <LinkCard
              title="Link to a 401(k) Account"
              sub="Sync this item with a retirement account"
              items={available401ks}
              emptyMessage="No 401(k) accounts available."
              selectedId={linked401kId}
              onSelect={handle401kSelect}
              isItemDisabled={(acc) => Boolean(acc.linked_income_id)}
              error={linkError}
              syncedLabel={available401ks.find((a) => a.id === linked401kId)?.name}
            />

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><CircleDollarSign/></span>
                <span className="preview-card-label">Estimated Annual Income</span>
              </div>
              <div className="preview-card-amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <FormSubmitButton label="Add Hourly Income" />
      </form>
    </div>
  );
}

export function SideHustleForm({ dispatch,state, onToast }) {
  const [name, setName] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [averageIncome, setAverageIncome] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [variability, setVariability] = useState("5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
        
            if (timeline.invalid) {
                return;
            }

    dispatch({
      type: "ADD_INCOME",
      payload: {
        source_type: "income",
        variant: "side",
        id: crypto.randomUUID(),
        name: name || "Side Hustle",
        start_age: timeline.start,
        end_age: timeline.end,
        gross_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });

    onToast(name, "added");

    setName("");
    setStartAge("");
    setEndAge("");
    setAverageIncome("");
    setFrequency("monthly");
    setVariability("5");
  };

  return (
    <div className="form-panel">

      <FormHeader icon={<Rocket/>} title={"Add Side Hustle Income"} desc={"Track variable income with frequency and variability estimates."}/>

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

            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <FormDollarInput value={averageIncome} onChange={setAverageIncome} placeholder="500" />
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

            <FormSlider label="Income Variability" value={variability} onChange={setVariability} min={0} max={50} step={0.1} prefix="±" />
            <p className="preview-card-sub">
              Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
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

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><CircleDollarSign/></span>
                <span className="preview-card-label">Estimated Annual Income</span>
              </div>
              <div className="preview-card-amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Add Side Hustle" />
      </form>
    </div>
  );
}

/* -------------------- EDIT INCOME FORMS -------------------- */

export function EditSalaryForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [grossIncome, setGrossIncome] = useState(item.gross_income.toString());
  const [growth, setGrowth] = useState((item.income_growth*100).toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");
  const [linkError, setLinkError] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];
  const isAlreadyLinked = !!item.linked_401k_id;

  const handle401kSelect = (accountId: string) => {
    setLinkError("");

    if (!accountId) {
      setLinked401kId("");
      return;
    }

    const selectedAccount = available401ks.find((acc) => acc.id === accountId);

    if (selectedAccount?.linked_income_id) {
      setLinkError("This 401(k) is already linked to another job.");
      setLinked401kId("");
      return;
    }

    setLinked401kId(accountId);
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

    const updatedIncome = {
      ...item,
      name,
      start_age: timeline.start,
      end_age: timeline.end,
      gross_income: Number(grossIncome),
      income_growth: Number(growth)/100,
      linked_401k_id: linked401kId || undefined,
    };

    // Only handle linking if this job wasn't previously linked
    // (If it was linked, user must delete and recreate to change the link)
    if (!isAlreadyLinked && linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (selectedAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...selectedAccount,
            linked_income_id: item.id,
          },
        });
      }
    }

    dispatch({
      type: "UPDATE_INCOME",
      payload: updatedIncome,
    });

    onToast(name, "edited");

    onClose();
  };

  return (
    <div className="form-panel">
      <FormHeader icon={<Handbag/>} title={"Edit Salary Income"} desc={"Update your employment income and growth details."}/>

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

            <div className="form-field">
              <label className="form-label">Annual Gross Income</label>
              <FormDollarInput value={grossIncome} onChange={setGrossIncome} placeholder="120,000" />
            </div>

            {/* Annual Growth */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>

              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input-has-suffix" placeholder="3" type="text" step="0.1" />

                <span className="form-input-suffix-label">%</span>
              </div>
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

            <LinkCard
              title="Link to a 401(k) Account"
              sub="Sync this item with a retirement account"
              items={available401ks}
              emptyMessage="No 401(k) accounts available."
              selectedId={linked401kId}
              onSelect={handle401kSelect}
              isItemDisabled={(acc) => Boolean(acc.linked_income_id)}
              error={linkError}
              syncedLabel={available401ks.find((a) => a.id === linked401kId)?.name}
            />
          </div>
        </div>

        <FormSubmitButton label="Update Salary" />
      </form>
    </div>
  );
}

export function EditHourlyWageForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [hourlyRate, setHourlyRate] = useState(item.hourly_rate?.toString() || "");
  const [hoursPerWeek, setHoursPerWeek] = useState(item.hours_per_week?.toString() || "");
  const [growth, setGrowth] = useState((item.income_growth*100).toString());
  const [linked401kId, setLinked401kId] = useState(item.linked_401k_id || "");
  const [linkError, setLinkError] = useState("");

  const available401ks = state?.accounts?.employer_retirement || [];
  const annualIncome = (Number(hourlyRate) || 0) * (Number(hoursPerWeek) || 0) * 52;

  const isAlreadyLinked = !!item.linked_401k_id;

  const handle401kSelect = (accountId: string) => {
    setLinkError("");

    if (!accountId) {
      setLinked401kId("");
      return;
    }

    const selectedAccount = available401ks.find((acc) => acc.id === accountId);

    if (selectedAccount?.linked_income_id) {
      setLinkError("This 401(k) is already linked to another job.");
      setLinked401kId("");
      return;
    }

    setLinked401kId(accountId);
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

    const updatedIncome = {
      ...item,
      name,
      start_age: timeline.start,
      end_age: timeline.end,
      hourly_rate: Number(hourlyRate),          
      hours_per_week: Number(hoursPerWeek),     
      gross_income: Number(annualIncome),
      income_growth: Number(growth)/100,
      linked_401k_id: linked401kId || undefined,
    };

    // Only handle linking if this job wasn't previously linked
    // (If it was linked, user must delete and recreate to change the link)
    if (!isAlreadyLinked && linked401kId) {
      const selectedAccount = available401ks.find((acc) => acc.id === linked401kId);

      if (selectedAccount) {
        dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            ...selectedAccount,
            linked_income_id: item.id,
          },
        });
      }
    }

    dispatch({
      type: "UPDATE_INCOME",
      payload: updatedIncome,
    });

    onToast(name, "edited");

    onClose();
  };

  return (
    <div className="form-panel">
      <FormHeader icon={<Clock/>} title={"Edit Hourly Wage Income"} desc={"Update hourly rate, weekly hours, and growth details."}/>

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

            <div className="form-field">
              <label className="form-label">Hourly Rate</label>
              <FormDollarInput value={hourlyRate} onChange={setHourlyRate} placeholder="25" suffix="/hr" />
            </div>

            {/* Hours Per Week */}
            <div className="form-field">
              <label className="form-label">Hours Per Week</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(hoursPerWeek)} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="form-input form-input-has-suffix" placeholder="40" type="text" />
                <span className="form-input-suffix-label">hrs/wk</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="form-field">
              <label className="form-label">Annual Growth Rate</label>
              <div className="form-input-wrap">
                <input value={formatNumberWithCommas(growth)} onChange={(e) => handleNumberInput(e, setGrowth)} className="form-input form-input-has-suffix" placeholder="3" type="text" step="0.1" />
                <span className="form-input-suffix-label">%</span>
              </div>
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

            {/* Link to 401k card */}
            <LinkCard
              title="Link 401(k) Account"
              sub="Connect this job to a retirement account"
              items={available401ks}
              emptyMessage="No 401(k) accounts available."
              selectedId={linked401kId}
              onSelect={handle401kSelect}
              isItemDisabled={(acc) => Boolean(acc.linked_income_id)}
              error={linkError}
              isLocked={isAlreadyLinked}
              lockedLabel={available401ks.find((a) => a.id === linked401kId)?.name}
              lockedSubMessage="Delete the linked account to reassign"
              syncedLabel={available401ks.find((a) => a.id === linked401kId)?.name}
            />

            {/* Annual Income Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><CircleDollarSign/></span>
                <span className="preview-card-label">Estimated Annual Income</span>
              </div>
              <div className="preview-card-amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${(Number(hourlyRate) || 0).toLocaleString()}/hr × {(Number(hoursPerWeek) || 0).toLocaleString()} hrs/week
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Update Hourly Income" />
      </form>
    </div>
  );
}

export function EditSideHustleForm({ item, dispatch,state, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [averageIncome, setAverageIncome] = useState(item.average_income_per_period?.toString() || "");
  const [frequency, setFrequency] = useState(item.frequency || "monthly");
  const [variability, setVariability] = useState((item.variability * 100)?.toString() || "5");

  const frequencyMultiplier = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1 }[frequency] || 12;
  const annualIncome = Number(averageIncome) * frequencyMultiplier;
  const variabilityPercent = Number(variability) || 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
        
            if (timeline.invalid) {
                return;
            }

    dispatch({
      type: "UPDATE_INCOME",
      payload: {
        ...item,
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        gross_income: annualIncome,
        variability: Number(variability) / 100,
        frequency: frequency,
        average_income_per_period: Number(averageIncome),
      },
    });

    onToast(name, "edited");

    onClose();
  };

  return (
    <div className="form-panel">
      <FormHeader icon={<Rocket/>} title={"Edit Side Hustle Income"} desc={"Update frequency, variability, and income details."} />

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

            <div className="form-field">
              <label className="form-label">Average Income Per Period</label>
              <FormDollarInput value={averageIncome} onChange={setAverageIncome} placeholder="500" />
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

            <FormSlider label="Income Variability" value={variability} onChange={setVariability} min={0} max={50} step={0.1} prefix="±" />
            <p className="preview-card-sub">
              Income fluctuates between ${(Number(averageIncome) * (1 - Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${(Number(averageIncome) * (1 + Number(variability) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
            />

            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><CircleDollarSign/></span>
                <span className="preview-card-label">Estimated Annual Income</span>
              </div>
              <div className="preview-card-amount">
                ${annualIncome.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
                ${(Number(averageIncome) || 0).toLocaleString()} {frequency}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Update Side Hustle" />
      </form>
    </div>
  );
}