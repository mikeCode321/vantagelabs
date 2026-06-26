import { DollarSign } from "lucide-react";

interface LoanPaymentPreviewCardProps {
    monthlyPayment: number;
    sub?: string; // defaults to "Principal + interest only"
}

export default function LoanPaymentPreviewCard({
    monthlyPayment,
    sub = "Principal + interest only",
}: LoanPaymentPreviewCardProps) {
    return (
        <div className="preview-card">
            <div className="preview-card-header preview-card-header-mb10">
                <span><DollarSign /></span>
                <div className="preview-card-label">Estimated Payment</div>
            </div>
            <div className="preview-card-amount">
                ${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </div>
            <div className="preview-card-sub">{sub}</div>
        </div>
    );
}