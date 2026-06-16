import "./styles/SimulationControls.css";
import { useState } from "react";
import { simulate } from "@/app/dashboard/simulate";
import { Play, Trash2 } from "lucide-react";

export default function SimulationControls({ state, setSimResult, activeTutorialStepId, simResult, selectedYear, setSelectedYear }) {
  const [isRunning, setIsRunning] = useState(false);

  const hasResults = !!simResult;
  const years = simResult?.year_results?.map(yr => yr.year) ?? [];
  const minYear = years[0] ?? state.user_start_age;
  const maxYear = years[years.length - 1] ?? state.sim_end_age;
  const currentAge = simResult?.year_results?.find(yr => yr.year === selectedYear)?.age ?? state.user_start_age;

  async function runSimulation() {
    setIsRunning(true);
    try {
      const data = simulate(state);
      setSimResult(data);
      setSelectedYear(data.year_results[data.year_results.length - 1].year);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsRunning(false);
    }
  }

  const clearSimulation = () => {
    setSimResult(null);
    setSelectedYear(null);
  };

  return (
    <div className={`sim-controls${activeTutorialStepId === "results" ? " ts-tutorial-target" : ""}`}>
      <div className="sim-controls-actions">
        <button className="sim-controls-btn sim-controls-btn-run" onClick={runSimulation} disabled={isRunning}>
          <Play size={11} />
          {isRunning ? "Running…" : "Simulate"}
        </button>
        <button className="sim-controls-btn sim-controls-btn-clear" onClick={clearSimulation} disabled={!hasResults}>
          <Trash2 size={11} />
          Clear
        </button>
      </div>

      <div className={`sim-controls-slider-wrap${!hasResults ? " sim-controls-slider-disabled" : ""}`}>
        <div className="sim-controls-slider-labels">
          <span>Age {currentAge}</span>
          <span>{selectedYear ?? "—"}</span>
        </div>
        <input type="range" className="sim-controls-slider" min={minYear} max={maxYear} value={selectedYear ?? maxYear} disabled={!hasResults} onChange={e => setSelectedYear(Number(e.target.value))} />
        <div className="sim-controls-slider-labels">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  );
}

// const API = "http://localhost:8000/api/finance/simulate";

      // const response = await fetch(API, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(state),
      // });

      // const data = await response.json();
