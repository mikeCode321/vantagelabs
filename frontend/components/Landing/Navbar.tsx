"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./Navbar.css";

const navItems = ["Home", "Product", "Demo", "Pricing", "About"];

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`navbar ${!isVisible ? "navbar-hidden" : ""}`}>
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