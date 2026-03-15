"use client";
import "./SimControls.css";
import { useState, useRef, useEffect } from "react";


// keep this comment section for reference 
// Starting Cash
// $100,000.00
// Horizon
// 5 yrs
// Net Income
// $80,000.00
// Income Growth
// 3.0%
// Expenses
// $50,000.00
// Expense Growth
// 2.0%
// $561,773.57

interface SimControlsProps {
  max: number;
  year: number;
  onYearChange: (year: number) => void;
}

export default function SimControls({ max, year, onYearChange }: SimControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = isPlaying ? "playing" : year >= max ? "done" : year === 0 ? "ready" : "paused";

  const update = (val: number) => {
    const clamped = Math.max(0, Math.min(max, Math.round(val)));
    onYearChange(clamped);
    return clamped;
  };

  const pause = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const play = () => {
    if (year >= max) onYearChange(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      let current = year;
      intervalRef.current = setInterval(() => {
        current += 1;
        if (current >= max) {
          onYearChange(max);
          setIsPlaying(false);
          clearInterval(intervalRef.current!);
        } else {
          onYearChange(current);
        }
      }, 300);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    pause();
    update(Number(e.target.value));
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    pause();
    update(Number(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "ArrowUp") { e.preventDefault(); pause(); update(year + 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); pause(); update(year - 1); }
  };

  const bgSize = `${(year / max) * 100}% 100%`;

  return (
    <div className="sim-root">
      <div className="sim-header">
        <h2 className="sim-title">Controls</h2>
        <span className="sim-status">{status}</span>
      </div>

      <div className="sim-body">
        <div className="sim-control-header">
          <span className="sim-label">Years</span>
          <div className="year-pill" onClick={() => document.getElementById("yearInput")?.focus()}>
            <input
              id="yearInput"
              className="year-input"
              type="number"
              value={year}
              min={0}
              max={max}
              onChange={handleTextInput}
              onKeyDown={handleKeyDown}
              onBlur={(e) => update(Number(e.target.value))}
            />
            <span className="year-sep">/</span>
            <span className="year-total">{max}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={year}
          onChange={handleSlider}
          style={{ backgroundSize: bgSize }}
        />

        <div className="sim-tick-row">
          <span className="sim-tick">0</span>
          <span className="sim-tick sim-tick--hidden" />
          <span className="sim-tick">{Math.round(max / 2)}</span>
          <span className="sim-tick sim-tick--hidden" />
          <span className="sim-tick">{max}</span>
        </div>
      </div>

      <div className="sim-footer">
        <button className={`sim-play-btn${isPlaying ? " playing" : ""}`} onClick={isPlaying ? pause : play}>
          {isPlaying ? (
            <svg className="play-icon" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1" width="3" height="10" />
              <rect x="7" y="1" width="3" height="10" />
            </svg>
          ) : (
            <svg className="play-icon" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="2,1 11,6 2,11" />
            </svg>
          )}
          {isPlaying ? "pause" : "play"}
        </button>
        <button className="sim-reset-btn" onClick={() => { pause(); update(0); }}>reset</button>
      </div>
    </div>
  );
}