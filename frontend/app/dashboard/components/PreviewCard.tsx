import { ReactNode } from "react";

interface PreviewCardProps {
    icon: ReactNode;
    label: string;
    amount: ReactNode;   // e.g. "$12,000" — pass as string or JSX
    unit?: string;       // e.g. "/yr", "/mo" — omit if unit is baked into amount
    large?: boolean;     // uses preview-card-amount-lg and preview-card-header-mb10
    children: ReactNode; // the sub line — always a computed string or JSX
}

export default function PreviewCard({ icon, label, amount, unit, large = false, children }: PreviewCardProps) {
    return (
        <div className="preview-card">
            <div className={`preview-card-header${large ? " preview-card-header-mb10" : ""}`}>
                <span className="preview-icon">{icon}</span>
                <span className="preview-card-label">{label}</span>
            </div>
            <div className={`preview-card-amount${large ? " preview-card-amount-lg" : ""}`}>
                {amount}
                {unit && (
                    <span className={`preview-card-unit${large ? " preview-card-unit-lg" : ""}`}>
                        {unit}
                    </span>
                )}
            </div>
            <div className="preview-card-sub">{children}</div>
        </div>
    );
}