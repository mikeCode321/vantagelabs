import './TimelineAgeFields.css';

import { useState } from "react";
import { getAllPresetAges, PresetAge } from "@/app/dashboard/utils";

type TimelineAgeFieldsProps = {
  state: any;
  startAge: string;
  endAge: string;
  setStartAge: (value: string) => void;
  setEndAge: (value: string) => void;
  startAgeLabel?: string;
  endAgeLabel?: string;
  readOnly?: boolean;
  showPresetChips?: boolean;
};


function getPresetsChronologically(state: any): PresetAge[] {
  const allPresets = getAllPresetAges(state);
  
  // Prioritize now, retirement, end_of_plan as first 3 chips
  const priorityKeys = ["now", "retirement", "end_of_plan"];
  const priorityPresets = allPresets.filter(p => priorityKeys.includes(p.key));
  const otherPresets = allPresets.filter(p => !priorityKeys.includes(p.key));
  
  // Sort priority presets in the desired order
  const sortedPriority = priorityKeys
    .map(key => priorityPresets.find(p => p.key === key))
    .filter((p): p is PresetAge => p !== undefined);
  
  // Sort other presets chronologically
  const sortedOthers = otherPresets.slice().sort((a, b) => a.value - b.value);
  
  return [...sortedPriority, ...sortedOthers];
}

type PresetAgeChipsProps = {
  state: any;
  currentValue: string;
  onSelect: (value: string) => void;
};

function PresetAgeChips({ state, currentValue, onSelect }: PresetAgeChipsProps) {
  const presets = getPresetsChronologically(state);
  const selectedValue = Number(currentValue);

  const handleChipClick = (value: number) => {
    onSelect(String(value));
  };

  return (
    <div className="preset-age-scroll-wrapper">
      <div className="preset-age-chips-row">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`preset-age-chip${selectedValue === preset.value ? " active" : ""}`}
            onClick={() => handleChipClick(preset.value)}
            data-tooltip={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="preset-age-scroll-fade" />
    </div>
  );
}

type SharedPresetChipsProps = {
  state: any;
  startAge: string;
  endAge: string;
  setStartAge: (value: string) => void;
  setEndAge: (value: string) => void;
};

function SharedPresetChips({ state, startAge, endAge, setStartAge, setEndAge }: SharedPresetChipsProps) {
  const [hoveredPreset, setHoveredPreset] = useState<PresetAge | null>(null);
  const presets = getPresetsChronologically(state);
  const startValue = Number(startAge);
  const endValue = Number(endAge);

  // Toggle switch implementation (commented out for future reuse)
  /*
  const [targetField, setTargetField] = useState<"start" | "end">("start");
  const currentValue = targetField === "start" ? startAge : endAge;
  const selectedValue = Number(currentValue);

  const handleChipClick = (value: number) => {
    if (targetField === "start") {
      setStartAge(String(value));
    } else {
      setEndAge(String(value));
    }
  };

  return (
    <div className="form-field">
      <div className="preset-age-toggle" data-target={targetField}>
        <button
          type="button"
          className={targetField === "start" ? "active" : ""}
          onClick={() => setTargetField("start")}
        >
          Start
        </button>
        <button
          type="button"
          className={targetField === "end" ? "active" : ""}
          onClick={() => setTargetField("end")}
        >
          End
        </button>
      </div>
      <div className="preset-age-scroll-wrapper">
        <div className="preset-age-chips-row">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`preset-age-chip${selectedValue === preset.value ? " active" : ""}`}
              onClick={() => handleChipClick(preset.value)}
              data-tooltip={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="preset-age-scroll-fade" />
      </div>
    </div>
  );
  */

  // Auto-sorting implementation
  const handleChipClick = (value: number) => {
    const currentStart = Number(startAge);
    
    // If start age is empty, set it
    if (startAge === "" || Number.isNaN(currentStart)) {
      setStartAge(String(value));
      return;
    }
    
    // Auto-sorting logic: if value < current start, set as new start
    // If value > current start, set as new end
    if (value < currentStart) {
      setStartAge(String(value));
    } else if (value > currentStart) {
      setEndAge(String(value));
    }
    // If value == current start, do nothing
  };

  const displayDescription = hoveredPreset?.description || "";

  return (
    <div className="form-field">
      <div className="preset-age-scroll-wrapper">
        <div className="preset-age-chips-row">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`preset-age-chip${startValue === preset.value || endValue === preset.value ? " active" : ""}`}
              onClick={() => handleChipClick(preset.value)}
              onMouseEnter={() => setHoveredPreset(preset)}
              onMouseLeave={() => setHoveredPreset(null)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="preset-age-scroll-fade" />
        {displayDescription && (
          <p className="preset-age-description">{displayDescription}</p>
        )}
      </div>
    </div>
  );
}

