import Link from "next/link";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import "../styles/calculator-maintenance.css";

export default function CalculatorMaintenancePage() {
  return (
    <div className="calculator-maintenance-page">
      <TopBar />

      <main className="calculator-maintenance-main">
        <div className="calculator-maintenance-card">
          <h1 className="calculator-maintenance-title">Under Maintenance</h1>
          <p className="calculator-maintenance-description">
            This calculator is not available yet. We are working on it and will
            release it soon.
          </p>
          <Link href="/" className="calculator-maintenance-link">
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
