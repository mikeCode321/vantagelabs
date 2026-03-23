type AssetSummaryProps = {
  totalAssetValue: number;
  totalMonthlyExpenses: number;
  ownedCount: number;
};

export default function AssetSummary({ totalAssetValue, totalMonthlyExpenses, ownedCount, }: AssetSummaryProps) {
  return (
    <section className="asset-summary">
      <p className="asset-summary-label">Portfolio Value</p>
      <p className="asset-summary-value">
        ${totalAssetValue.toLocaleString()}
      </p>
      <p className="asset-summary-meta">
        {ownedCount} owned · ${totalMonthlyExpenses.toLocaleString()}/month expenses
      </p>
    </section>
  );
}