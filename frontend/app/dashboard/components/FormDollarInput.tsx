import { formatNumberWithCommas, handleNumberInput } from "@/app/dashboard/utils";

export default function FormDollarInput({ value, onChange, placeholder, suffix="", required=false, disabled=false,}) {
    return (
        <div className="form-input-wrap">
            <span className="form-input-prefix">$</span>
            {suffix && <span className="form-input-suffix-label">{suffix}</span>}
            <input
                value={formatNumberWithCommas(value)}
                onChange={(e) => handleNumberInput(e, onChange)}
                className={`form-input form-input-prefix-dollar${suffix ? " form-input-has-suffix" : ""}`}
                placeholder={placeholder}
                type="text"
                inputMode="decimal"
                required={required}
                disabled={disabled}
            />
        </div>
    );
}