export function getTimelineBounds(state: any) {
  const minAge = Number(state?.user_start_age ?? 1);
  const maxAge = minAge + 100;
  return { minAge, maxAge };
}

function isStartAgeInvalid(startAge: string, minAge: number, maxAge: number) {
  if (startAge === "") return false;
  const start = Number(startAge);
  return Number.isNaN(start) || start < minAge || start > maxAge;
}

function isEndAgeInvalid(endAge: string, startAge: string, minAge: number, maxAge: number) {
  if (endAge === "") return false;
  const end = Number(endAge);
  const start = Number(startAge) || minAge;
  return Number.isNaN(end) || end < start || end > maxAge;
}

function clampAge(value: string, minAge: number, maxAge: number) {
  if (value === "") return "";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "";
  return String(Math.min(Math.max(numberValue, minAge), maxAge));
}

export function getValidatedTimelinePayload(state: any, startAge: string, endAge: string) {
  const { minAge, maxAge } = getTimelineBounds(state);
  const start = Number(startAge);
  const end = endAge === "" ? maxAge : Number(endAge);

  const invalid =
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < minAge ||
    start > maxAge ||
    end < start ||
    end > maxAge;

  return { invalid, start, end, minAge, maxAge };
}

export function TimelineAgeFields({state, startAge, endAge, setStartAge, setEndAge, startAgeLabel = "Start Age", endAgeLabel = "End Age", readOnly = false, showPresetChips = false,}) {
  const { minAge, maxAge } = getTimelineBounds(state);

  const startAgeInvalid = !readOnly && isStartAgeInvalid(startAge, minAge, maxAge);
  const endAgeInvalid = !readOnly && isEndAgeInvalid(endAge, startAge, minAge, maxAge);
  const timelineInvalid = startAgeInvalid || endAgeInvalid;

  const setStartAgeSafe = (value: string) => {
    const clamped = clampAge(value, minAge, maxAge);
    setStartAge(clamped);
    if (endAge && Number(endAge) < Number(clamped)) {
      setEndAge(clamped);
    }
  };

  const setEndAgeSafe = (value: string) => {
    const minEndAge = Number(startAge) || minAge;
    const clamped = clampAge(value, minEndAge, maxAge);
    setEndAge(clamped);
  };

  return (
    <>
      <div className="form-year-grid">
        <div className="form-field">
          <label className="form-label">{startAgeLabel}</label>
          <input
            value={startAge}
            onChange={(e) => {
              if (readOnly) return;
              const value = e.target.value;
              setStartAge(value);
              if (endAge && Number(endAge) < Number(value)) {
                setEndAge(value);
              }
            }}
            onBlur={() => {
              if (readOnly) return;
              const clampedStart = clampAge(startAge, minAge, maxAge);
              setStartAge(clampedStart);
              if (endAge && Number(endAge) < Number(clampedStart)) {
                setEndAge(clampedStart);
              }
            }}
            className={`form-input${startAgeInvalid ? " form-input-error" : ""}${readOnly ? " form-input-readonly" : ""}`}
            placeholder={String(minAge)}
            type="number"
            min={minAge}
            max={maxAge}
            readOnly={readOnly}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">{endAgeLabel}</label>
          <input
            value={endAge}
            onChange={(e) => {
              if (readOnly) return;
              setEndAge(e.target.value);
            }}
            onBlur={() => {
              if (readOnly) return;
              if (endAge === "") return;
              const minEndAge = Number(startAge) || minAge;
              setEndAge(clampAge(endAge, minEndAge, maxAge));
            }}
            className={`form-input${endAgeInvalid ? " form-input-error" : ""}${readOnly ? " form-input-readonly" : ""}`}
            placeholder={`${maxAge}`}
            type="number"
            min={Number(startAge) || minAge}
            max={maxAge}
            readOnly={readOnly}
          />
        </div>
      </div>

      {showPresetChips && !readOnly && (
        <SharedPresetChips state={state} startAge={startAge} endAge={endAge} setStartAge={setStartAgeSafe} setEndAge={setEndAgeSafe} />
      )}

      {readOnly && (
        <p className="form-helper">Inherited from linked asset - edit the asset to change these dates.</p>
      )}

      {timelineInvalid && (
        <p className="form-field-error">
          Start age must be within ages {minAge}–{maxAge}. End age is optional,
          but if entered it must be between start age and {maxAge}.
        </p>
      )}
    </>
  );
}