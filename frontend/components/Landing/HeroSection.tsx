import Image from "next/image";
// @ts-ignore: CSS import side effect declaration
import "./HeroSection.css";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-left">

          <h1 className="hero-title">
            Take Ad<span className="hero-accent">vantage</span> of your future
          </h1>

          <p className="hero-description">
           Simulate your future and take control of your finances with tools
           that turns complex decisions into clear, visual outcomes.
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