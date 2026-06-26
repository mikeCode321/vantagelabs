
export default function FormSubmitButton({ label, disabled=false, topMargin=false }) {
    return (
        <div className="form-footer">
            <button type="submit" className={`form-btn-submit${topMargin ? " form-btn-submit-mt" : ""}`} disabled={disabled}>
                {label}
            </button>
        </div>
    );
}