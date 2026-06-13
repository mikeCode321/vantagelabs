"use client";
import "./styles/Dashboard.css";

import { useState, useReducer, useEffect } from "react";
import { Audio } from "react-loader-spinner";
// import JsonView from "@uiw/react-json-view";
// import UserAgeForm from "@/app/visuals/UserAgeForm";

import { CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount, LiquidAccount, CheckingAccountForm, TaxableInvestmentAccountForm, EmployerRetirementAccountForm, EditEmployerRetirementAccountForm, EditTaxableInvestmentAccountForm, EditCheckingAccountForm } from "@/app/visuals/Accounts";
import { SalaryIncome, HourlyWageIncome, SideHustleIncome, IncomeSource, SalaryForm, HourlyWageForm, SideHustleForm, EditSalaryForm, EditHourlyWageForm, EditSideHustleForm } from "@/app/visuals/Incomes";
import { LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, ExpenseSource, LivingExpensesForm, RentExpenseForm, DebtExpenseForm, HouseLoanExpenseForm, CarLoanExpenseForm, EditHouseLoanExpenseForm, EditCarLoanExpenseForm, EditLivingExpensesForm, EditRentExpenseForm, EditDebtExpenseForm } from "@/app/visuals/Expenses";
import { HouseAsset, CarAsset, AssetSource, HouseAssetForm, CarAssetForm, EditHouseAssetForm, EditCarAssetForm } from "@/app/visuals/Assets";
import { TutorialOnboarding, TutorialStepId } from "@/app/visuals/TutorialSteps";

import FeedbackFormModal from "@/app/visuals/FeedbackFormModal";
import SimulationControls from "@/app/visuals/SimulationControls";
import ToastBanner from "@/app/visuals/ToastBanner";
import EntitiesContainer from "@/app/visuals/EntitiesContainer";
import SimulationHighlightsCard from "@/app/visuals/SimulationHighlightsCard";

import SideBar from '@/app/visuals/SideBar';
import FinancialOverviewContainer from "@/app/visuals/FinancialOverviewContainer";
import GrowthChart from '@/app/visuals/GrowthChart';

import { formatCompactMoney, formatSignedPercent, getPercentChange, getChangeDirection, getReadableTrend, } from "@/app/visuals/FinancialOverviewContainer";
import { CircleDollarSign,ChartNoAxesCombined ,ChartPie , HandCoins, CreditCard, ChartColumnIncreasing , Accessibility, Luggage, Clock, Rocket, House,BanknoteArrowDown,ShoppingCart ,Car, HousePlus } from 'lucide-react';

