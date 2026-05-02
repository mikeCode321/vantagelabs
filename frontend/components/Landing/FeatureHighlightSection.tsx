// @ts-ignore: CSS import side effect declaration
import "./FeatureHighlightSection.css";

const features = [
  {
    eyebrow: "OPTIMIZE EXPENSES",
    title: "Find better ways to spend",
    description:
      "Vantage helps identify unnecessary spending across subscriptions, insurance, and recurring bills, then points you toward smarter ways to lower your monthly costs.",
  },
  {
    eyebrow: "VISUALIZE YOUR LIFESTYLE",
    title: "See where your money is really going",
    description:
      "Turn your income, spending, assets, and goals into clear charts that show how your lifestyle changes over time.",
  },
  {
    eyebrow: "CROSS-SIMULATION",
    title: "Compare different versions of your future",
    description:
      "Run multiple scenarios side by side — buying a home, investing more, changing income, or cutting expenses — and see which path gives you the strongest outlook.",
  },
  {
    eyebrow: "AI OUTLOOK",
    title: "Get an agentic view of your plan",
    description:
      "Vantage can analyze your simulation, highlight risks and opportunities, and explain what changes could improve your long term financial path.",
  },
];

export default function FeatureHighlightsSection() {
  return (
    <section className="features-section">
      <div className="features-inner">
        {features.map((feature, index) => (
          <div
            className={`feature-row ${index % 2 === 1 ? "feature-row-reverse" : ""}`}
            key={feature.eyebrow}
          >
            <div className="feature-copy">
              <p className="feature-eyebrow">{feature.eyebrow}</p>
              <h2 className="feature-title">{feature.title}</h2>
              <p className="feature-description">{feature.description}</p>
            </div>

            <div className="feature-visual">
              <div className="feature-placeholder">
                <span>Feature preview</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}