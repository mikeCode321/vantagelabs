import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* CTA */}
        <div className="footer-cta">
          <h2>Start planning your future</h2>
          <div className="footer-cta-actions">
            <button className="footer-btn primary">Get Started</button>
            <button className="footer-btn secondary">Give Feedback</button>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Links */}
        <div className="footer-links">

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Simulator</a>
            <a href="#">Roadmap</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Careers</a>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Docs</a>
            <a href="#">Guides</a>
            <a href="#">FAQ</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
          </div>

        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Vantage. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}