type SimRequest = {
  user_start_age: number;
  user_end_age: number;
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

type Action =
  | { type: "HYDRATE_FROM_LOCAL_STORAGE"; payload: SimRequest }
  | { type: "ADD_ACCOUNT"; payload: LiquidAccount }
  | { type: "UPDATE_ACCOUNT"; payload: LiquidAccount }
  | { type: "DELETE_ACCOUNT"; payload: { id: string; variant: "checking" | "taxable_investments" | "employer_retirement" } }
  | { type: "ADD_INCOME"; payload: IncomeSource }
  | { type: "UPDATE_INCOME"; payload: IncomeSource }
  | { type: "DELETE_INCOME"; payload: { id: string; variant: "salary" | "hourly" | "side" } }
  | { type: "ADD_EXPENSE"; payload: ExpenseSource }
  | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
  | { type: "DELETE_EXPENSE"; payload: { id: string; variant: "living" | "rent" | "debt" } }
  | { type: "ADD_ASSET"; payload: AssetSource }
  | { type: "UPDATE_ASSET"; payload: AssetSource }
  | { type: "DELETE_ASSET"; payload: { id: string; variant: "house" | "car" } }
  | { type: "UPDATE_SIMULATION_BOUNDS"; payload: { user_start_age: number; user_end_age: number } };

function simReducer(state: SimRequest, action: Action): SimRequest {
  switch (action.type) {

    case "HYDRATE_FROM_LOCAL_STORAGE": {
      return action.payload
    }

    case "ADD_ACCOUNT": {
      const account = action.payload;
      const variant: "checking" | "taxable_investments" | "employer_retirement" = account.variant;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: [...state.accounts[variant], account],
        },
      };
    }

    case "UPDATE_ACCOUNT": {
      const account = action.payload;
      const variant: "checking" | "taxable_investments" | "employer_retirement" = account.variant;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: state.accounts[variant].map((a) => (a.id === account.id ? account : a)),
        },
      };
    }

    case "DELETE_ACCOUNT": {
      const { id, variant } = action.payload;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [variant]: state.accounts[variant].filter((a) => a.id !== id),
        },
      };
    }

    // INCOME  ==================
    case "ADD_INCOME": {
      const income = action.payload;
      const variant: "salary" | "hourly" | "side" = income.variant;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: [...state.incomes[variant], income],
        },
      };
    }

    case "UPDATE_INCOME": {
      const income = action.payload;
      const variant: "salary" | "hourly" | "side" = income.variant;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: state.incomes[variant].map((i) => (i.id === income.id ? income : i)),
        },
      };
    }

    case "DELETE_INCOME": {
      const { id, variant } = action.payload;
      return {
        ...state,
        incomes: {
          ...state.incomes,
          [variant]: state.incomes[variant].filter((i) => i.id !== id),
        },
      };
    }

    // EXPENSE  ==================
    case "ADD_EXPENSE": {
      const expense = action.payload;
      const variant: "living" | "rent" | "debt" | "house_loan" | "car_loan" = expense.variant;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: [...state.expenses[variant], expense],
        },
      };
    }

    case "UPDATE_EXPENSE": {
      const expense = action.payload;
      const variant: "living" | "rent" | "debt" | "house_loan" | "car_loan" = expense.variant;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: state.expenses[variant].map((e) => (e.id === expense.id ? expense : e)),
        },
      };
    }

    case "DELETE_EXPENSE": {
      const { id, variant } = action.payload;
      return {
        ...state,
        expenses: {
          ...state.expenses,
          [variant]: state.expenses[variant].filter((e) => e.id !== id),
        },
      };
    }

    // ASSET  ==================
    case "ADD_ASSET": {
      const asset = action.payload;
      const variant = asset.variant;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: [...state.assets[variant], asset],
        },
      };
    }

    case "UPDATE_ASSET": {
      const asset = action.payload;
      const variant = asset.variant;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: state.assets[variant].map((a) => (a.id === asset.id ? asset : a)),
        },
      };
    }

    case "DELETE_ASSET": {
      const { id, variant } = action.payload;
      return {
        ...state,
        assets: {
          ...state.assets,
          [variant]: state.assets[variant].filter((a) => a.id !== id),
        },
      };
    }

    case "UPDATE_SIMULATION_BOUNDS": {
      const { user_start_age, user_end_age } = action.payload;
      return { ...state, user_start_age, user_end_age };
    }

    default:
      return state;
  }
}

const INITIAL_STATE: SimRequest = {
  user_start_age: 25,
  user_end_age: 65,

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
// our sim_request
const LOCAL_STORAGE_KEY = "sim_request";
const SIM_RESULT_KEY = "sim_result";
const ENABLE_LOCAL_STORAGE_PERSISTENCE = true;

const ENABLE_TUTORIAL = true;
const TUTORIAL_COMPLETED_KEY = "tutorial_v1_completed";

function loadTutorialCompleted() {
  if (typeof window === "undefined") return true;

  try {
    const saved = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    return saved === "true";
  } catch {
    return false;
  }
}

function loadState(){
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return null;
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SimRequest) : null;
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
}

function loadSimResult() {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return null;
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(SIM_RESULT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem(SIM_RESULT_KEY);
    return null;
  }
}

function saveTutorialCompleted() {
  if (!ENABLE_TUTORIAL) return;
  if (typeof window === "undefined") return;

  localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
}

function saveSimResult(result: unknown) {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SIM_RESULT_KEY, JSON.stringify(result));
  } catch (error) {
    console.error("Failed to save sim result:", error);
  }
}

function saveState(state: SimRequest) {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save simulation request:", error);
  }
}

