

export default function FormToggleGroup({ label="", options, value, onChange }) {
    return (
        <div className="form-field">
            {label && <label className="form-label">{label}</label>}
            <div className="form-toggle-group">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`form-btn-secondary${value === option.value ? " active" : ""}`}
                        onClick={() => onChange(option.value)}
                        disabled={option.disabled}
                        title={option.disabled ? option.disabledTitle : undefined}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}