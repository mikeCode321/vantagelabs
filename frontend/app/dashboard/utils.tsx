import { CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount,} from "@/app/dashboard/Accounts";
import { SalaryIncome, HourlyWageIncome, SideHustleIncome,  } from "@/app/dashboard/Incomes";
import { LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, } from "@/app/dashboard/Expenses";
import { HouseAsset, CarAsset } from "@/app/dashboard/Assets";

import { FilingStatus } from "@/app/dashboard/TutorialSteps";

export const LOCAL_STORAGE_KEY = "sim_request";
export const ENABLE_LOCAL_STORAGE_PERSISTENCE = true;

export type SimRequest = {
  user_start_age: number;
  sim_end_age: number;
  user_retirement_age: number;
  filing_status: FilingStatus;
  state_of_residence: string;
  accounts: {
    checking: CheckingAccount[];
    taxable_investments: TaxableInvestmentAccount[];
    employer_retirement: EmployerRetirementAccount[];
  }
  incomes: {
    salary: SalaryIncome[];
    hourly: HourlyWageIncome[];
    side: SideHustleIncome[];
  };
  expenses: {
    living: LivingExpense[]; 
    rent: RentExpense[];
    car_loan: CarLoanExpense[];
    house_loan: HouseLoanExpense[];
    debt: DebtExpense[];
  };
  assets: {
    house: HouseAsset[];
    car: CarAsset[];
  };
};

export const INITIAL_STATE: SimRequest = {
  user_start_age: 25,
  sim_end_age: 125, // TODO: rename to sim_end_age
  user_retirement_age: 65,
  filing_status: "single",
  state_of_residence: "MI",

  accounts: {
    checking: [],
    taxable_investments: [],
    employer_retirement: [],
  },
  incomes: {
    salary: [],
    hourly: [],
    side: [],
  },
  expenses: {
    living: [],
    rent: [],
    house_loan: [],
    car_loan: [],
    debt: [],
  },
  assets: {
    house: [],
    car: [],
  },
};

export function loadState() {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return null;
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(LOCAL_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveState(state: SimRequest) {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save simulation request:", error);
  }
}

/* -------------------- Number Formatting Utilities -------------------- */

/**
 * Format a number string with commas every 3 digits (display only)
 */
export function formatNumberWithCommas(value: string): string {
  if (!value) return "";

  const isNegative = value.startsWith("-");
  const numStr = isNegative ? value.slice(1) : value;
  const [integerPart, decimalPart] = numStr.split(".");

  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = decimalPart ? `${withCommas}.${decimalPart}` : withCommas;

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Handle number input - keeps raw value in state, displays formatted
 */
export function handleNumberInput(e, setState) {
  let value = e.target.value;

  value = value.replace(/,/g, "");

  value = value.replace(/[^\d.\-]/g, "");

  const parts = value.split(".");
  if (parts.length > 2) return;

  setState(value);
}

export function handleTierThresholdInput(e, index, tiers, setTiers) {
  let value = e.target.value;
  value = value.replace(/,/g, "");
  value = value.replace(/[^\d.\-]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) return;

  const updated = [...tiers];
  updated[index].threshold = Number(value) || 0;
  setTiers(updated);
}