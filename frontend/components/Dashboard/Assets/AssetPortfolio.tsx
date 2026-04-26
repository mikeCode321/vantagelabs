// "use client";
// import { useState } from "react";
// import type { AssetSource, DisplayAsset, RentalAsset } from "./types";
// import { RENTAL_DEFAULTS } from "./types";

// /* =========================
//    SHARED HELPERS
// ========================= */

// function formatCurrency(value: number): string {
//   return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
// }

// /* =========================
//    AssetSummary
// ========================= */

// type AssetSummaryProps = {
//   totalAssetValue: number;
//   totalMonthlyCashflow: number;
//   ownedCount: number;
// };

// function AssetSummary({ totalAssetValue, totalMonthlyCashflow, ownedCount }: AssetSummaryProps) {
//   const formattedValue = formatCurrency(totalAssetValue);
//   const formattedCashflow = formatCurrency(totalMonthlyCashflow);
//   const cashflowPrefix = totalMonthlyCashflow >= 0 ? "+" : "";

//   return (
//     <section className="asset-summary">
//       <p className="asset-summary-label">Portfolio Value</p>
//       <p className="asset-summary-value">${formattedValue}</p>
//       <p className="asset-summary-meta">
//         {ownedCount} owned · {cashflowPrefix}${formattedCashflow}/mo cashflow
//       </p>
//     </section>
//   );
// }

// /* =========================
//    AssetActions
// ========================= */
// type AssetActionsProps = {
//   onAddAsset: (source: AssetSource) => void;
// };

// function AssetActions({ onAddAsset }: AssetActionsProps) {
//   type FormState = {
//     name: string;
//     purchase_price: string;
//     down_payment: string;
//     annual_appreciation: string;
//     monthly_rent: string;
//     monthly_expenses: string;
//   };

//   const EMPTY_FORM_STATE: FormState = {
//     name: "",
//     purchase_price: "",
//     down_payment: "",
//     annual_appreciation: String(RENTAL_DEFAULTS.annual_appreciation),
//     monthly_rent: "",
//     monthly_expenses: "",
//   };

//   const [formState, setFormState] = useState<FormState>(EMPTY_FORM_STATE);

//   const FORM_FIELDS: {
//     label: string;
//     name: keyof FormState;
//     placeholder: string;
//     type?: string;
//     step?: string;
//   }[] = [
//     { label: "Property Name", name: "name", placeholder: "123 Main St", type: "text" },
//     { label: "Purchase Price", name: "purchase_price", placeholder: "300000", type: "number" },
//     { label: "Down Payment", name: "down_payment", placeholder: "60000", type: "number" },
//     { label: "Annual Appreciation", name: "annual_appreciation", placeholder: "0.04", type: "number", step: "0.01" },
//     { label: "Monthly Rent", name: "monthly_rent", placeholder: "2200", type: "number" },
//     { label: "Monthly Expenses", name: "monthly_expenses", placeholder: "800", type: "number" },
//   ];

//   function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
//     const fieldName = event.target.name as keyof FormState;
//     const fieldValue = event.target.value;

//     setFormState((previousState) => ({
//       ...previousState,
//       [fieldName]: fieldValue,
//     }));
//   }

//   function handleSubmit(event: React.FormEvent) {
//     event.preventDefault();

//     const trimmedName = formState.name.trim();
//     if (!trimmedName) return;

//     const newAsset: RentalAsset = {
//       source_type: "rental",
//       id: `rental_${Date.now()}`,
//       name: trimmedName,
//       purchase_price: Number(formState.purchase_price) || 0,
//       down_payment: Number(formState.down_payment) || 0,
//       annual_appreciation: Number(formState.annual_appreciation) || RENTAL_DEFAULTS.annual_appreciation,
//       monthly_rent: Number(formState.monthly_rent) || 0,
//       monthly_expenses: Number(formState.monthly_expenses) || 0,
//     };

//     onAddAsset(newAsset);
//     setFormState(EMPTY_FORM_STATE);
//   }

//   return (
//     <section className="asset-form-wrap">
//       <form onSubmit={handleSubmit}>
//         <div className="asset-form-grid">
//           {FORM_FIELDS.map((field) => {
//             const value = formState[field.name];

//             return (
//               <div className="asset-field" key={field.name}>
//                 <label className="asset-label">{field.label}</label>
//                 <input className="asset-input" name={field.name} type={field.type ?? "number"} step={field.step} value={value} onChange={handleInputChange} placeholder={field.placeholder} />
//               </div>
//             );
//           })}
//         </div>

//         <div className="asset-form-actions">
//           <button type="submit" className="asset-button asset-button-teal">
//             Add Asset
//           </button>
//         </div>
//       </form>
//     </section>
//   );
// }

// /* =========================
//    AssetList
// ========================= */

// type AssetListProps = {
//   assets: DisplayAsset[];
//   currentYear: number;
//   onSell: (id: string) => void;
// };

