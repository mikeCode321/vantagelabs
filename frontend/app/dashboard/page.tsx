"use client";
import "./dashboard.css";
import { useState } from "react";
import CashOnHandCalc from "@/components/Dashboard/CashOnHandCalc/CashOnHandCalc";
import SimControls from "@/components/Dashboard/SimControls/SimControls";
// import <component> from "@/components/<component>";  placeholder for future components

const SIM_MAX = 40;

export default function Dashboard() {
  const [year, setYear] = useState(0);

  return (
    <div className="dash-root">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-mark">VL</span>
          <span className="dash-logo-text">VantageLabs</span>
        </div>
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item dash-nav-active">Overview</a>
          {/* <a href="#" className="dash-nav-item">Simulation</a>
          <a href="#" className="dash-nav-item">Assets</a>
          <a href="#" className="dash-nav-item">Scenarios</a>
          <a href="#" className="dash-nav-item">Reports</a> */}
        </nav>
        <div className="dash-sidebar-footer">
          <span className="dash-year-badge">FY 2025</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">

        {/* Top Bar */}
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">Financial Overview</h1>
            <p className="dash-page-sub">Stepwise simulation · Annual variables</p>
          </div>
          <div className="dash-topbar-right">
            <span className="dash-sim-badge">Sim: {SIM_MAX}yr</span>
          </div>
        </header>

        {/* Widget Grid */}
        <div className="dash-grid">

          {/* Row 1 — primary widgets */}
          <div className="dash-cell dash-cell-md">
            <CashOnHandCalc currentYear={year}/>
          </div>

          <div className="dash-cell dash-cell-md">
            {/* <NetWorthTracker /> */}
            <div className="dash-placeholder">Net Worth Tracker</div>
          </div>

          <div className="dash-cell dash-cell-sm">
            {/* <AssetAllocation /> */}
            <div className="dash-placeholder">Asset Allocation</div>
          </div>

          {/* Row 2 — wide widgets */}
          <div className="dash-cell dash-cell-lg">
            {/* <ScenarioTimeline /> */}
            <div className="dash-placeholder">Scenario Timeline</div>
          </div>

          <div className="dash-cell dash-cell-sm">
            {/* <SimulationControls /> */}
            {/* <div className="dash-placeholder">Simulation Controls</div> */}
            <SimControls max={SIM_MAX} year={year} onYearChange={setYear} />
          </div>

        </div>
      </main>
    </div>
  );
}