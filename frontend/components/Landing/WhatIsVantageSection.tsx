// @ts-ignore: CSS import side effect declaration
import "./WhatIsVantageSection.css";

export default function WhatIsVantageSection() {
  return (
    <section className="what-section">
      <div className="what-inner">
        <p className="what-eyebrow">WHAT IS VANTAGE?</p>

        <h2 className="what-title">
          A clearer way to see your financial future
        </h2>

        <p className="what-description">
        Vantage turns your finances into a living simulator. Add your income,
        expenses, assets, debts, and goals, then see how today’s decisions could
        shape tomorrow’s reality.
        </p>

        <p className="what-description">
        Test scenarios, compare paths, and understand the impact of moves like buying
        a home, selling an asset, changing income, or investing more.
        </p>

        <div className="what-video-placeholder">
          <div className="what-play-button">▶</div>
          <p>Product demo coming soon</p>
        </div>
      </div>
    </section>
  );
}