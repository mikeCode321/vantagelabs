"use client";
import "./dashboard.css";
import { useState } from "react";
import CashOnHandCalc from "@/components/Dashboard/CashOnHandCalc/CashOnHandCalc";
import SimControls from "@/components/Dashboard/SimControls/SimControls";
import AssetPortfolio from "@/components/Dashboard/Assets/AssetPortfolio";
import { Asset } from "@/components/Dashboard/Assets/types";
import { INITIAL_ASSETS } from "@/app/dashboard/constants";
import { useSimulation } from "./useSimulation";

export const SIM_MAX = 30;

export default function Dashboard() {
  
  const sim = useSimulation();


  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-mark">VL</span>
          <span className="dash-logo-text">VantageLabs</span>
        </div>
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item dash-nav-active">Overview</a>
        </nav>
        <div className="dash-sidebar-footer">
          <span className="dash-year-badge">FY 2025</span>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">Financial Overview</h1>
            <p className="dash-page-sub">Stepwise simulation · Annual variables</p>
          </div>
          <div className="dash-topbar-right">
            <span className="dash-sim-badge">Sim: {SIM_MAX}yr</span>
          </div>
        </header>

        <div className="dash-grid">
          <div className="dash-cell dash-cell-md">
            <CashOnHandCalc
              currentYear={sim.currentYear}
              inputs={sim.currentInputs}
              result={sim.currentResult}
              displayResult={sim.displayResult}
              onUpdate={sim.updateEvent}
            />
          </div>

          <div className="dash-cell dash-cell-md">
            <AssetPortfolio
              assets={sim.asset}
              currentYear={sim.currentYear}
              onAddAsset={sim.addAsset}
              onSellAsset={sim.sellAsset}
            />
          </div>

          <div className="dash-cell dash-cell-sm">
            <div className="dash-placeholder">Asset Allocation</div>
          </div>

          <div className="dash-cell dash-cell-lg">
            <div className="dash-placeholder">Scenario Timeline</div>
          </div>

          <div className="dash-cell dash-cell-sm">
            <SimControls
              currentYear={sim.currentYear}
              isPlaying={sim.isPlaying}
              status={sim.status}
              simMax={SIM_MAX}
              onPlay={sim.play}
              onPause={sim.pause}
              onReset={sim.reset}
              onSeek={sim.seekTo}
            />
          </div>
        </div>

        {sim.error && <div className="dash-error">{sim.error}</div>}
      </main>
    </div>
  );
}