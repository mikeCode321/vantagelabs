import { useState } from "react";
import { simulate } from "@/app/visuals/simulate"

export default function SimulationControls({ state, setSimResult, activeTutorialStepId }) {
  const [hasResults, setHasResults] = useState(false);

  async function runSimulation() {
    try {
      // const API = "http://localhost:8000/api/finance/simulate";

      // const response = await fetch(API, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(state),
      // });

      // const data = await response.json();

      const data = simulate(state)

      console.log(data);
      setSimResult(data);
      setHasResults(true);
    } catch (err) {
      console.error("Simulation error:", err);
    }
  }

  const clearSimulation = () => {
    setSimResult(null);
    setHasResults(false);
  };
  return (
    <div className={activeTutorialStepId === "results" ? "ts-tutorial-target" : ""} style={{ borderRadius: "16px" }}>
      <div style={{marginTop:"25px"}}>
        <button style={{marginRight:"25px"}} onClick={runSimulation}>Run Simulation</button>
        <button onClick={clearSimulation} disabled={!hasResults}>
          Clear Simulation Result
        </button>
      </div>
    </div>
  );
}
