import Image from "next/image";
import "../styles/DashboardShowcase.css";

import LandingFloatingImage from "./FloatingImage";

export default function LandingDashboardShowcase() {
  return (
    <section className="landing-showcase">
      <div className="landing-showcase-inner">
        <div className="landing-showcase-copy">

          <h1 className="landing-title">
            See your full financial
            <span> picture at a glance</span>
          </h1>

          <p className="landing-subtitle">
            The simple, smart, and effective way to plan your financial future.
          </p>
        </div>

        <div className="landing-showcase-stage">
        <div className="landing-orb landing-orb--left" />
        <div className="landing-orb landing-orb--right" />

        <div className="landing-showcase-rail landing-showcase-rail--left">
            <LandingFloatingImage
            src="/temp/ending-net-worth.png"
            alt="Ending net worth projection"
            width={360}
            height={170}
            className="landing-float-ending"
            />

            <LandingFloatingImage
            src="/temp/cagr.png"
            alt="CAGR net worth metric"
            width={360}
            height={170}
            className="landing-float-cagr"
            />

            <LandingFloatingImage
            src="/temp/peak-net-worth.png"
            alt="Peak net worth metric"
            width={360}
            height={170}
            className="landing-float-peak"
            />
        </div>

        <div className="landing-showcase-center">
            <div className="landing-dashboard-frame">
            <Image
                src="/temp/dashboard-mockup.png"
                alt="Fire Phin dashboard preview"
                width={1180}
                height={720}
                className="landing-dashboard-image"
                priority
            />
            </div>
        </div>

        <div className="landing-showcase-rail landing-showcase-rail--right">
            <LandingFloatingImage
            src="/temp/max-drawdown.png"
            alt="Max drawdown metric"
            width={360}
            height={170}
            className="landing-float-drawdown"
            />

            <LandingFloatingImage
            src="/temp/overview.png"
            alt="Everything in one place summary"
            width={360}
            height={520}
            className="landing-float-everything"
            />

            <Image
            src="/temp/mascot-looking-up.png"
            alt="Fire Phin dolphin mascot"
            width={220}
            height={220}
            className="landing-mascot"
            />
        </div>
        </div>

        <div className="landing-showcase-actions">
          <a href="/visuals" className="landing-primary-btn">
            Start Your Free Simulation
            <span aria-hidden="true">→</span>
          </a>

          <p>No credit card required</p>
        </div>
      </div>
    </section>
  );
}