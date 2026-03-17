"use client";
import "./SimControls.css";

interface SimControlsProps {
  currentYear: number;
  isPlaying: boolean;
  status: string;
  simMax: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (year: number) => void;
}

export default function SimControls({
  currentYear, isPlaying, status, simMax, onPlay, onPause, onReset, onSeek,
}: SimControlsProps) {
  const bgSize = `${(currentYear / simMax) * 100}% 100%`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "ArrowUp") { e.preventDefault(); onSeek(currentYear + 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); onSeek(currentYear - 1); }
  };

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
              value={currentYear}
              min={0}
              max={simMax}
              onChange={e => onSeek(Number(e.target.value))}
              onKeyDown={handleKeyDown}
              onBlur={e => onSeek(Number(e.target.value))}
            />
            <span className="year-sep">/</span>
            <span className="year-total">{simMax}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={simMax}
          step={1}
          value={currentYear}
          onChange={e => onSeek(Number(e.target.value))}
          style={{ backgroundSize: bgSize }}
        />

        <div className="sim-tick-row">
          <span className="sim-tick">0</span>
          <span className="sim-tick sim-tick--hidden" />
          <span className="sim-tick">{Math.round(simMax / 2)}</span>
          <span className="sim-tick sim-tick--hidden" />
          <span className="sim-tick">{simMax}</span>
        </div>
      </div>

      <div className="sim-footer">
        <button
          className={`sim-play-btn${isPlaying ? " playing" : ""}`}
          onClick={isPlaying ? onPause : onPlay}
        >
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
        <button className="sim-reset-btn" onClick={onReset}>reset</button>
      </div>
    </div>
  );
}