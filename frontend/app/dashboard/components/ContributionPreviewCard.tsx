import { ReactNode } from "react";
import { DollarSign } from "lucide-react";

interface ContributionPreviewCardProps {
    monthly: number;
    annual: number;
    footer: ReactNode; // e.g. "10.0% of $8,000 monthly net"
}

export default function ContributionPreviewCard({ monthly, annual, footer }: ContributionPreviewCardProps) {
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return (
        <div className="preview-card">
            <div className="preview-card-header">
                <span className="preview-icon"><DollarSign /></span>
                <span className="preview-card-label">Contribution Preview</span>
            </div>
            <div className="preview-card-row">
                <div className="preview-card-col">
                    <span className="preview-card-meta-label">Monthly</span>
                    <span className="preview-card-value">${fmt(monthly)}/mo</span>
                </div>
                <div className="preview-card-col preview-card-col-right">
                    <span className="preview-card-meta-label">Annual</span>
                    <span className="preview-card-value">${fmt(annual)}/yr</span>
                </div>
            </div>
            <div className="preview-card-footer">{footer}</div>
        </div>
    );
}