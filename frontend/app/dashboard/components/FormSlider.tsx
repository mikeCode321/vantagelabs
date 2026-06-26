
export default function FormSlider({ label, value, onChange, min, max, step, decimals=1, prefix="" }) {
    const displayValue = `${prefix}${Number(value).toFixed(decimals)}%`;
    return (
        <div className="form-field-gap8">
            <div className="form-slider-header">
                <label className="form-label">{label}</label>
                <span className="form-slider-value">{displayValue}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="form-slider"
            />
        </div>
    );
}