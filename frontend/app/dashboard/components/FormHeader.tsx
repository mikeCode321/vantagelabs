
export default function FormHeader({ icon, title, desc }) {
    return (
        <div className="form-header">
            <div className="form-header-icon">{icon}</div>
            <div>
                <h3 className="form-header-title">{title}</h3>
                <p className="form-header-desc">{desc}</p>
            </div>
        </div>
    );
}