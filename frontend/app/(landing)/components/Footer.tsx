import Image from "next/image";
import "../styles/Footer.css";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
   
        <div className="landing-footer-bottom">
          <a href="/" className="landing-footer-brand" aria-label="FirePhin home">
            <Image
              src="/temp/firephin-logo-no-bg.png"
              alt="FirePhin"
              width={44}
              height={44}
              className="landing-footer-logo"
            />

            <span className="landing-footer-wordmark">
              <span>Fire</span>Phin
            </span>
          </a>

          <nav className="landing-footer-links" aria-label="Footer navigation">
            <a href="/dashboard">Dashboard</a>
            <a href="#privacy">Privacy</a>
          </nav>

          <p className="landing-footer-copy">
            © 2026 FirePhin. Built for smarter financial planning.
          </p>
        </div>
      </div>
    </footer>
  );
}