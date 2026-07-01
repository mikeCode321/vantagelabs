import { CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount,} from "@/app/dashboard/Accounts";
import { SalaryIncome, HourlyWageIncome, SideHustleIncome,  } from "@/app/dashboard/Incomes";
import { LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, } from "@/app/dashboard/Expenses";
import { HouseAsset, CarAsset } from "@/app/dashboard/Assets";

import { FilingStatus } from "@/app/dashboard/TutorialSteps";

export const LOCAL_STORAGE_KEY = "sim_request";
export const ENABLE_LOCAL_STORAGE_PERSISTENCE = true;

export type PresetAgeKey =
  | "now"
  | "retirement"
  | "end_of_plan"
  | "catch_up_contributions"
  | "rule_of_55"
  | "tax_deferred_access"
  | "social_security_early"
  | "medicare"
  | "social_security_full"
  | "social_security_max"
  | "rmd_age";

export type PresetAge = {
  key: PresetAgeKey;
  value: number;
  label: string;
  description: string;
  system: boolean;
  core: boolean;
};

export const SYSTEM_PRESET_AGES: PresetAge[] = [
  { key: "catch_up_contributions", value: 50, label: "50", description: "Catch-up retirement contributions become available", system: true, core: true },
  { key: "rule_of_55", value: 55, label: "55", description: "Rule of 55 eligibility for 401(k) withdrawals", system: true, core: true },
  { key: "tax_deferred_access", value: 59.5, label: "59.5", description: "Penalty-free retirement withdrawals generally begin", system: true, core: true },
  { key: "social_security_early", value: 62, label: "62", description: "Earliest Social Security retirement benefits", system: true, core: true },
  { key: "medicare", value: 65, label: "65", description: "Medicare eligibility", system: true, core: true },
  { key: "social_security_full", value: 67, label: "67", description: "Full Social Security retirement benefits", system: true, core: true },
  { key: "social_security_max", value: 70, label: "70", description: "Maximum Social Security benefit from delayed credits", system: true, core: true },
  { key: "rmd_age", value: 73, label: "73", description: "Required Minimum Distributions generally begin", system: true, core: true },
];

export function getPresetAge(state: any, key: PresetAgeKey): number {
  switch (key) {
    case "now":
      return Number(state?.user_start_age ?? 1);
    case "retirement":
      return Number(state?.user_retirement_age ?? 65);
    case "end_of_plan":
      return Number(state?.sim_end_age ?? (Number(state?.user_start_age ?? 1) + 100));
    default:
      return state?.preset_ages?.find((p: PresetAge) => p.key === key)?.value ??
        SYSTEM_PRESET_AGES.find((p) => p.key === key)?.value ?? 0;
  }
}

export function getAllPresetAges(state: any): PresetAge[] {
  const system = state?.preset_ages?.length
    ? state.preset_ages
    : SYSTEM_PRESET_AGES;
  return [
    { key: "now", value: getPresetAge(state, "now"), label: "Now", description: "Your current age", system: false, core: true },
    { key: "retirement", value: getPresetAge(state, "retirement"), label: "Retirement", description: "Your target retirement age", system: false, core: true },
    { key: "end_of_plan", value: getPresetAge(state, "end_of_plan"), label: "End of Plan", description: "End of simulation timeline", system: false, core: true },
    ...system,
  ];
}

export function migrateState(stored: any): SimRequest | null {
  if (!stored) return stored;
  return {
    ...stored,
    preset_ages: stored.preset_ages ?? SYSTEM_PRESET_AGES,
  };
}

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
  preset_ages: PresetAge[];
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
  preset_ages: SYSTEM_PRESET_AGES,
};

export function loadState() {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return null;
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(LOCAL_STORAGE_KEY);
    return s ? migrateState(JSON.parse(s)) : null;
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