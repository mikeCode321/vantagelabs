"use client";
import "./styles/TutorialSteps.css";

import { useState, useEffect } from "react";
import { CheckingAccountForm , EditCheckingAccountForm, EmployerRetirementAccountForm, EditEmployerRetirementAccountForm} from "@/app/dashboard/Accounts";
import { SalaryForm , EditSalaryForm} from "@/app/dashboard/Incomes";
import { Briefcase, Clock, DollarSign, House , Landmark, Lightbulb, Luggage} from "lucide-react";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household";

export type UserProfile = {
  current_age: number;
  retirement_age: number;
  filing_status: FilingStatus;
  state_of_residence: string;
};

export type TutorialMode = "full" | "skipped";

export const US_STATES = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" },
  { name: "District of Columbia", code: "DC" },
];

export const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string; description: string }[] = [
  {
    value: "single",
    label: "Single",
    description: "Unmarried or legally separated",
  },
  {
    value: "married_filing_jointly",
    label: "Married Filing Jointly",
    description: "Combined income with your spouse",
  },
  {
    value: "married_filing_separately",
    label: "Married Filing Separately",
    description: "Separate returns while married",
  },
  {
    value: "head_of_household",
    label: "Head of Household",
    description: "Unmarried with qualifying dependents",
  },
];

function TutorialProgress({ currentStepIndex, totalSteps }) {
    return (
      <div className="ts-step-progress">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span key={index} className={index === currentStepIndex ? "ts-step-progress-dot ts-step-progress-dot-active" : "ts-step-progress-dot"} />
        ))}
      </div>
    );
  }