const ENTITY_CONFIG = {
  account: {
    checking: {
      id: "checking",
      name: "Checking",
      description: "Track your checking account balance and tiered interest rates.",
      emoji: <CreditCard/>,
      formComponent: CheckingAccountForm,
      editFormComponent: EditCheckingAccountForm,
    },
    taxable_investments: {
      id: "taxable_investments",
      name: "Taxable Investments",
      description: "Add brokerage accounts, stocks, ETFs, or other taxable investment balances.",
      emoji: <ChartColumnIncreasing/>,
      formComponent: TaxableInvestmentAccountForm,
      editFormComponent: EditTaxableInvestmentAccountForm,
    },
    employer_retirement: {
      id: "employer_retirement",
      name: "Employer Retirement Accounts",
      description: "Track your 401(k), 403(b), or pension and optionally link it to a job.",
      emoji: <Accessibility/>,
      formComponent: EmployerRetirementAccountForm,
      editFormComponent: EditEmployerRetirementAccountForm,
    },
  },

  income: {
    salary: {
      id: "salary",
      name: "Salary",
      description: "Track your employment income and annual growth rate.",
      emoji: <Luggage/>,
      formComponent: SalaryForm,
      editFormComponent: EditSalaryForm,
    },
    hourly: {
      id: "hourly",
      name: "Hourly Wage",
      description: "Track hourly income, weekly hours, and projected growth.",
      emoji: <Clock/>,
      formComponent: HourlyWageForm,
      editFormComponent: EditHourlyWageForm,
    },
    side: {
      id: "side",
      name: "Side Hustle",
      description: "Add extra income from freelance work, gigs and side businesses with variability",
      emoji: <Rocket/>,
      formComponent: SideHustleForm,
      editFormComponent: EditSideHustleForm,
    },
  },

  expense: {
    living: {
      id: "living",
      name: "Living Expenses",
      description: "Add monthly living costs like groceries, utilities, and other essentials.",
      emoji: <ShoppingCart  />,
      iconTone: "purple",
      formComponent: LivingExpensesForm,
      editFormComponent: EditLivingExpensesForm,
    },
    rent: {
      id: "rent",
      name: "Rent",
      description: "Add your monthly rent or housing payments.",
      emoji: <BanknoteArrowDown/>,
      iconTone: "blue",
      formComponent: RentExpenseForm,
      editFormComponent: EditRentExpenseForm,
    },
    debt: {
      id: "debt",
      name: "Debt",
      description: "Add credit card debt, personal loans, or other liabilities.",
      emoji: <HandCoins/>,
      iconTone: "teal",
      formComponent: DebtExpenseForm,
      editFormComponent: EditDebtExpenseForm,
    },
    house_loan: {
      id: "house_loan",
      name: "Home Loan",
      description: "Add your mortgage.",
      emoji: <House/>,
      iconTone: "green",
      formComponent: HouseLoanExpenseForm,
      editFormComponent: EditHouseLoanExpenseForm,
    },
    car_loan: {
      id: "car_loan",
      name: "Car Loan",
      description: "Add your car loan.",
      emoji: <Car/>,
      iconTone: "orange",
      formComponent: CarLoanExpenseForm,
      editFormComponent: EditCarLoanExpenseForm,
    },
  },

  asset: {
    house: {
      id: "house",
      name: "House",
      description: "Track a property asset with appreciation and optional down payment.",
      emoji: <HousePlus/>,
      formComponent: HouseAssetForm,
      editFormComponent: EditHouseAssetForm,
    },
    car: {
      id: "car",
      name: "Car",
      description: "Track a vehicle asset with depreciation and optional down payment.",
      emoji: <Car/>,
      formComponent: CarAssetForm,
      editFormComponent: EditCarAssetForm,
    },
  },
};


