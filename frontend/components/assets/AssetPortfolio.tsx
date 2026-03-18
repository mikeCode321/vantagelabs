"use client";

import { useState } from "react";
import type { Asset } from "./types";
import AssetActions from "./AssetActions";
import AssetSummary from "./AssetSummary";
import AssetList from "./AssetList";

type AssetPortfolioProps = {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, "id" | "sold">) => void;
  onSell: (id: number) => void;
};

export default function AssetPortfolio({
  assets,
  onAddAsset,
  onSell,
}: AssetPortfolioProps) {
  const [showForm, setShowForm] = useState(false);

  const ownedAssets = assets.filter((asset) => !asset.sold);

  const totalAssetValue = ownedAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalMonthlyExpenses = ownedAssets.reduce(
    (sum, asset) => sum + (asset.monthlyExpense ?? 0),
    0
  );

  const handleAddAsset = (asset: Omit<Asset, "id" | "sold">) => {
    onAddAsset(asset);
    setShowForm(false);
  };

  return (
    <section className="asset-panel">
      <div className="asset-panel-header">
        <h2 className="asset-panel-title">Asset Portfolio</h2>
        <button
          type="button"
          className="asset-button asset-button-teal"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? "Close" : "+ Add Asset"}
        </button>
      </div>

      <AssetSummary
        totalAssetValue={totalAssetValue}
        totalMonthlyExpenses={totalMonthlyExpenses}
        ownedCount={ownedAssets.length}
      />

      {showForm && <AssetActions onAddAsset={handleAddAsset} />}

      <AssetList assets={assets} onSell={onSell} />
    </section>
  );
}