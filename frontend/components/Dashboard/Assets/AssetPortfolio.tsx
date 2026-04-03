"use client";

import { useState } from "react";
import type { Asset, NewAsset } from "./types";
import AssetActions from "./AssetActions";
import AssetSummary from "./AssetSummary";
import AssetList from "./AssetList";

type AssetPortfolioProps = {
  assets: Asset[];
  currentYear: number;
  onAddAsset: (asset: NewAsset) => void;
  onSellAsset: (id: number) => void;
};

export default function AssetPortfolio({ assets, currentYear, onAddAsset, onSellAsset }: AssetPortfolioProps) {
  const [showForm, setShowForm] = useState(false);

  const computedAssets = assets.map((asset) => {
    const growthEndYear =
      asset.sold && asset.soldYear !== undefined
        ? Math.min(currentYear, asset.soldYear)
        : currentYear;
    const yearsHeld = Math.max(0, growthEndYear - asset.year);
    const currentValue = asset.value * Math.pow(1 + asset.compound, yearsHeld);
    return { ...asset, currentValue };
  });

  const ownedAssets = computedAssets.filter((asset) => !asset.sold);
  const totalAssetValue = ownedAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalMonthlyExpenses = ownedAssets.reduce((sum, asset) => sum + (asset.monthlyExpense ?? 0), 0);

  return (
    <section className="asset-panel">
      <div className="asset-panel-header">
        <h2 className="asset-panel-title">Asset Portfolio</h2>
        <button type="button" className="asset-button asset-button-teal" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close" : "+ Add Asset"}
        </button>
      </div>

      <AssetSummary totalAssetValue={totalAssetValue} totalMonthlyExpenses={totalMonthlyExpenses} ownedCount={ownedAssets.length} />

      {showForm && (
        <AssetActions onAddAsset={(asset) => { onAddAsset(asset); setShowForm(false); }} />
      )}

      <AssetList assets={computedAssets} onSell={onSellAsset} />
    </section>
  );
}