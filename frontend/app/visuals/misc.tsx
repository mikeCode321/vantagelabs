import { useEffect, useState } from "react";
import { BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, Bar } from "recharts";
import { simulate } from "@/app/visuals/simulate"
import React from "react";

/* -------------------- Toast Banner -------------------- */
export type Toast = {
  id: string;
  message: string;
  entityName: string;
  action: "added" | "edited" | "deleted";
  type: "success" | "error" | "info";
};

export function ToastBanner({ toasts, setToasts }) {
  
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="toast-banner-wrapper">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-item--${toast.action}`}>
          <span className="toast-icon">✓</span>

          <span className="toast-message">{toast.message}</span>

          <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------- Feedback Model -------------------- */
function getAnonymousId() {
  const storageKey = "vantage_anonymous_id";

  let anonymousId = localStorage.getItem(storageKey);

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    localStorage.setItem(storageKey, anonymousId);
  }

  return anonymousId;
}

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rating, setRating] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const feedbackPayload = {
      userProvided: {
        satisfaction: Number(rating),
        category,
        message,
        email: email || null,
      },
      metaData: {
        anonymousId: getAnonymousId(),
        pageUrl: window.location.href,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        browserAndOS: navigator.userAgent,
        referralSource: document.referrer || null,
        utmParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      },
    };

    console.log("User Feedback Submitted:", feedbackPayload);

    setRating("");
    setCategory("General");
    setMessage("");
    setEmail("");

    onClose();
  }

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-header">
          <div>
            <h2 className="feedback-title">Leave Feedback</h2>
            <p className="feedback-desc">We’re a small team building quickly, and we’d genuinely appreciate any feedback that could help us improve.</p>
          </div>

          <button type="button" className="feedback-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label className="feedback-label">
            Satisfaction Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)} required className="feedback-input">
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>

          <label className="feedback-label">
            Feedback Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="feedback-input">
              <option>Bug</option>
              <option>Feature Request</option>
              <option>UX Confusion</option>
              <option>Questions</option>
              <option>General</option>
            </select>
          </label>

          <label className="feedback-label">
            Feedback / Questions
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your feedback or questions..." rows={5} required className="feedback-input" />
          </label>

          <label className="feedback-label">
            Email Optional
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Only if you want a follow-up" className="feedback-input" />
          </label>

          <div className="feedback-actions">
            <button type="button" className="feedback-btn-secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="feedback-btn-primary">
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SimulationControls({ state, setSimResult }) {
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
    <div style={{marginTop:"25px"}}>
      <button style={{marginRight:"25px"}} onClick={runSimulation}>Run Simulation</button>
      <button onClick={clearSimulation} disabled={!hasResults}>
        Clear Simulation Result
      </button>
    </div>
  );
}

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
