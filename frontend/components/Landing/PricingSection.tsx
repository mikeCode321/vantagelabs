import "./PricingSection.css";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Great for exploring the platform and testing the simulator.",
    features: [
      "Basic financial simulation",
      "Starter dashboard access",
      "Limited scenario testing",
      "Community support",
    ],
    buttonText: "Get Started",
    featured: false,
  },
  {
    name: "Monthly",
    price: "$10",
    period: "/month",
    description: "Perfect for consistent planning and deeper simulation use.",
    features: [
      "Full simulation access",
      "Advanced dashboard tools",
      "Scenario comparison",
      "Priority support",
    ],
    buttonText: "Choose Monthly",
    featured: true,
  },
  {
    name: "Yearly",
    price: "$60",
    period: "/year",
    description: "Best value for long-term users who want the full experience.",
    features: [
      "Everything in Monthly",
      "Lower annual cost",
      "Full feature access",
      "Priority support",
    ],
    buttonText: "Choose Yearly",
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section className="pricing-section">
      <div className="pricing-inner">
        <div className="pricing-header">
          <p className="pricing-eyebrow">Pricing</p>
          <h2 className="pricing-title">Choose your plan</h2>
          <p className="pricing-subtitle">
            Start free, upgrade monthly, or save with yearly access.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`}
            >
              <div className="pricing-card-top">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price-row">
                  <span className="plan-price">{plan.price}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button type="button" className="plan-button">
                {plan.buttonText}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}