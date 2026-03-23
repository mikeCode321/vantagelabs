import { Asset, DEFAULT_GROWTH_RATES } from "@/components/Dashboard/Assets/types";

export const API = "http://localhost:8000/api/finance/simulate/";

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 1,
    name: "Rental House",
    type: "house",
    value: 250000,
    downPayment: 50000,
    monthlyExpense: 1800,
    sold: false,
    compound: DEFAULT_GROWTH_RATES.house,
    year: 0,
  },
  {
    id: 2,
    name: "Gold Bar",
    type: "gold",
    value: 3000,
    downPayment: 0,
    monthlyExpense: 0,
    sold: false,
    compound: DEFAULT_GROWTH_RATES.gold,
    year: 0,
  },
];

export const CASH_ON_HAND_DEFAULTS = {
  start_cash: 0,
  net_income: 80000,
  income_growth: 0.03,
  expenses: 50000,
  expense_growth: 0.02,
  tiers: [{ threshold: 1000000, annual_rate: 0.03 }],
};
 