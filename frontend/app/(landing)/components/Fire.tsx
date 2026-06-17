import Image from "next/image";
import "../styles/Fire.css";

export default function FireCta() {
  return (
    <section className="landing-fire-cta">
      <div className="landing-fire-cta-inner">
        <h2 className="landing-fire-title">
          Financial Independence,
          <span>Retire Early</span>
        </h2>

        <a href="/dashboard" className="landing-fire-btn">
          Get Started
        </a>

        <div className="landing-fire-mascot-wrap">
          <Image
            src="/temp/mascot-fixed-fin.png"
            alt="FirePhin mascot"
            width={260}
            height={260}
            className="landing-fire-mascot"
          />
        </div>
      </div>
    </section>
  );
}