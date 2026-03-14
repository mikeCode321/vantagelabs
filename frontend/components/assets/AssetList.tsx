import type { Asset } from './types';

type AssetListProps = {
  assets: Asset[];
  onSell: (id: number) => void;
};

export default function AssetList({ assets, onSell }: AssetListProps) {
  return (
    <section>
      <h2>Assets</h2>

      {assets.map((asset) => (
        <div key={asset.id}>
          <p>Name: {asset.name}</p>
          <p>Type: {asset.type}</p>
          <p>Value: ${asset.value.toLocaleString()}</p>
          <p>Monthly Expense: ${asset.monthlyExpense?.toLocaleString()}</p>
          <p>Down Payment: ${asset.downPayment?.toLocaleString() || 0}</p>
          <p>Status: {asset.sold ? 'Sold' : 'Owned'}</p>

          {!asset.sold && (
            <button onClick={() => onSell(asset.id)}>Sell</button>
          )}

          <hr />
        </div>
      ))}
    </section>
  );
}