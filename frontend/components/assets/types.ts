export type AssetType = 'house' | 'gold' | 'car' 

export type Asset = {
    id: number;
    name: string;
    type: AssetType;
    value: number;
    downPayment?: number;
    monthlyExpense: number;
    sold: boolean;
    

};