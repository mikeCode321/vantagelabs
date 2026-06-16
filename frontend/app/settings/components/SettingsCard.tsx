"use client";
import "../styles/SettingsCard.css";

export default function SettingsCard({ icon, title, description, children, comingSoon = false,}) {

    return (
        <section className={`settings-card${comingSoon ? " settings-card-disabled" : ""}`}>
            <div className="settings-card-header">
                {icon && <div className="settings-card-icon">{icon}</div>}

                <div className="settings-card-heading">
                <div className="settings-card-title-row">
                    <h2 className="settings-card-title">{title}</h2>
                    {comingSoon && <span className="settings-badge">Coming Soon</span>}
                </div>

                {description && <p className="settings-card-desc">{description}</p>}
                </div>
            </div>

            <div className="settings-card-body">{children}</div>

        </section>
  );
}