// 'use client';

// import { useMemo, useState } from 'react';
// import AssetSummary from '@/components/assets/AssetSummary';
// import AssetActions from '@/components/assets/AssetActions';
// import AssetList from '@/components/assets/AssetList';
// import type { Asset } from '@/components/assets/types';

// export default function AssetsComponentsPage() {
//   const [totalCash, setTotalCash] = useState(50000);

//   const [assets, setAssets] = useState<Asset[]>([
//     {
//       id: 1,
//       name: 'Gold Bar',
//       type: 'gold',
//       value: 3000,
//       monthlyExpense: 0,
//       sold: false,
//     },
//     {
//       id: 2,
//       name: 'Rental House',
//       type: 'house',
//       value: 250000,
//       downPayment: 20000,
//       monthlyExpense: 1800,
//       sold: false,
//     },
//   ]);

//   const totalExpenses = useMemo(() => {
//     return assets
//       .filter((asset) => !asset.sold)
//       .reduce((sum, asset) => sum + asset.monthlyExpense, 0);
//   }, [assets]);

//   function addSampleHouse() {
//     const newHouse: Asset = {
//       id: Date.now(),
//       name: 'New House',
//       type: 'house',
//       value: 320000,
//       downPayment: 25000,
//       monthlyExpense: 2200,
//       sold: false,
//     };

//     setAssets((prev) => [...prev, newHouse]);
//     setTotalCash((prev) => prev - (newHouse.downPayment || 0));
//   }

//   function addSampleGold() {
//     const newGold: Asset = {
//       id: Date.now(),
//       name: 'Gold Coin',
//       type: 'gold',
//       value: 1200,
//       monthlyExpense: 0,
//       sold: false,
//     };

//     setAssets((prev) => [...prev, newGold]);
//     setTotalCash((prev) => prev - newGold.value);
//   }

//   function sellAsset(id: number) {
//     const assetToSell = assets.find((asset) => asset.id === id);
//     if (!assetToSell || assetToSell.sold) return;

//     setAssets((prev) =>
//       prev.map((asset) =>
//         asset.id === id ? { ...asset, sold: true } : asset
//       )
//     );

//     setTotalCash((prev) => prev + assetToSell.value);
//   }

//   return (
//     <div>
//       <h1>Assets Components</h1>

//       <AssetSummary
//         totalCash={totalCash}
//         totalExpenses={totalExpenses}
//       />

//       <AssetActions
//         onAddHouse={addSampleHouse}
//         onAddGold={addSampleGold}
//       />

//       <AssetList
//         assets={assets}
//         onSell={sellAsset}
//       />
//     </div>
//   );
// }