import Image from "next/image";
import "./Navbar.css";


const navItems = ["Home", "Product", "Demo", "Pricing", "About"];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          

          <div className="brand-text">
            <span className="brand-top">Vantage</span>
            <span className="brand-main">Vantage Lab</span>
          </div>
        </div>

        <nav className="navbar-links">
          {navItems.map((item) => (
            <button key={item} type="button" className="nav-button">
              {item}
            </button>
          ))}
        </nav>

        <div className="navbar-actions">
          <button type="button" className="nav-button secondary-button">
            Sign In
          </button>
          <button type="button" className="nav-button primary-button">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}