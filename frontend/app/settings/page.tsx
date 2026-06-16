"use client";
import "./styles/Settings.css";

import { User, Lock } from "lucide-react";
import SideBar from "@/app/dashboard/SideBar";
import SettingsCard from "./components/SettingsCard";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

export default function Settings() {

  return (
    <div className="settings-root">
      <SideBar />
      <div className="settings-main">
        <div className="settings-page">
            <header className="settings-header">
                <h1>Settings</h1>
                <p>Manage your profile and account preferences.</p>
            </header>

            <SettingsCard icon={<User />} title="Profile & Tax Information" description="These details shape your retirement projections.">
                <ProfileSettingsForm />
            </SettingsCard>

            <SettingsCard icon={<Lock />} title="Account & Security" description="Manage your email and password." comingSoon>
                <p>Email and password management coming soon.</p>
            </SettingsCard>
        </div>
      </div>
    </div>
  );
}