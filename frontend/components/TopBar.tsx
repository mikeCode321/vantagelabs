"use client";

import { useState, useEffect, useRef } from "react";
import "./styles/TopBar.css";
import Image from "next/image";
import Link from "next/link";

const calculatorLinks = [
  { label: "Mortgage Calculator", href: "/calculators/mortgage" },
  { label: "Retirement Calculator", href: "/calculators/retirement" },
  { label: "FIRE Calculator", href: "/calculators/fire" },
  { label: "Savings Calculator", href: "/calculators/savings" },
];

function NavDropdown({
  label,
  links,
}: {
  label: string;
  links: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="landing-nav-dropdown">
      <button
        type="button"
        className="landing-nav-link landing-nav-dropdown-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="landing-nav-dropdown-menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-nav-dropdown-item"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileDropdown({
  label,
  links,
  onNavigate,
}: {
  label: string;
  links: { label: string; href: string }[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="landing-mobile-menu-dropdown">
      <button
        type="button"
        className="landing-mobile-menu-link landing-mobile-menu-dropdown-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {label}
        <span className="landing-mobile-menu-dropdown-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="landing-mobile-menu-dropdown-list">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-mobile-menu-link landing-mobile-menu-link--sub"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-header-left">
          <Link href="/" className="landing-logo" aria-label="Firephin home">
            <Image src="/temp/firephin-logo-no-bg.png" alt="Firephin" className="landing-logo-mark" width={72}  height={72} priority/>
            <span className="landing-logo-text">
              <span className="landing-logo-fire">fire</span>
              <span className="landing-logo-phin">phin</span>
            </span>
          </Link>

          <nav className="landing-nav" aria-label="Primary">
            <NavDropdown label="Calculators" links={calculatorLinks} />
            <Link href="/blog" className="landing-nav-link">
              Blog
            </Link>
          </nav>
        </div>

        <Link href="/dashboard" className="landing-try-btn">
          Try Now
        </Link>

        <button
          type="button"
          className="landing-mobile-toggle"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span className="landing-mobile-toggle-bar" />
          <span className="landing-mobile-toggle-bar" />
          <span className="landing-mobile-toggle-bar" />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`landing-mobile-menu${menuOpen ? " landing-mobile-menu--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="landing-mobile-menu-header">
          <span className="landing-mobile-menu-title">Menu</span>
          <button
            type="button"
            className="landing-mobile-menu-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="landing-mobile-menu-nav" aria-label="Mobile">
          <Link href="/dashboard" className="landing-mobile-menu-link" onClick={closeMenu}>
            Dashboard
          </Link>
          <MobileDropdown
            label="Calculators"
            links={calculatorLinks}
            onNavigate={closeMenu}
          />
          <Link href="/blog" className="landing-mobile-menu-link" onClick={closeMenu}>
            Blog
          </Link>
        </nav>
      </div>

      {menuOpen && (
        <div className="landing-mobile-overlay" onClick={closeMenu} aria-hidden="true" />
      )}
    </header>
  );
}