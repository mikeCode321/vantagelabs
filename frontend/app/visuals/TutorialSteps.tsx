"use client";
import { useState } from "react";
import "./TutorialSteps.css";
import { CheckingAccountForm , EditCheckingAccountForm, EmployerRetirementAccountForm, EditEmployerRetirementAccountForm} from "@/app/visuals/accounts";
import { SalaryForm , EditSalaryForm} from "@/app/visuals/incomes";

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

const US_STATES = [
  "California",
  "New York",
  "Michigan",
  "Texas",
  "Florida",
];

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string; description: string }[] = [
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
          <span
            key={index}
            className={
              index === currentStepIndex
                ? "ts-step-progress-dot ts-step-progress-dot--active"
                : "ts-step-progress-dot"
            }
          />
        ))}
      </div>
    );
  }

function TutorialStepPanel({
  currentStepIndex,
  totalSteps,
  title,
  description,
  image,
  items,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Next",
  showSkip = true,
  className = '',
  nextDisabled= false,
}) {
  return (
    <aside className={`ts-step-panel ${className}`}>
      <button type="button" className="ts-step-close" onClick={onSkip}>
        ×
      </button>

      <TutorialProgress
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
      />

      <p className="ts-step-count">
        Step {currentStepIndex + 1} of {totalSteps}
      </p>

      <h2 className="ts-step-title">{title}</h2>

      <p className="ts-step-description">{description}</p>

      {image && (
        <div className="ts-step-image-wrap">
          <img src={image} alt="" className="ts-step-image" />
        </div>
      )}

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

      <div className="ts-step-actions">
        <button type="button" className="ts-btn ts-btn--secondary" onClick={onBack}>
          Back
        </button>

        {/* if no checking account added yet disable this button and have a hover that displays a tool tip saying you must add a checking account  */}
        <div className={`ts-tooltip-wrap${nextDisabled ? " ts-tooltip-wrap--active" : ""}`}>
          <button type="button" className="ts-btn ts-btn--primary" onClick={onNext} disabled={nextDisabled} >
            {nextLabel}
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
          Skip
        </button>
      )}
    </aside>
  );
}



