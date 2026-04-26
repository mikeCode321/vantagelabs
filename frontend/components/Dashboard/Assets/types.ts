// Asset types mirror the backend AssetSource discriminated union
export type AssetSourceType = "rental"; // extend as more types added

export interface RentalAsset {
  source_type: "rental";
  id: string;
  name: string;
  purchase_price: number;
  down_payment: number;
  annual_appreciation: number;
  monthly_rent: number;
  monthly_expenses: number;
}

export type AssetSource = RentalAsset;

// UI display type — enriched with sim result values
export interface DisplayAsset {
  id: string;
  name: string;
  source_type: AssetSourceType;
  addedYear: number;
  soldYear?: number;
  // from sim result SourceSnapshot for this asset's id
  currentValue: number;       // asset_value from latest result, or purchase_price
  annualCashflow: number;     // rent - expenses (annual)
  // raw source for editing/resending
  source: AssetSource;
}

export const RENTAL_DEFAULTS = {
  annual_appreciation: 0.04,
  monthly_rent: 0,
  monthly_expenses: 0,
  down_payment: 0,
};