import './styles/Forms.css';

type TimelineAgeFieldsProps = {
  state: any;
  startAge: string;
  endAge: string;
  setStartAge: (value: string) => void;
  setEndAge: (value: string) => void;
  startAgeLabel?: string;
  endAgeLabel?: string;
  readOnly?: boolean;
};

function getTimelineBounds(state: any) {
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

export function TimelineAgeFields({state, startAge, endAge, setStartAge, setEndAge, startAgeLabel = "Start Age", endAgeLabel = "End Age", readOnly = false,}) {
  const { minAge, maxAge } = getTimelineBounds(state);

  const startAgeInvalid = !readOnly && isStartAgeInvalid(startAge, minAge, maxAge);
  const endAgeInvalid = !readOnly && isEndAgeInvalid(endAge, startAge, minAge, maxAge);
  const timelineInvalid = startAgeInvalid || endAgeInvalid;

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