function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="ts-welcome">
      <div className="ts-welcome__badge">NEW TO VANTAGE</div>

      <div className="ts-welcome__wordmark">
        <span className="ts-welcome__wordmark-v">V</span>antage
      </div>

      <p className="ts-welcome__tagline">
        Your financial future, simulated.
      </p>

      <div className="ts-welcome__divider" />

      <p className="ts-welcome__body">
        Vantage models your financial life from today through retirement —
        accounts, income, expenses, and assets — and projects where you will end up.
        Let's set things up so your simulation reflects your real situation.
      </p>

      <div className="ts-welcome__features">
        <div className="ts-welcome__feature">
          <span className="ts-welcome__feature-icon">⌁</span>
          <span>Net worth projections</span>
        </div>
        <div className="ts-welcome__feature">
          <span className="ts-welcome__feature-icon">$</span>
          <span>Cash flow modeling</span>
        </div>
        <div className="ts-welcome__feature">
          <span className="ts-welcome__feature-icon">◔</span>
          <span>Retirement readiness</span>
        </div>
      </div>

      <div className="ts-welcome__actions">
        <button
          type="button"
          className="ts-btn ts-btn--primary"
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
      <div className="ts-profile__header">
        <button type="button" className="ts-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="ts-profile__step-label">Step 1 of 1</div>
      </div>

      <div className="ts-profile__title-block">
        <h2 className="ts-profile__title">Tell us about yourself</h2>
        <p className="ts-profile__subtitle">
          These assumptions shape every projection in your simulation. You can
          always update them later.
        </p>
      </div>

      <div className="ts-profile__form">

        <div className="ts-field-row">
          <div className={`ts-field ${errors.currentAge ? "ts-field--error" : ""}`}>
            <label className="ts-label">
              Current Age
              <span className="ts-label__hint">How old are you today?</span>
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

          <div className="ts-field-row__sep">→</div>

          <div className={`ts-field ${errors.retirementAge ? "ts-field--error" : ""}`}>
            <label className="ts-label">
              Target Retirement Age
              <span className="ts-label__hint">When do you plan to retire?</span>
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
            {currentAge && retirementAge && !errors.retirementAge && (
              <span className="ts-field-hint">
                {Number(retirementAge) - Number(currentAge)} years to retirement
              </span>
            )}
          </div>
        </div>

        <div className={`ts-field ${errors.filingStatus ? "ts-field--error" : ""}`}>
          <label className="ts-label">
            Filing Status
            <span className="ts-label__hint">Used to calculate your federal tax bracket</span>
          </label>
          <div className="ts-filing-grid">
            {FILING_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ts-filing-card ${filingStatus === opt.value ? "ts-filing-card--selected" : ""}`}
                onClick={() => {
                  setFilingStatus(opt.value);
                  setErrors((prev) => ({ ...prev, filingStatus: undefined }));
                }}
              >
                <span className="ts-filing-card__label">{opt.label}</span>
                <span className="ts-filing-card__desc">{opt.description}</span>
                {filingStatus === opt.value && (
                  <span className="ts-filing-card__check">✓</span>
                )}
              </button>
            ))}
          </div>
          {errors.filingStatus && (
            <span className="ts-field-error">{errors.filingStatus}</span>
          )}
        </div>

        {/* State of residence */}
        <div className={`ts-field ${errors.stateOfResidence ? "ts-field--error" : ""}`}>
          <label className="ts-label">
            State of Residence After Retirement
            <span className="ts-label__hint">Affects state income tax in the simulation</span>
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
                <option key={s} value={s}>
                  {s}
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

      <div className="ts-profile__actions">
        {mode === "full" ? (
          <button
            type="button"
            className="ts-btn ts-btn--primary"
            onClick={handleSubmit}
          >
            Continue to Setup
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="ts-btn ts-btn--primary"
            onClick={handleSubmit}
          >
            Go to Dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <p className="ts-profile__skip-note">
          Your data stays local — nothing is sent to a server.
        </p>
      </div>
    </div>
  );
}


type TutorialOnboardingProps = {
    steps: TutorialStep[];
    currentStepIndex: number;
    state: any;
    dispatch: React.Dispatch<any>;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
    onFinish: () => void;
    onProfileComplete: (profile: UserProfile, mode: TutorialMode) => void;
    onToast?: (entityName: string, action: "added" | "edited" | "deleted") => void;
  };
  
export function TutorialOnboarding({
    steps,
    currentStepIndex,
    state,
    dispatch,
    onNext,
    onBack,
    onSkip,
    onFinish,
    onProfileComplete,
    onToast,
  }: TutorialOnboardingProps) {
    const step = steps[currentStepIndex];
  
    if (!step) return null;
  
    const isLastStep = currentStepIndex === steps.length - 1;
  
    return (
      <div className="ts-overlay">
        {step.id === "welcome" && (
          <div className="ts-modal">
            <div className="ts-modal__corner ts-modal__corner--tl" />
            <div className="ts-modal__corner ts-modal__corner--br" />
  
            <WelcomeScreen onGetStarted={onNext} />
          </div>
        )}
  
        {step.id === "profile" && (
          <div className="ts-modal">
            <div className="ts-modal__corner ts-modal__corner--tl" />
            <div className="ts-modal__corner ts-modal__corner--br" />
  
            <ProfileSetupScreen
              onBack={onBack}
              onComplete={(profile) => {
                onProfileComplete(profile, "full");
                onNext();
              }}
              mode="full"
            />
          </div>
        )}
  
        {step.id === "checking" && (
          <CheckingAccountTutorialStep
            step={step}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            state={state}
            dispatch={dispatch}
            onBack={onBack}
            onNext={isLastStep ? onFinish : onNext}
            onSkip={onSkip}
            onToast={onToast}
          />

          
        )}
      
      
      {step.id === "salary" && (
        <SalaryIncomeTutorialStep
          step={step}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          state={state}
          dispatch={dispatch}
          onBack={onBack}
          onNext={isLastStep ? onFinish : onNext}
          onSkip={onSkip}
          onToast={onToast}
        />
      )}

        {step.id === "retirement" && (
        <EmployerRetirementTutorialStep
            step={step}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            state={state}
            dispatch={dispatch}
            onBack={onBack}
            onNext={isLastStep ? onFinish : onNext}
            onSkip={onSkip}
            onToast={onToast}
        />
        )}

        {step.id === "expenses-assets" && (
        <ExpensesAssetsTutorialStep
            step={step}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            onBack={onBack}
            onNext={isLastStep ? onFinish : onNext}
            onSkip={onSkip}
        />
        )}
      </div>
  )};

  type CheckingAccountTutorialStepProps = {
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

  function CheckingAccountTutorialStep({
    step,
    currentStepIndex,
    totalSteps,
    state,
    dispatch,
    onBack,
    onNext,
    onSkip,
    onToast,
  }: CheckingAccountTutorialStepProps) {
    const existingCheckingAccount = state.accounts.checking[0];
    return (
      <div className="ts-modal ts-modal--split-step">
        <TutorialStepPanel
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          title={step.title}
          description={step.description}
          items={[
            { icon: "🏦", label: "Name your account" },
            { icon: "💰", label: "Set your starting balance" },
            { icon: "📅", label: "Define your timeline" },
            {
              icon: "⌁",
              label: "Interest tiers are optional for advanced detail.",
            },
          ]}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          nextLabel={"Next"}
          showSkip={true}
          nextDisabled={!existingCheckingAccount}
        />
  
        <section className="ts-tutorial-form">
        {existingCheckingAccount ? (
          <EditCheckingAccountForm
            item={existingCheckingAccount}
            state={state}
            dispatch={dispatch}
            onClose={onNext}
            onToast={onToast}
          />
        ) : (
          <CheckingAccountForm
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

  type SalaryIncomeTutorialStepProps = {
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
  
  function SalaryIncomeTutorialStep({
    step,
    currentStepIndex,
    totalSteps,
    state,
    dispatch,
    onBack,
    onNext,
    onSkip,
    onToast,
  }: SalaryIncomeTutorialStepProps) {
    const existingSalaryIncome = state.incomes.salary[0];
  
    return (
      <div className="ts-modal ts-modal--split-step">
        <TutorialStepPanel
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          title={step.title}
          description={step.description}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          nextLabel="Next"
          showSkip={true}
        />
  
        <section className="ts-tutorial-form">
          {existingSalaryIncome ? (
            <EditSalaryForm
              item={existingSalaryIncome}
              state={state}
              dispatch={dispatch}
              onClose={onNext}
              onToast={onToast}
            />
          ) : (
            <SalaryForm
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

  type ExpensesAssetsTutorialStepProps = {
    step: TutorialStep;
    currentStepIndex: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
  };
  
  function ExpensesAssetsTutorialStep({
    step,
    currentStepIndex,
    totalSteps,
    onBack,
    onNext,
    onSkip,
  }: ExpensesAssetsTutorialStepProps) {
    return (
      <div className="ts-highlight-step">
        <div className="ts-highlight-card">
          <button type="button" className="ts-highlight-close" onClick={onSkip}>
            ×
          </button>
  
          <div className="ts-highlight-logo">V</div>
  
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
              className="ts-btn ts-btn--secondary"
              onClick={onBack}
            >
              Back
            </button>
  
            <button
              type="button"
              className="ts-btn ts-btn--primary"
              onClick={onNext}
            >
              Next
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
  
  function EmployerRetirementTutorialStep({
    step,
    currentStepIndex,
    totalSteps,
    state,
    dispatch,
    onBack,
    onNext,
    onSkip,
    onToast,
  }: EmployerRetirementTutorialStepProps) {
    const existingRetirementAccount = state.accounts.employer_retirement[0];
  
    return (
      <div className="ts-detached-step">
        <section className="ts-detached-form-card">
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
  
        <TutorialStepPanel
          className="ts-step-panel--floating"
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
          nextLabel="Next"
          showSkip={true}
        />
      </div>
    );
  }
  
  export type TutorialStepId = "welcome" | "profile" | "checking" | "salary" | "retirement" | "expenses-assets";

  export type TutorialStep = {
    id: TutorialStepId;
    title: string;
    description: string;
    targetSelector?: string;
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
      description:
        "Set your age, retirement age, filing status, and state so Vantage can build your timeline.",
    },
    {
      id: "checking",
      title: "Start with a checking account",
      description:
        "Add your first account to capture your starting cash balance and timeline.",
      targetSelector: "[data-tutorial='account-card']",
    },
    {
        id: "salary",
        title: "Add your income",
        description:
          "Add a salary, hourly wage, or side hustle so Vantage can project the money flowing into your plan.",
        targetSelector: "[data-tutorial='income-card']",
    },
    {
        id: "retirement",
        title: "Link related items",
        description:
          "Link jobs to retirement accounts so contributions and assumptions stay in sync.",
        targetSelector: "[data-tutorial='account-card']",
      },
      {
        id: "expenses-assets",
        title: "Add expenses and assets",
        description:
          "These inputs work the same way. Add bills, debt, homes, and vehicles to model what you spend and what you own.",
        targetSelector: "[data-tutorial='expense-card'], [data-tutorial='asset-card']",
      },
  ];

  type TutorialStepsShellProps = {
    steps: TutorialStep[];
    currentStepIndex: number;
    state: any;
    dispatch: React.Dispatch<any>;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
    onFinish: () => void;
    onProfileComplete: (profile: UserProfile, mode: TutorialMode) => void;
    onToast?: (entityName: string, action: "added" | "edited" | "deleted") => void;
  };
  
  export function TutorialStepsShell(props: TutorialStepsShellProps) {
    return <TutorialOnboarding {...props} />;
  }