export default function Dashboard() {
  // const sim = useSimulation();
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
  const [simResult, setSimResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isSimLoading, setIsSimLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  //tutorial stuff
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorialStepId, setActiveTutorialStepId] = useState<TutorialStepId | null>(null);

  const showToast = (entityName: string, action: "added" | "edited" | "deleted") => {
    const id = crypto.randomUUID();
    const message = `${entityName} ${action} successfully`;

    setToasts((prev) => [...prev, { id, message, entityName, action, type: "success" }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

  const simData = Array.isArray(simResult) ? null : simResult;

  const firstYear = simData?.year_results[0];
  const lastYear  = simData?.year_results[simData.year_results.length - 1];

  const startingNetWorth = simData?.metrics.starting_net_worth ?? 0;
  const endingNetWorth   = simData?.metrics.ending_net_worth   ?? 0;

  const startingCashFlow = firstYear?.income_earned.net ?? 0;
  const endingCashFlow   = lastYear?.income_earned.net  ?? 0;

  const startingAssets   = firstYear?.assets.total_value ?? 0;
  const totalAssets      = lastYear?.assets.total_value  ?? 0;

  const startingLiabilities = (firstYear?.expenses.total_monthly ?? 0) * 12;
  const totalLiabilities    = (lastYear?.expenses.total_monthly  ?? 0) * 12;

  const annualCashFlow = endingCashFlow - totalLiabilities;

  const netWorthChange  = getPercentChange(startingNetWorth,   endingNetWorth);
  const cashFlowChange  = getPercentChange(startingCashFlow,   endingCashFlow);
  const assetChange     = getPercentChange(startingAssets,     totalAssets);
  const liabilityChange = getPercentChange(startingLiabilities, totalLiabilities);

  const overviewCards = [
    {
      id: "net-worth",
      label: "Net Worth",
      value: formatCompactMoney(endingNetWorth),
      change: formatSignedPercent(netWorthChange),
      changeLabel: "vs start",
      meta: getReadableTrend(startingNetWorth, endingNetWorth, "Net worth"),
      icon: <ChartNoAxesCombined/>,
      tone: "purple",
      direction: getChangeDirection(startingNetWorth, endingNetWorth),
    },
    {
      id: "cash-flow",
      label: "Cash Flow (Annual)",
      value: formatCompactMoney(annualCashFlow),
      change: formatSignedPercent(cashFlowChange),
      changeLabel: "vs first year",
      meta: lastYear
        ? `Inflows ${formatCompactMoney(lastYear.income_earned.gross)} · Taxes ${formatCompactMoney(lastYear.income_earned.taxes_paid)}`
        : "Run simulation to see data",
      icon: <CircleDollarSign/>,
      tone: "green",
      direction: getChangeDirection(startingCashFlow, endingCashFlow),
    },
    {
      id: "total-assets",
      label: "Total Assets",
      value: formatCompactMoney(totalAssets),
      change: formatSignedPercent(assetChange),
      changeLabel: "vs start",
      meta: lastYear
        ? `${lastYear.assets.assets.length} assets`
        : "Run simulation to see data",
      icon: <ChartPie/>,
      tone: "blue",
      direction: getChangeDirection(startingAssets, totalAssets),
    },
    {
      id: "total-liabilities",
      label: "Total Liabilities",
      value: formatCompactMoney(totalLiabilities),
      change: formatSignedPercent(liabilityChange),
      changeLabel: "vs start",
      meta: lastYear
        ? `${lastYear.expenses.expenses.length} liabilities`
        : "Run simulation to see data",
      icon: <HandCoins/>,
      tone: "orange",
      direction: getChangeDirection(startingLiabilities, totalLiabilities),
    },
  ];

  const handleTutorialComplete = () => {
    saveTutorialCompleted();
    setShowTutorial(false);
    setActiveTutorialStepId(null);
  };

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      dispatch({ type: "HYDRATE_FROM_LOCAL_STORAGE", payload: saved });
    }

    const savedResult = loadSimResult();

    const timer = setTimeout(() => {
      if (savedResult) setSimResult(savedResult);
      setIsSimLoading(false);
      const tutorialCompleted = loadTutorialCompleted();
      if (ENABLE_TUTORIAL && !tutorialCompleted) {
        setShowTutorial(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (simResult) saveSimResult(simResult);
  }, [simResult]);

  return (
    <div className="dash-root" data-active-tutorial-step={activeTutorialStepId ?? ""}>
      {isSimLoading && ENABLE_LOCAL_STORAGE_PERSISTENCE && (
        <div className="dash-loading-overlay">
          <Audio height="100" width="100" color="#6d28d9" ariaLabel="audio-loading" visible={true} />
        </div>
      )}

      {showTutorial && ENABLE_TUTORIAL && (
        <TutorialOnboarding
          state={state}
          dispatch={dispatch}
          onComplete={handleTutorialComplete}
          onToast={showToast}
          onStepChange={setActiveTutorialStepId}
          onProfileComplete={(profile, mode) => {
            dispatch({ type: "UPDATE_SIMULATION_BOUNDS", payload: { user_start_age: profile.current_age, user_end_age: profile.retirement_age } });
            if (mode === "skipped") handleTutorialComplete();
          }}
        />
      )}

      <SideBar setIsFeedbackOpen={setIsFeedbackOpen} />
      <FeedbackFormModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">AdVantage on Finances</h1>
          </div>
        </header>
        
        {/* <div style={{ display: "flex", justifyContent: "space-between"}}>
          <pre suppressHydrationWarning>{JSON.stringify(state, null, 2)}</pre>
          
          {simResult ? <JsonView
            value={simResult}
            collapsed={2}
            displayDataTypes={false}
            displayObjectSize={false}
            shortenTextAfterLength={40}
          />: "[]"}
          <UserAgeForm state={state} dispatch={dispatch} />
        </div>  */}
       
        <FinancialOverviewContainer cards={overviewCards} tutorialActive={activeTutorialStepId === "results"}/>
        <section className="simulation-results-grid">
          <GrowthChart data={simResult} tutorialActive={activeTutorialStepId === "results"} />
          <div>
            <SimulationHighlightsCard data={simData} tutorialActive={activeTutorialStepId === "results"}/>
            <SimulationControls state={state} setSimResult={setSimResult} activeTutorialStepId={activeTutorialStepId} />
          </div>
        </section>

        <section className="simulation-section-header">
          <h2>Simulation Inputs</h2>
          <p>Define the components of your financial plan for the simulation.</p>
        </section>

        <EntitiesContainer state={state} dispatch={dispatch} onToast={showToast} tutorialStepId={activeTutorialStepId} ENTITY_CONFIG={ENTITY_CONFIG} />
        <ToastBanner toasts={toasts} setToasts={setToasts} />
      </main>
    </div>
  );
}