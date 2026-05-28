"use client";

export type TutorialStep = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  meta?: string;
  icon?: string;
};

type TutorialStepsShellProps = {
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
};

export const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      eyebrow: "Step 1 of 6",
      title: "Welcome to Vantage",
      description:
        "Let’s go over how to start first simulation in just a few short steps.",
      bullets: [
        "Add your core financial inputs",
        "Link related items like house and mortgage",
        "Run your simulation and review the results",
      ],
      meta: "You can skip this tutorial anytime.",
      icon: "⌁",
    },
    {
      id: "checking",
      eyebrow: "Step 2 of 6",
      title: "Start with a checking account",
      description:
        "Add your first account to capture your starting cash balance and timeline.",
      bullets: [
        "Name your account",
        "Set your starting balance",
        "Define your start and end age",
      ],
      meta: "Interest tiers are optional for advanced detail.",
      icon: "🏦",
    },
    {
      id: "income",
      eyebrow: "Step 3 of 6",
      title: "Add your income",
      description:
        "Add a salary, hourly wage, or side hustle so we can project the money flowing into your plan.",
      bullets: [
        "Choose the income type",
        "Enter gross income",
        "Add annual growth assumptions",
      ],
      icon: "💼",
    },
    {
      id: "linking",
      eyebrow: "Step 4 of 6",
      title: "Link related items",
      description:
        "Some inputs work better when connected. Linking helps keep related financial items in sync.",
      bullets: [
        "Link jobs to retirement accounts",
        "Link houses to mortgages",
        "Link cars to car loans",
      ],
      meta: "You can still add items without linking when needed.",
      icon: "🔗",
    },
    {
      id: "expenses-assets",
      eyebrow: "Step 5 of 6",
      title: "Add expenses and assets",
      description:
        "Add bills, debt, homes, and vehicles to model what you spend and what you own.",
      bullets: [
        "Expenses represent money going out",
        "Assets represent things you own",
        "Some assets can be linked to loans",
      ],
      icon: "🏠",
    },
    {
      id: "results",
      eyebrow: "Step 6 of 6",
      title: "Run your simulation and review the results",
      description:
        "Click Run Simulation to generate your projection, then review the overview cards, chart, and highlights to understand your outlook.",
      bullets: [
        "Review top-level metrics",
        "Use the chart to understand trends",
        "Check highlights for key outcomes",
      ],
      icon: "📈",
    },
  ];

export function TutorialStepsShell({
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: TutorialStepsShellProps) {
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  if (!currentStep) return null;

  return (
    <div className="tutorial-overlay">
      <section className="tutorial-card">
        <button
          type="button"
          className="tutorial-close"
          onClick={onSkip}
          aria-label="Close tutorial"
        >
          ×
        </button>

        <div className="tutorial-progress">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={
                index <= currentStepIndex
                  ? "tutorial-progress-dot tutorial-progress-dot--active"
                  : "tutorial-progress-dot"
              }
            />
          ))}
        </div>

        <div className="tutorial-icon">
          {currentStep.icon ?? "⌁"}
        </div>

        <p className="tutorial-eyebrow">{currentStep.eyebrow}</p>

        <h2 className="tutorial-title">{currentStep.title}</h2>

        <p className="tutorial-description">{currentStep.description}</p>

        {currentStep.bullets && currentStep.bullets.length > 0 && (
          <div className="tutorial-bullets">
            {currentStep.bullets.map((bullet) => (
              <div key={bullet} className="tutorial-bullet">
                <span className="tutorial-bullet-icon">✓</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {currentStep.meta && (
          <p className="tutorial-meta">{currentStep.meta}</p>
        )}

        <div className="tutorial-footer">
          <button
            type="button"
            className="tutorial-skip"
            onClick={onSkip}
          >
            Skip tutorial
          </button>

          <div className="tutorial-actions">
            {!isFirstStep && (
              <button
                type="button"
                className="tutorial-btn tutorial-btn--secondary"
                onClick={onBack}
              >
                Back
              </button>
            )}

            <button
              type="button"
              className="tutorial-btn tutorial-btn--primary"
              onClick={isLastStep ? onFinish : onNext}
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}