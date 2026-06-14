import "./styles/SimulationControls.css";
import { useState } from "react";
import { simulate } from "@/app/dashboard/simulate";
import { Play, Trash2 } from "lucide-react";

export default function SimulationControls({ state, setSimResult, activeTutorialStepId }) {
  const [hasResults, setHasResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  async function runSimulation() {
    setIsRunning(true);
    try {
      const data = simulate(state);
      setSimResult(data);
      setHasResults(true);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsRunning(false);
    }
  }

  const clearSimulation = () => {
    setSimResult(null);
    setHasResults(false);
  };

  return (
    <div className={`sim-controls${activeTutorialStepId === "results" ? " ts-tutorial-target" : ""}`}>
      <div className="sim-controls-actions">
        <button className="sim-controls-btn sim-controls-btn-run" onClick={runSimulation} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? "Running…" : "Simulate"}
        </button>

        <button className="sim-controls-btn sim-controls-btn-clear" onClick={clearSimulation} disabled={!hasResults}>
          <Trash2 size={13} />
          Clear
        </button>
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
