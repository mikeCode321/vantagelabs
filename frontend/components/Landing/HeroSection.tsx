import Image from "next/image";
import "./HeroSection.css";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-left">
          <p className="hero-eyebrow">Financial Simulation Platform</p>

          <h1 className="hero-title">
            Take Ad<span className="hero-accent">vantage</span> of your future
          </h1>

          <p className="hero-description">
            Build smarter financial plans, visualize outcomes, and explore your
            future with a simulator designed to help you make clearer decisions.
          </p>

          <div className="hero-actions">
            <button type="button" className="hero-button hero-button-primary">
              Explore Demo
            </button>
            <button type="button" className="hero-button hero-button-secondary">
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-visual-card">
            <Image
              src="/dashboard-preview.png"
              alt="Financial simulator preview"
              width={700}
              height={500}
              className="hero-image"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}