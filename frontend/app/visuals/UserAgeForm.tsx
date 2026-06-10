import "./styles/Forms.css";

import { useState } from "react";

export function UserAgeForm({ state, dispatch }) {
  const [start, setStart] = useState(String(state.user_start_age));
  const [end, setEnd] = useState(String(state.user_end_age));

  return (
      <div className="setup-section">
        <div className="setup-header">
          <h2>Simulation Setup</h2>
          <p>Define your planning timeline</p>
        </div>

        <div className="setup-grid">
          <div className="setup-field">
            <label className="setup-label">Your Current Age</label>

            <input
              type="number"
              min="0"
              max="120"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              onBlur={() => {
                const endNum = Number(end) || 150;
                const val = Number(start);

                const cleaned = Math.min(120, Math.max(0, Math.min(val, endNum)));

                setStart(String(cleaned));

                dispatch({
                  type: "UPDATE_SIMULATION_BOUNDS",
                  payload: {
                    user_start_age: cleaned,
                    user_end_age: state.user_end_age,
                  },
                });
              }}
              className="setup-input"
            />
          </div>

          <div className="setup-field">
            <label className="setup-label">Plan Until Age</label>

            <input
              type="number"
              min="0"
              max="150"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              onBlur={() => {
                const startNum = Number(start) || 0;
                const val = Number(end);

                const cleaned = Math.max(0, Math.min(150, Math.max(val, startNum)));

                setEnd(String(cleaned));

                dispatch({
                  type: "UPDATE_SIMULATION_BOUNDS",
                  payload: {
                    user_start_age: state.user_start_age,
                    user_end_age: cleaned,
                  },
                });
              }}
              className="setup-input"
            />
          </div>
        </div>

        <div className="setup-summary">
          <span className="setup-summary-text">
            Timeline: <strong>{(Number(end) || 0) - (Number(start) || 0)} years</strong>
          </span>
        </div>
      </div>
  );
}
