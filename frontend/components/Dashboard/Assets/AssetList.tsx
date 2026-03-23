import type { Asset } from "./types";


type DisplayAsset = Asset & {
  currentValue: number;
};

type AssetListProps = {
  assets: DisplayAsset[];
  onSell: (id: number) => void;
};

export default function AssetList({ assets, onSell }: AssetListProps) {
  if (assets.length === 0) {
    return <div className="asset-empty">No assets added yet</div>;
  }

  return (
    <section className="asset-list">
      {assets.map((asset) => (
        <article key={asset.id} className="asset-row">
          <div className="asset-row-main">
            <p className="asset-row-name">{asset.name}</p>
            <p className="asset-row-meta">
              {asset.type} · {(asset.compound * 100).toFixed(1)}%/yr
              {(asset.monthlyExpense ?? 0) > 0
                ? ` · $${asset.monthlyExpense.toLocaleString()}/mo`
                : ""}
            </p>
          </div>

          <div className="asset-row-side">
            <p className="asset-row-value">${asset.currentValue.toLocaleString()}</p>

            <div className="asset-row-actions">
              <span
                className={
                  asset.sold ? "asset-status asset-status-sold" : "asset-status"
                }
              >
                {asset.sold ? "Sold" : "Owned"}
              </span>

              {!asset.sold && (
                <button
                  type="button"
                  className="asset-btn-ghost"
                  onClick={() => onSell(asset.id)}
                >
                  Sell
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}