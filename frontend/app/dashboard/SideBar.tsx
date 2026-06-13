import "./styles/SideBar.css";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PieChart } from 'lucide-react';

export default function SideBar({setIsFeedbackOpen}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <aside className={`dash-sidebar${sidebarCollapsed ? " dash-sidebar-collapsed" : ""}`}>
            <div className="dash-sidebar-inner">

            <div className="dash-sidebar-header">
                <div className={`dash-logo${sidebarCollapsed ? " dash-logo-hidden" : ""}`}>
                    <Image src="/temp/firephin-logo-no-bg.png" alt="Vantage" width={80} height={28} className="dash-logo-img" priority />
                </div>
                <button type="button" className="dash-collapse-btn" onClick={() => setSidebarCollapsed(c => !c)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    <svg className={`dash-collapse-icon${sidebarCollapsed ? " dash-collapse-icon-flipped" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            <nav className="dash-nav" aria-label="Dashboard navigation">
                <Link href="/dashboard" className="dash-nav-item" title="Dashboard">
                    <span className="dash-nav-icon"><PieChart /></span> 
                    <span className="dash-nav-label">Dashboard</span>
                </Link>
            </nav>

            <button type="button" className="dash-feedback-card" onClick={() => setIsFeedbackOpen(true)} title="Leave feedback">
                <span className="dash-feedback-icon">✦</span>
                <span className="dash-feedback-copy">
                    <strong>Leave feedback</strong>
                    <p>Help us improve Vantage</p>
                </span>
            </button>
            </div>

            {/* Mobile bar */}
            <div className="dash-mobile-bar">
                <Image src="/temp/firephin-logo-no-bg.png" alt="Vantage" width={120} height={34} className="dash-logo-img" priority />
                <button type="button" className="dash-mobile-menu-btn" onClick={() => setMobileNavOpen(o => !o)} aria-label={mobileNavOpen ? "Close menu" : "Open menu"} aria-expanded={mobileNavOpen} >
                    <span className={`dash-mobile-menu-icon${mobileNavOpen ? " dash-mobile-menu-icon-open" : ""}`} />
                </button>
            </div>

            {mobileNavOpen && (
            <div className="dash-mobile-dropdown">
                <nav className="dash-mobile-nav">
                    <Link href="/dashboard" className="dash-nav-item" onClick={() => setMobileNavOpen(false)}>
                        <span className="dash-nav-icon"><PieChart /></span>
                        <span className="dash-nav-label">Dashboard</span>
                    </Link>
                </nav>
                <button type="button" className="dash-feedback-card" onClick={() => { setIsFeedbackOpen(true); setMobileNavOpen(false); }} >
                    <span className="dash-feedback-icon">✦</span>
                    <span className="dash-feedback-copy">
                        <strong>Leave feedback</strong>
                        <p>Help us improve Vantage</p>
                    </span>
                </button>
            </div>
            )}
      </aside>
    )   
}