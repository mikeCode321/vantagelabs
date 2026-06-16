"use client";

import "../styles/ProfileSettingsForm.css";

import { useState, useEffect } from "react";
import { loadState, saveState, INITIAL_STATE, SimRequest } from "@/app/dashboard/utils";
import { FilingStatus, FILING_STATUS_OPTIONS, US_STATES } from "@/app/dashboard/TutorialSteps";

export default function ProfileSettingsForm() {
  const [profile, setProfile] = useState({
    user_start_age: INITIAL_STATE.user_start_age,
    user_retirement_age: INITIAL_STATE.user_retirement_age,
    filing_status: INITIAL_STATE.filing_status,
    state_of_residence: INITIAL_STATE.state_of_residence,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setProfile({
        user_start_age: stored.user_start_age,
        user_retirement_age: stored.user_retirement_age,
        filing_status: stored.filing_status,
        state_of_residence: stored.state_of_residence,
      });
    }
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const stored = loadState() ?? INITIAL_STATE;
    const startAge = Number(profile.user_start_age);

    const updated: SimRequest = {
      ...stored,
      ...profile,
      user_start_age: startAge,
      user_retirement_age: Number(profile.user_retirement_age),
      sim_end_age: startAge + 100,
    };

    saveState(updated);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave}>
      <div className="profile-settings-grid">
        <div className="profile-settings-field">
          <label className="profile-settings-label">Current Age</label>
          <input type="number" className="profile-settings-input" min={18} max={80} value={profile.user_start_age} onChange={(e) => handleChange("user_start_age", e.target.value)} />
        </div>

        <div className="profile-settings-field">
          <label className="profile-settings-label">Target Retirement Age</label>
          <input type="number" className="profile-settings-input" min={40} max={90} value={profile.user_retirement_age} onChange={(e) => handleChange("user_retirement_age", e.target.value)} />
        </div>

        <div className="profile-settings-field">
          <label className="profile-settings-label">Filing Status</label>
          <select className="profile-settings-input" value={profile.filing_status} onChange={(e) => handleChange("filing_status", e.target.value as FilingStatus)} >
            {FILING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="profile-settings-field">
          <label className="profile-settings-label">State of Residence</label>
          <select className="profile-settings-input" value={profile.state_of_residence} onChange={(e) => handleChange("state_of_residence", e.target.value)}>
            <option value="">Select a state…</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="profile-settings-footer">
        {saved && <span className="profile-settings-saved-msg">Saved</span>}
        <button type="submit" className="form-btn-submit">
          Save Changes
        </button>
      </div>
    </form>
  );
}