// function AssetList({ assets, currentYear, onSell }: AssetListProps) {
//   if (assets.length === 0) {
//     return <div className="asset-empty">No assets added yet</div>;
//   }

//   return (
//     <section className="asset-list">
//       {assets.map((asset) => {
//         const isSold = asset.soldYear !== undefined && asset.soldYear <= currentYear;

//         const rentalSource = asset.source as RentalAsset;

//         const monthlyCashflow = asset.annualCashflow / 12;
//         const formattedValue = formatCurrency(asset.currentValue);
//         const formattedCashflow = formatCurrency(monthlyCashflow);
//         const cashflowPrefix = monthlyCashflow >= 0 ? "+" : "";

//         return (
//           <article key={asset.id} className="asset-row">
//             <div className="asset-row-main">
//               <p className="asset-row-name">{asset.name}</p>
//               <p className="asset-row-meta">
//                 rental · {(rentalSource.annual_appreciation * 100).toFixed(1)}%/yr
//                 {monthlyCashflow !== 0 && (
//                   <>
//                     {" "}
//                     · {cashflowPrefix}${formattedCashflow}/mo
//                   </>
//                 )}
//               </p>
//             </div>

//             <div className="asset-row-side">
//               <p className="asset-row-value">${formattedValue}</p>

//               <div className="asset-row-actions">
//                 <span className={isSold ? "asset-status asset-status-sold" : "asset-status"}>{isSold ? "Sold" : "Owned"}</span>

//                 {!isSold && (
//                   <button type="button" className="asset-btn-ghost" onClick={() => onSell(asset.id)}>
//                     Sell
//                   </button>
//                 )}
//               </div>
//             </div>
//           </article>
//         );
//       })}
//     </section>
//   );
// }

// /* =========================
//    MAIN: AssetPortfolio
// ========================= */

// type AssetEntry = {
//   id: string;
//   addedYear: number;
//   soldYear?: number;
//   source: AssetSource;
// };

// type SimYearResult = {
//   sources: {
//     id: string;
//     asset_value: number;
//     annual_cashflow: number;
//   }[];
// };

// type AssetPortfolioProps = {
//   assets: AssetEntry[];
//   currentYear: number;
//   currentResult?: SimYearResult;
//   onAddAsset: (source: AssetSource) => void;
//   onSellAsset: (id: string) => void;
// };

// function AssetPortfolio({ assets, currentYear, currentResult, onAddAsset, onSellAsset }: AssetPortfolioProps) {
//   const [isFormVisible, setIsFormVisible] = useState(false);

//   const displayAssets: DisplayAsset[] = assets.map((assetEntry) => {
//     const snapshot = currentResult?.sources.find((source) => source.id === assetEntry.id);

//     const rentalSource = assetEntry.source as RentalAsset;

//     const currentValue = snapshot?.asset_value ?? rentalSource.purchase_price;

//     const annualCashflow = snapshot?.annual_cashflow ?? (rentalSource.monthly_rent - rentalSource.monthly_expenses) * 12;

//     return {
//       id: assetEntry.id,
//       name: rentalSource.name,
//       source_type: rentalSource.source_type,
//       addedYear: assetEntry.addedYear,
//       soldYear: assetEntry.soldYear,
//       currentValue,
//       annualCashflow,
//       source: assetEntry.source,
//     };
//   });

//   const ownedAssets = displayAssets.filter((asset) => {
//     const notSoldYet = asset.soldYear === undefined;
//     const soldInFuture = asset.soldYear !== undefined && asset.soldYear > currentYear;
//     return notSoldYet || soldInFuture;
//   });

//   const totalAssetValue = ownedAssets.reduce((total, asset) => total + asset.currentValue, 0);

//   const totalMonthlyCashflow = ownedAssets.reduce((total, asset) => total + asset.annualCashflow / 12, 0);

//   function toggleFormVisibility() {
//     setIsFormVisible((previous) => !previous);
//   }

//   function handleAddAsset(source: AssetSource) {
//     onAddAsset(source);
//     setIsFormVisible(false);
//   }

//   return (
//     <section className="asset-panel">
//       <div className="asset-panel-header">
//         <h2 className="asset-panel-title">Asset Portfolio</h2>
//         <button type="button" className="asset-button asset-button-teal" onClick={toggleFormVisibility}>
//           {isFormVisible ? "Close" : "+ Add Asset"}
//         </button>
//       </div>

//       <AssetSummary totalAssetValue={totalAssetValue} totalMonthlyCashflow={totalMonthlyCashflow} ownedCount={ownedAssets.length} />

//       {isFormVisible && <AssetActions onAddAsset={handleAddAsset} />}

//       <AssetList assets={displayAssets} currentYear={currentYear} onSell={onSellAsset} />
//     </section>
//   );
// }

// export default AssetPortfolio;