function TutorialStepPanel({currentStepIndex, totalSteps, title, description, items = [], onBack, onNext, onSkip, className = '', nextDisabled = false,nextLabel, isMobileInfoOpen = false, onToggleInfo,  }) {
  const showSkip = currentStepIndex > 0; // hide skip on welcome
  const computedNextLabel =nextLabel ?? (currentStepIndex === totalSteps - 1 ? "Finish" : "Next");

  return (
    <aside className={`ts-step-panel ${className}`}>
      <button type="button" className="ts-step-close" onClick={onSkip}>×</button>

      {/* ── Desktop: progress + title + description + items as before ── */}
      <div className="ts-panel-desktop">
        <TutorialProgress currentStepIndex={currentStepIndex} totalSteps={totalSteps} />
        <p className="ts-step-count">Step {currentStepIndex + 1} of {totalSteps}</p>
        <h2 className="ts-step-title">{title}</h2>
        <p className="ts-step-description">{description}</p>
        {items && (
          <div className="ts-step-list">
            {items.map((item) => (
              <div className="ts-step-list-item" key={item.label}>
                <span className="ts-step-list-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile: compact header bar ── */}
      <div className="ts-panel-mobile">
        <div className="ts-panel-mobile-top">
          <div className="ts-panel-mobile-meta">
            <TutorialProgress currentStepIndex={currentStepIndex} totalSteps={totalSteps} />
            <p className="ts-step-count">Step {currentStepIndex + 1} of {totalSteps}</p>
            <h2 className="ts-step-title">{title}</h2>
          </div>
          {(description || items) && (
            <button
              type="button"
              className={`ts-info-toggle${isMobileInfoOpen ? " ts-info-toggle-open" : ""}`}
              onClick={onToggleInfo}
              aria-expanded={isMobileInfoOpen}
            >
              Tips
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {isMobileInfoOpen && (
          <div className="ts-panel-mobile-info">
            <p className="ts-step-description">{description}</p>
            {items && (
              <div className="ts-step-list">
                {items.map((item) => (
                  <div className="ts-step-list-item" key={item.label}>
                    <span className="ts-step-list-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Buttons — always visible ── */}
      <div className="ts-step-actions">
        <button type="button" className="ts-btn ts-btn-secondary" onClick={onBack}>
          Back
        </button>
        <div className={`ts-tooltip-wrap${nextDisabled ? " ts-tooltip-wrap-active" : ""}`}>
          <button type="button" className="ts-btn ts-btn-primary" onClick={onNext} disabled={nextDisabled}>
            {computedNextLabel}
          </button>
          {nextDisabled && (
            <span className="ts-tooltip" role="tooltip">
              You must add a checking account first
            </span>
          )}
        </div>
      </div>

      {showSkip && (
        <button type="button" className="ts-step-skip" onClick={onSkip}>
          Skip Tutorial
        </button>
      )}
    </aside>
  );
}


function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="ts-welcome">
      <div className="ts-welcome-wordmark">
        firephin
      </div>

      <p className="ts-welcome-tagline">
        Financial{" "}
        Independence.{" "}
        Retire{" "}
        Early.
      </p>

      <div className="ts-welcome-divider" />

      <p className="ts-welcome-body">
        Add your accounts, income, expenses, and assets, and see exactly
        where you'll land, from today through retirement.
      </p>

      <div className="ts-welcome-actions">
        <button
          type="button"
          className="ts-btn ts-btn-primary"
          onClick={onGetStarted}
        >
          Get Started
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ProfileSetupScreen({ onBack, onComplete, mode }) {
  const [currentAge, setCurrentAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("");
  const [filingStatus, setFilingStatus] = useState<FilingStatus | "">("");
  const [stateOfResidence, setStateOfResidence] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const ca = Number(currentAge);
    const ra = Number(retirementAge);

    if (!currentAge || isNaN(ca) || ca < 18 || ca > 80) {
      newErrors.currentAge = "Enter a valid age between 18–80";
    }
    if (!retirementAge || isNaN(ra) || ra < 40 || ra > 90) {
      newErrors.retirementAge = "Enter a valid retirement age between 40–90";
    }
    if (ca && ra && ra <= ca) {
      newErrors.retirementAge = "Retirement age must be greater than current age";
    }
    if (!filingStatus) {
      newErrors.filingStatus = "Select a filing status";
    }
    if (!stateOfResidence) {
      newErrors.stateOfResidence = "Select your state of residence";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onComplete(
      {
        current_age: Number(currentAge),
        retirement_age: Number(retirementAge),
        filing_status: filingStatus as FilingStatus,
        state_of_residence: stateOfResidence,
      },
      mode
    );
  };

  return (
    <div className="ts-profile">
      <div className="ts-profile-header">
        <button type="button" className="ts-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="ts-profile-step-label">Step 1 of 1</div>
      </div>

      <div className="ts-profile-title-block">
        <h2 className="ts-profile-title">Tell us about yourself</h2>
        <p className="ts-profile-subtitle">
          These assumptions shape every projection in your simulation. You can
          always update them later.
        </p>
      </div>

      <div className="ts-profile-form">

        <div className="ts-field-row">
          <div className={`ts-field ${errors.currentAge ? "ts-field-error" : ""}`}>
            <label className="ts-label">
              Current Age
              <span className="ts-label-hint">How old are you today?</span>
            </label>
            <div className="ts-input-wrapper">
              <input
                type="number"
                className="ts-input"
                placeholder="e.g. 28"
                min={18}
                max={80}
                value={currentAge}
                onChange={(e) => {
                  setCurrentAge(e.target.value);
                  setErrors((prev) => ({ ...prev, currentAge: undefined }));
                }}
              />
            </div>
            {errors.currentAge && (
              <span className="ts-field-error">{errors.currentAge}</span>
            )}
          </div>

          <div className="ts-field-row-sep">→</div>

          <div className={`ts-field ${errors.retirementAge ? "ts-field-error" : ""}`}>
            <label className="ts-label">
              Target Retirement Age
              <span className="ts-label-hint">When do you plan to retire?</span>
            </label>
            <div className="ts-input-wrapper">
              <input
                type="number"
                className="ts-input"
                placeholder="e.g. 65"
                min={40}
                max={90}
                value={retirementAge}
                onChange={(e) => {
                  setRetirementAge(e.target.value);
                  setErrors((prev) => ({ ...prev, retirementAge: undefined }));
                }}
              />
            </div>
            {errors.retirementAge && (
              <span className="ts-field-error">{errors.retirementAge}</span>
            )}
          </div>
        </div>
          

        <div className={`ts-field ${errors.filingStatus ? "ts-field-error" : ""}`}>
          <label className="ts-label">
            Filing Status
            <span className="ts-label-hint">Used to calculate your federal tax bracket</span>
          </label>
          <div className="ts-filing-grid">
            {FILING_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ts-filing-card ${filingStatus === opt.value ? "ts-filing-card-selected" : ""}`}
                onClick={() => {
                  setFilingStatus(opt.value);
                  setErrors((prev) => ({ ...prev, filingStatus: undefined }));
                }}
              >
                <span className="ts-filing-card-label">{opt.label}</span>
                <span className="ts-filing-card-desc">{opt.description}</span>
                {filingStatus === opt.value && (
                  <span className="ts-filing-card-check">✓</span>
                )}
              </button>
            ))}
          </div>
          {errors.filingStatus && (
            <span className="ts-field-error">{errors.filingStatus}</span>
          )}
        </div>

        {/* State of residence */}
        <div className={`ts-field ${errors.stateOfResidence ? "ts-field-error" : ""}`}>
          <label className="ts-label">
            State of Residence After Retirement
            <span className="ts-label-hint">Affects state income tax in the simulation</span>
          </label>
          <div className="ts-select-wrapper">
            <select
              className="ts-select"
              value={stateOfResidence}
              onChange={(e) => {
                setStateOfResidence(e.target.value);
                setErrors((prev) => ({ ...prev, stateOfResidence: undefined }));
              }}
            >
              <option value="">Select a state…</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <svg className="ts-select-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {errors.stateOfResidence && (
            <span className="ts-field-error">{errors.stateOfResidence}</span>
          )}
        </div>

      </div>

      <div className="ts-profile-actions">
        <button type="button" className="ts-btn ts-btn-primary" onClick={handleSubmit}>
          {mode === "full" ? "Continue to Setup" : "Go to Dashboard"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        <p className="ts-profile-skip-note">
          Your data stays local — nothing is sent to a server.
        </p>
      </div>
    </div>
  );
}

export function TutorialOnboarding({ state, dispatch, onComplete, onStepChange, onToast }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const step = tutorialSteps[currentStepIndex];
    const totalSteps = tutorialSteps.length;
    const isLastStep = currentStepIndex === totalSteps - 1;

    const next = () => setCurrentStepIndex(i => Math.min(i + 1, totalSteps - 1));
    const back = () => setCurrentStepIndex(i => Math.max(i - 1, 0));
    const finish = () => onComplete();
    const skip = () => onComplete();

    const handleProfileComplete = (profile, mode) => {
      dispatch({
        type: "UPDATE_USER_PROFILE",
        payload: {
          user_start_age: profile.current_age,
          user_retirement_age: profile.retirement_age,
          filing_status: profile.filing_status,
          state_of_residence: profile.state_of_residence,
        },
      });
      if (mode === "skipped") onComplete();
    };

    useEffect(() => {
      onStepChange?.(step.id);
    }, [step.id]);

    useEffect(() => {
      if (step.id === "expenses-assets") {
        document.querySelector(".entities-wrapper")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (step.id === "results") {
        document.querySelector(".overview-cards")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, [step.id]);

    if (!step) return null;

    const commonProps = {
      step,
      currentStepIndex,
      totalSteps,
      state,
      dispatch,
      onBack: back,
      onNext: isLastStep ? finish : next,
      onSkip: skip,
      onFinish: finish,
      onToast,
    };
        
    return (
      <>
        {step.id === "welcome" && (
          <div className="ts-overlay">
            <div className="ts-modal-welcome">
              <WelcomeScreen onGetStarted={next} />
            </div>
          </div>
        )}

        {step.id === "profile" && (
          <div className="ts-overlay">
            <div className="ts-modal">
              <ProfileSetupScreen
                onBack={back}
                onComplete={(profile) => {
                  handleProfileComplete(profile, "full");
                  next();
                }}
                mode="full"
              />
            </div>
          </div>
        )}

        {step.id === "checking" && (
          <div className="ts-overlay">
            <FormTutorialStep
              {...commonProps}
              items={[
                { icon: <House/>, label: "Name your account" },
                { icon: <DollarSign/>, label: "Set your starting balance" },
                { icon: <Clock/>, label: "Define your timeline" },
                { icon: <Landmark/>,  label: "Interest tiers are optional for advanced detail." },
              ]}
              existingItem={state.accounts.checking[0]}
              AddForm={CheckingAccountForm}
              EditForm={EditCheckingAccountForm}
              nextDisabled={!state.accounts.checking[0]}
            />
          </div>
        )}

        {step.id === "salary" && (
          <div className="ts-overlay">
            <FormTutorialStep
              {...commonProps}
              existingItem={state.incomes.salary[0]}
              AddForm={SalaryForm}
              EditForm={EditSalaryForm}
              nextLabel={state.incomes.salary[0] ? "Next" : "Skip"}
            />
          </div>
        )}

        {step.id === "retirement" && (
          <div className="ts-overlay">
            <FormTutorialStep
              {...commonProps}
              items={[
                { icon: <Luggage/>, label: "Connect retirement accounts to jobs." },
                { icon: <Briefcase/>, label: "Keep contribution assumptions tied to income." },
                { icon: <Lightbulb/>,  label: "The same idea applies to other linked simulator items." },
              ]}
              existingItem={state.accounts.employer_retirement[0]}
              AddForm={EmployerRetirementAccountForm}
              EditForm={EditEmployerRetirementAccountForm}
              nextLabel={state.accounts.employer_retirement[0] ? "Next" : "Skip"}
            />
          </div>
        )}

        {step.id === "expenses-assets" && (
          <div className="ts-overlay ts-overlay-no-bg">
            <ExpensesAssetsTutorialStep {...commonProps} />
          </div>
        )}

        {step.id === "results" && (
          <div className="ts-overlay ts-overlay-no-bg">
            <ResultsTutorialStep {...commonProps} />
          </div>
        )}
      </>
      
  )};

  function FormTutorialStep({ step, currentStepIndex, totalSteps, onBack, onNext, onSkip, onToast, items = [], existingItem, EditForm, AddForm, state, dispatch, nextDisabled = false, nextLabel, }) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    return (
      <div className="ts-modal ts-modal-split-step">
        <TutorialStepPanel
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          title={step.title}
          description={step.description}
          items={items}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          nextDisabled={nextDisabled}
          nextLabel= {nextLabel}
          isMobileInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen(o => !o)}
        />
        <section className="ts-tutorial-form">
          {existingItem
            ? <EditForm item={existingItem} state={state} dispatch={dispatch} onClose={onNext} onToast={onToast} />
            : <AddForm state={state} dispatch={dispatch} onClose={onNext} onToast={onToast} />
          }
        </section>
      </div>
    );
  }

  type ExpensesAssetsTutorialStepProps = {
    step: TutorialStep;
    currentStepIndex: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
  };
  
  function ExpensesAssetsTutorialStep({ step, currentStepIndex, totalSteps, onBack, onNext, onSkip,}: ExpensesAssetsTutorialStepProps) {
    return (
      <div className="ts-highlight-step">
        <div className="ts-highlight-card">
          <button type="button" className="ts-step-close" onClick={onSkip}>
            ×
          </button>
    
          <div className="ts-highlight-copy">
            <p className="ts-step-count">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
  
            <h2 className="ts-highlight-title">{step.title}</h2>
  
            <p className="ts-highlight-description">
              {step.description}
            </p>
  
            <p className="ts-highlight-description">
              Some assets can be linked to loans.
            </p>
          </div>
  
          <div className="ts-highlight-actions">
            <button
              type="button"
              className="ts-step-skip ts-highlight-skip"
              onClick={onSkip}
            >
              Skip tutorial
            </button>
  
            <button
              type="button"
              className="ts-btn ts-btn-secondary"
              onClick={onBack}
            >
              Back
            </button>
  
            <button
              type="button"
              className="ts-btn ts-btn-primary"
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  type ResultsTutorialStepProps = {
    step: TutorialStep;
    currentStepIndex: number;
    totalSteps: number;
    onBack: () => void;
    onFinish: () => void;
    onSkip: () => void;
  };
  
  function ResultsTutorialStep({ step, currentStepIndex, totalSteps, onBack, onFinish, onSkip,}: ResultsTutorialStepProps) {
    return (
      <div className="ts-results-side-step">
        <div className="ts-results-side-card">
          <button type="button" className="ts-step-close" onClick={onSkip}>×</button>
  
          {/* <div className="ts-results-logo">V</div> */}
          <p className="ts-step-count">Step {currentStepIndex + 1} of {totalSteps}</p>

          <h2 className="ts-results-title">{step.title}</h2>
          <p className="ts-results-description">{step.description}</p>
  
          <div className="ts-results-side-actions">
            <button type="button" className="ts-btn ts-btn-secondary" onClick={onBack}>
              Back
            </button>
  
            <button type="button" className="ts-btn ts-btn-primary" onClick={onFinish}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  type EmployerRetirementTutorialStepProps = {
    step: TutorialStep;
    currentStepIndex: number;
    totalSteps: number;
    state: any;
    dispatch: React.Dispatch<any>;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
    onToast?: (entityName: string, action: "added" | "edited" | "deleted") => void;
  };
  
  function EmployerRetirementTutorialStep({ step, currentStepIndex, totalSteps, state, dispatch, onBack, onNext, onSkip, onToast, }: EmployerRetirementTutorialStepProps) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const existingRetirementAccount = state.accounts.employer_retirement[0];
  
    return (
      <div className="ts-modal ts-modal-split-step">
        <TutorialStepPanel
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          title={step.title}
          description={step.description}
          items={[
            {
              icon: "🔗",
              label: "Connect retirement accounts to jobs.",
            },
            {
              icon: "💼",
              label: "Keep contribution assumptions tied to income.",
            },
            {
              icon: "⌁",
              label: "The same idea applies to other linked simulator items.",
            },
          ]}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          isMobileInfoOpen={isInfoOpen}        
          onToggleInfo={() => setIsInfoOpen(o => !o)}
        />
  
        <section className="ts-tutorial-form">
          {existingRetirementAccount ? (
            <EditEmployerRetirementAccountForm
              item={existingRetirementAccount}
              state={state}
              dispatch={dispatch}
              onClose={onNext}
              onToast={onToast}
            />
          ) : (
            <EmployerRetirementAccountForm
              state={state}
              dispatch={dispatch}
              onClose={onNext}
              onToast={onToast}
            />
          )}
        </section>
      </div>
    );
  }
  
  export type TutorialStepId = "welcome" | "profile" | "checking" | "salary" | "retirement" | "expenses-assets" | "results";

  export type TutorialStep = {
    id: TutorialStepId;
    title: string;
    description: string;
  };
  
  export const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to Vantage",
      description: "Your financial future, simulated.",
    },
    {
      id: "profile",
      title: "Tell us about yourself",
      description: "Set your age, retirement age, filing status, and state so Vantage can build your timeline.",
    },
    {
      id: "checking",
      title: "Start with a checking account",
      description: "Add your first account to capture your starting cash balance and timeline.",
    },
    {
        id: "salary",
        title: "Add your income",
        description: "Add a salary, hourly wage, or side hustle so Vantage can project the money flowing into your plan.",
    },
    {
        id: "retirement",
        title: "Link related items",
        description: "Link jobs to retirement accounts so contributions and assumptions stay in sync.",
      },
      {
        id: "expenses-assets",
        title: "Add expenses and assets",
        description: "These inputs work the same way. Add bills, debt, homes, and vehicles to model what you spend and what you own.",
      },
      {
        id: "results",
        title: "Run your simulation and review the results",
        description: "When you're ready click Run Simulation to generate your projection, then review the overview cards, chart, and highlights to understand your outlook.",
      },
  ];