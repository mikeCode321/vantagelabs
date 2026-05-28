"use client";
import { useState } from "react";
import "./TutorialSteps.css";

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



function WelcomeScreen({ onSkip, onGetStarted }) {
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
        Lets set things up so your simulation reflects your real situation.
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
        <button
          type="button"
          className="ts-btn ts-btn--ghost"
          onClick={onSkip}
        >
          Skip for now
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
          {mode === "skipped"
            ? "You can always update these in Settings."
            : "Your data stays local — nothing is sent to a server."}
        </p>
      </div>
    </div>
  );
}
type TutorialScreen = "welcome" | "profile";

export function TutorialOnboarding({ onSkip, onProfileComplete }) {
  const [screen, setScreen] = useState<TutorialScreen>("welcome");
  const [tutorialMode, setTutorialMode] = useState<TutorialMode>("full");

  const handleGetStarted = () => {
    setTutorialMode("full");
    setScreen("profile");
  };

  const handleSkip = () => {
    setTutorialMode("skipped");
    setScreen("profile");
  };

  const handleProfileComplete = (profile: UserProfile, mode: TutorialMode) => {
    onProfileComplete(profile, mode);
  };

  return (
    <div className="ts-overlay">
      <div className="ts-modal">
        <div className="ts-modal__corner ts-modal__corner--tl" />
        <div className="ts-modal__corner ts-modal__corner--br" />

        {screen === "welcome" && (
          <WelcomeScreen
            onSkip={handleSkip}
            onGetStarted={handleGetStarted}
          />
        )}

        {screen === "profile" && (
          <ProfileSetupScreen
            onBack={() => setScreen("welcome")}
            onComplete={handleProfileComplete}
            mode={tutorialMode}
          />
        )}
      </div>
    </div>
  );
}

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Vantage",
    description: "Let's get you set up.",
  },
];

type TutorialStepsShellProps = {
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onProfileComplete: (profile: UserProfile, mode: TutorialMode) => void;
};

export function TutorialStepsShell({ onSkip, onFinish, }: TutorialStepsShellProps) {
  const handleProfileComplete = (_profile: UserProfile, mode: TutorialMode) => {
    if (mode === "skipped") {
      onSkip();
    } else {
      onFinish();
    }
  };

  return (
    <TutorialOnboarding
      onSkip={onSkip}
      onProfileComplete={handleProfileComplete}
    />
  );
}