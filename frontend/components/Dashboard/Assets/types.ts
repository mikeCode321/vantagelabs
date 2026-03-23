export type AssetType = 'house' | 'gold' | 'car' 

export type Asset = {
    id: number;
    name: string;
    type: AssetType;
    value: number;
    downPayment?: number;
    monthlyExpense: number;
    sold: boolean;

    compound: number;
    year: number;

    soldYear?: number;
    soldValue?: number;
    

};

export type NewAsset= {

    name: string;
    type: AssetType;
    value: number;
    downPayment?: number;
    monthlyExpense: number;
    compound: number;
    year: number;

}


export const DEFAULT_GROWTH_RATES: Record<AssetType, number> = {
  house: 0.04,
  gold:  0.02,
  car:   -0.10,
};