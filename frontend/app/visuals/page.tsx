"use client";
import "./dashboard.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Audio } from "react-loader-spinner";

import { useState, useReducer, useEffect, useRef } from "react";

import { CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount, LiquidAccount, CheckingAccountForm, TaxableInvestmentAccountForm, EmployerRetirementAccountForm, EditEmployerRetirementAccountForm, EditTaxableInvestmentAccountForm, EditCheckingAccountForm } from "@/app/visuals/accounts";

import { SalaryIncome, HourlyWageIncome, SideHustleIncome, IncomeSource, SalaryForm, HourlyWageForm, SideHustleForm, EditSalaryForm, EditHourlyWageForm, EditSideHustleForm } from "@/app/visuals/incomes";

import { LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, ExpenseSource, LivingExpensesForm, RentExpenseForm, DebtExpenseForm, HouseLoanExpenseForm, CarLoanExpenseForm, EditHouseLoanExpenseForm, EditCarLoanExpenseForm, EditLivingExpensesForm, EditRentExpenseForm, EditDebtExpenseForm } from "@/app/visuals/expenses";

import { HouseAsset, CarAsset, AssetSource, HouseAssetForm, CarAssetForm, EditHouseAssetForm, EditCarAssetForm } from "@/app/visuals/assets";

import { FeedbackModal, SimulationControls, Toast, ToastBanner, UserAgeForm } from "@/app/visuals/misc";

import { formatNumberWithCommas } from "@/app/visuals/utils";

import { SimulationHighlights } from "@/app/visuals/SimulationHighlights";
import { TutorialOnboarding, tutorialSteps, TutorialStepId } from "@/app/visuals/TutorialSteps";

import JsonView from "@uiw/react-json-view";
import { FinancialOverviewCards, OverviewCard, formatCompactMoney, formatSignedPercent, getPercentChange, getChangeDirection, getReadableTrend, } from "@/app/visuals/FinancialOverviewCards";

import IncomeGrowthChart from '@/app/visuals/incomeGrowthChart'

type SimRequest = {
  user_start_age: number;
  user_end_age: number;
  accounts: {
    checking: CheckingAccount[];
    taxable_investments: TaxableInvestmentAccount[];
    employer_retirement: EmployerRetirementAccount[];
  };
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
const ENABLE_LOCAL_STORAGE_PERSISTENCE = true;
 // tutorial feature flag

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

function saveTutorialCompleted() {
  if (!ENABLE_TUTORIAL) return;
  if (typeof window === "undefined") return;

  localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
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

function saveState(state: SimRequest) {
  if (!ENABLE_LOCAL_STORAGE_PERSISTENCE) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save simulation request:", error);
  }
}

// ENTITY DATA:
const ENTITY_CONFIG = {
  account: {
    checking: {
      id: "checking",
      name: "Checking",
      description: "Track your checking account balance and tiered interest rates.",
      emoji: "💳",
      formComponent: CheckingAccountForm,
      editFormComponent: EditCheckingAccountForm,
    },
    taxable_investments: {
      id: "taxable_investments",
      name: "Taxable Investments",
      description: "Add brokerage accounts, stocks, ETFs, or other taxable investment balances.",
      emoji: "📊",
      formComponent: TaxableInvestmentAccountForm,
      editFormComponent: EditTaxableInvestmentAccountForm,
    },
    employer_retirement: {
      id: "employer_retirement",
      name: "Employer Retirement Accounts",
      description: "Track your 401(k), 403(b), or pension and optionally link it to a job.",
      emoji: "🏢",
      formComponent: EmployerRetirementAccountForm,
      editFormComponent: EditEmployerRetirementAccountForm,
    },
  },

  income: {
    salary: {
      id: "salary",
      name: "Salary",
      description: "Track your employment income and annual growth rate.",
      emoji: "💼",
      formComponent: SalaryForm,
      editFormComponent: EditSalaryForm,
    },
    hourly: {
      id: "hourly",
      name: "Hourly Wage",
      description: "Track hourly income, weekly hours, and projected growth.",
      emoji: "⏱️",
      formComponent: HourlyWageForm,
      editFormComponent: EditHourlyWageForm,
    },
    side: {
      id: "side",
      name: "Side Hustle",
      description: "Add extra income from freelance work, gigs and side businesses with variability",
      emoji: "🚀",
      formComponent: SideHustleForm,
      editFormComponent: EditSideHustleForm,
    },
  },

  expense: {
    living: {
      id: "living",
      name: "Living Expenses",
      description: "Add monthly living costs like groceries, utilities, and other essentials.",
      emoji: "🏠",
      iconTone: "purple",
      formComponent: LivingExpensesForm,
      editFormComponent: EditLivingExpensesForm,
    },
    rent: {
      id: "rent",
      name: "Rent",
      description: "Add your monthly rent or housing payments.",
      emoji: "🏢",
      iconTone: "blue",
      formComponent: RentExpenseForm,
      editFormComponent: EditRentExpenseForm,
    },
    debt: {
      id: "debt",
      name: "Debt",
      description: "Add credit card debt, personal loans, or other liabilities.",
      emoji: "💳",
      iconTone: "teal",
      formComponent: DebtExpenseForm,
      editFormComponent: EditDebtExpenseForm,
    },
    house_loan: {
      id: "house_loan",
      name: "Home Loan",
      description: "Add your mortgage.",
      emoji: "🏡",
      iconTone: "green",
      formComponent: HouseLoanExpenseForm,
      editFormComponent: EditHouseLoanExpenseForm,
    },
    car_loan: {
      id: "car_loan",
      name: "Car Loan",
      description: "Add your car loan.",
      emoji: "🚗",
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
      emoji: "🏡",
      formComponent: HouseAssetForm,
      editFormComponent: EditHouseAssetForm,
    },
    car: {
      id: "car",
      name: "Car",
      description: "Track a vehicle asset with depreciation and optional down payment.",
      emoji: "🚗",
      formComponent: CarAssetForm,
      editFormComponent: EditCarAssetForm,
    },
  },
};

/* -------------------- Modal -------------------- */

export function EntityModalCell({ item, setSelectedVariant }) {
  return (
    <button
      type="button"
      className="entity-select-card"
      onClick={() => setSelectedVariant(item.id)}
    >
      <span className={`entity-select-card__icon entity-select-card__icon--${item.iconTone ?? "purple"}`}>
        {item.emoji}
      </span>

      <span className="entity-select-card__copy">
        <span className="entity-select-card__title">{item.name}</span>
        <span className="entity-select-card__desc">
          {item.description ?? "Add this item to your simulation."}
        </span>
      </span>
    </button>
  );
}

export function Modal({ setIsModalOpen, data, category, dispatch, variantBeingEdited, state, onToast }) {

  
  const [selectedVariant, setSelectedVariant] = useState(variantBeingEdited?.variant || null);

  const goBack = () => setSelectedVariant(null);
  const closeModal = () => setIsModalOpen(false);

  const FormComponent = selectedVariant ? (variantBeingEdited ? ENTITY_CONFIG[category][selectedVariant]?.editFormComponent : ENTITY_CONFIG[category][selectedVariant]?.formComponent) : null;
  const MODAL_COPY = {
    account: {
      icon: "🏛️",
      title: "Choose an account type",
      description: "Select the account you want to add to your simulation.",
    },
    income: {
      icon: "💼",
      title: "Choose an income type",
      description: "Select the income source you want to add to your simulation.",
    },
    expense: {
      icon: "💳",
      title: "Choose an expense type",
      description: "Select the expense you want to add to your simulation.",
    },
    asset: {
      icon: "◔",
      title: "Choose an asset type",
      description: "Select the asset you want to add to your simulation.",
    },
  };
  const modalCopy = MODAL_COPY[category];

  let renderedForm;

  if (selectedVariant) {
    if (!FormComponent) {
      renderedForm = <div>Form not implemented</div>;
    } else if (variantBeingEdited) {
      // i'm not sure how passing state for one edit form doesn't affect others check on this, but it works for now
      renderedForm = <FormComponent item={variantBeingEdited} state={state} dispatch={dispatch} onClose={closeModal} onToast={onToast} />;
    } else {
      renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} onToast={onToast} />;
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">

      {!selectedVariant && !variantBeingEdited && (
          <>
            <div className="entity-select-header">
              <div className="entity-select-header__icon">
                {modalCopy.icon}
              </div>
              

              <div className="entity-select-header__copy">
                <h2>{modalCopy.title}</h2>
                <p>{modalCopy.description}</p>
              </div>

              <button className="entity-select-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="entity-select-grid">
              {data.map((item) => (
                <EntityModalCell
                  key={item.id}
                  item={item}
                  setSelectedVariant={setSelectedVariant}
                />
              ))}
            </div>
  
          </>
        )}

        {/* EDIT FORM HEADER */}
        {variantBeingEdited && (
          <div className="modal-header">
            {/* <div>icon + title + description</div> */}

            <button className="modal-close" onClick={closeModal}>
            ×
            </button>
          </div>
        )}

        {/* ENTITY SOURCE SELECTION MODAL */}
        {selectedVariant && !variantBeingEdited && (
        <div className="modal-header">
          <button className="modal-back" onClick={goBack}>
            ← Back
          </button>

          <button className="entity-select-close" onClick={closeModal}>
            ×
          </button>
        </div>
      )}
        

        {/* EDIT/ADD MODAL */}
        {renderedForm}
      </div>
    </div>
  );
}

/* -------------------- Row Styles -------------------- */

function EntityRow({ item, category, dispatch, onEdit, state, onToast }) {

  const handleDeleteHouseAsset = (asset, state, dispatch) => {
    if (asset.linked_loan_id) {
      const linkedLoan = state.expenses.house_loan.find((loan) => loan.id === asset.linked_loan_id);

      if (linkedLoan) {
        dispatch({
          type: "DELETE_EXPENSE",
          payload: { id: linkedLoan.id, variant: "house_loan" },
        });
        onToast(linkedLoan.name, "deleted");
      }
    }

    dispatch({
      type: "DELETE_ASSET",
      payload: { id: asset.id, variant: "house" },
    });

    onToast(asset.name, "deleted");
  };

  const handleDeleteCarAsset = (asset, state, dispatch) => {
    if (asset.linked_loan_id) {
      const linkedLoan = state.expenses.car_loan.find((loan) => loan.id === asset.linked_loan_id);

      if (linkedLoan) {
        dispatch({
          type: "DELETE_EXPENSE",
          payload: { id: linkedLoan.id, variant: "car_loan" },
        });
        onToast(linkedLoan.name, "deleted");
      }
    }

    dispatch({
      type: "DELETE_ASSET",
      payload: { id: asset.id, variant: "car" },
    });

    onToast(asset.name, "deleted");
  };

  const handleDeleteHouseLoan = (expense, state, dispatch) => {
    if (expense.linked_asset_id) {
      const linkedHouse = state.assets.house.find((house) => house.id === expense.linked_asset_id);

      if (linkedHouse) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...linkedHouse,
            linked_loan_id: null,
          },
        });
        onToast(linkedHouse.name, "unlinked");
      }
    }

    dispatch({
      type: "DELETE_EXPENSE",
      payload: { id: expense.id, variant: "house_loan" },
    });

    onToast(expense.name, "deleted");
  };

  const handleDeleteCarLoan = (expense, state, dispatch) => {
    if (expense.linked_asset_id) {
      const linkedCar = state.assets.car.find((car) => car.id === expense.linked_asset_id);

      if (linkedCar) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...linkedCar,
            linked_loan_id: null,
          },
        });
        onToast(linkedCar.name, "unlinked");
      }
    }

    dispatch({
      type: "DELETE_EXPENSE",
      payload: { id: expense.id, variant: "car_loan" },
    });

    onToast(expense.name, "deleted");
  };

  const handleDelete401k = (account, state, dispatch) => {
    const allJobs = [...state.incomes.salary, ...state.incomes.hourly, ...state.incomes.side];
    // If linked, unlink the job first
    if (account.linked_income_id) {
      const linkedJob = allJobs.find((job) => job.id === account.linked_income_id);
      if (linkedJob) {
        dispatch({
          type: "UPDATE_INCOME",
          payload: {
            ...linkedJob,
            linked_401k_id: undefined,
          },
        });
        onToast(linkedJob.name, "edited");
      }
    }

    dispatch({
      type: "DELETE_ACCOUNT",
      payload: account,
    });

    onToast(item.name, "deleted");
  };

  const handleDeleteJob = (job, state, dispatch) => {
    const available401ks = [...state.accounts.employer_retirement];
    // If linked, delete the 401k first
    if (job.linked_401k_id) {
      const linked401k = available401ks.find((acc) => acc.id === job.linked_401k_id);
      if (linked401k) {
        dispatch({
          type: "DELETE_ACCOUNT",
          payload: linked401k,
        });
        onToast(linked401k.name, "deleted");
      }
    }

    dispatch({
      type: "DELETE_INCOME",
      payload: job,
    });
    onToast(item.name, "deleted");
  };

  const handleDelete = () => {
    if (item.variant === "employer_retirement") {
      return handleDelete401k(item, state, dispatch);
    }

    if (item.variant === "salary" || item.variant === "hourly") {
      return handleDeleteJob(item, state, dispatch);
    }

    if (item.variant === "house") {
      return handleDeleteHouseAsset(item, state, dispatch);
    }

    if (item.variant === "car") {
      return handleDeleteCarAsset(item, state, dispatch);
    }

    if (item.variant === "house_loan") {
      return handleDeleteHouseLoan(item, state, dispatch);
    }

    if (item.variant === "car_loan") {
      return handleDeleteCarLoan(item, state, dispatch);
    }

    const deleteType = {
      account: "DELETE_ACCOUNT",
      income: "DELETE_INCOME",
      expense: "DELETE_EXPENSE",
      asset: "DELETE_ASSET",
    }[category];

    dispatch({
      type: deleteType,
      payload: { id: item.id, variant: item.variant },
    });

    onToast(item.name, "deleted");
  };

  function getEntityAmount(item) {
    if (item.starting_balance != null) {
      return `$${formatNumberWithCommas(item.starting_balance.toString())}`;
    }
  
    if (item.gross_income != null) {
      return `$${formatNumberWithCommas(item.gross_income.toString())}`;
    }
  
    if (item.monthly_expense != null) {
      return `$${formatNumberWithCommas(item.monthly_expense.toString())}/mo`;
    }
  
    if (item.asset_value != null) {
      return `$${formatNumberWithCommas(item.asset_value.toString())}`;
    }
  
    return "No amount";
  }
  
  function getEntityYears(item) {
    const start = item.start_year ?? item.start_age;
    const end = item.end_year ?? item.end_age;
  
    if (start == null && end == null) return "No timeline";
    if (start != null && end == null) return `Starts ${start}`;
    if (start == null && end != null) return `Ends ${end}`;
  
    return `${start}–${end}`;
  }

  return (
    <div className="entity-row">
      <div className="entity-row__left">

        <div className="entity-row__main">
          <div className="entity-row__topline">
            <p className="entity-row__name">{item.name}</p>
  
            {item.linked_401k_id || item.linked_income_id || item.linked_asset_id || item.linked_loan_id ? (
              <span className="entity-row__linked-pill">Linked</span>
            ) : null}
          </div>
  
          <div className="entity-row__meta">
            <span>{getEntityAmount(item)}</span>
            <span>•</span>
            <span>{getEntityYears(item)}</span>
          </div>
        </div>
      </div>
  
      <div className="entity-row__actions">
        <button
          type="button"
          className="entity-row__btn entity-row__btn-edit"
          onClick={() => onEdit(item, item.variant)}
        >
          Edit
        </button>
  
        <button
          type="button"
          className="entity-row__btn entity-row__btn-delete"
          onClick={handleDelete}
          aria-label={`Delete ${item.name}`}
        >
          ×
        </button>
      </div>
    </div>
  );
}
/* -------------------- Financial Entity Card -------------------- */

const ENTITY_CARD_COPY = {
  account: {
    title: "Accounts",
    description: "Add your bank, investment, and other accounts.",
    icon: "🏛️",
    emptyText: "0 accounts added",
    itemText: "accounts added",
  },
  income: {
    title: "Income",
    description: "Add salary, side income, and other inflows.",
    icon: "💼",
    emptyText: "0 income sources",
    itemText: "income sources",
  },
  expense: {
    title: "Expenses",
    description: "Add living expenses, bills, and other outflows.",
    icon: "🧾",
    emptyText: "0 expense items",
    itemText: "expense items",
  },
  asset: {
    title: "Assets",
    description: "Add real estate, vehicles, and other assets.",
    icon: "◔",
    emptyText: "0 assets added",
    itemText: "assets added",
  },
};

export function Entity({ state, entityName, category, dispatch, onToast, tutorialActive }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variantBeingEdited, setVariantBeingEdited] = useState(null);

  const handleEdit = (item) => {
    setVariantBeingEdited(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVariantBeingEdited(null);
  };

  const config = ENTITY_CONFIG[category];
  const cardCopy = ENTITY_CARD_COPY[category];

  const data = Object.keys(config).map((key) => {
    const v = config[key as keyof typeof config];
    return {
      id: v.id,
      name: v.name,
      emoji: v.emoji,
      description: v.description,
      iconTone: v.iconTone,
    };
  });

  const getItems = () => {
    switch (category) {
      case "account":
        return [
          ...state.accounts.checking,
          ...state.accounts.taxable_investments,
          ...state.accounts.employer_retirement,
        ];
      case "income":
        return [...state.incomes.salary, ...state.incomes.hourly, ...state.incomes.side];
      case "expense":
        return [
          ...state.expenses.living,
          ...state.expenses.rent,
          ...state.expenses.debt,
          ...state.expenses.house_loan,
          ...state.expenses.car_loan,
        ];
      case "asset":
        return [...state.assets.house, ...state.assets.car];
      default:
        return [];
    }
  };

  const items = getItems();

  return (
    <>
      <div className={`entity-card entity-card--${category}${tutorialActive ? " ts-tutorial-target" : ""}`}>
        <div className="entity-card__top">
          <div className={`entity-card__icon entity-card__icon--${category}`}>
            {cardCopy.icon}
          </div>

          <div className="entity-card__copy">
            <h3 className="entity-card__title">{cardCopy.title}</h3>
            <p className="entity-card__desc">{cardCopy.description}</p>
          </div>

          <button
            type="button"
            className="entity-card__add-btn"
            onClick={() => setIsModalOpen(true)}
            aria-label={`Add ${cardCopy.title}`}
          >
            +
          </button>
        </div>

        {items.length > 0 && (
          <div className="entity-card__rows">
            {items.map((item) => (
              <EntityRow
                key={item.id}
                item={item}
                category={category}
                dispatch={dispatch}
                onEdit={handleEdit}
                state={state}
                onToast={onToast}
              />
            ))}
          </div>
        )}

        <div className="entity-card__divider" />

        <p className="entity-card__footer">
          {items.length === 0 ? cardCopy.emptyText : `${items.length} ${cardCopy.itemText}`}
        </p>
      </div>

      {isModalOpen && (
        <Modal
          state={state}
          setIsModalOpen={handleCloseModal}
          data={data}
          category={category}
          dispatch={dispatch}
          variantBeingEdited={variantBeingEdited}
          onToast={onToast}
        />
      )}
    </>
  );
}
/* -------------------- Financial Entities (Horizontal Container) -------------------- */

export function FinancialEntities({ state, dispatch, onToast, tutorialStepId }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showArrows, setShowArrows] = useState(false);

  const STEP_SIZE = 266;

  useEffect(() => {
    const handleResize = () => {
      setShowArrows(window.innerWidth <= 1250);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateScrollState = () => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
  }, []);

  const scrollByStep = (direction) => {
    const el = ref.current;
    if (!el) return;

    const amount = direction === "left" ? -STEP_SIZE : STEP_SIZE;

    el.scrollBy({
      left: amount,
      behavior: "smooth",
    });

    setTimeout(updateScrollState, 300);
  };

  return (
    <div className="entities-wrapper">
      {showArrows && canScrollLeft && (
        <button className="entities-arrow entities-arrow--left" onClick={() => scrollByStep("left")}>
          ◀
        </button>
      )}

      {showArrows && canScrollRight && (
        <button className="entities-arrow entities-arrow--right" onClick={() => scrollByStep("right")}>
          ▶
        </button>
      )}

      <div ref={ref} className="entities-scroll hide-scrollbar" onScroll={updateScrollState}>
        <div className="entities-item">
          <Entity state={state} entityName="Accounts" category="account" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "checking" || tutorialStepId === "retirement"}/>
        </div>
        <div className="entities-item">
          <Entity state={state} entityName="Incomes" category="income" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "salary"}/>
        </div>
        <div className="entities-item">
          <Entity state={state} entityName="Expenses" category="expense" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
        <div className="entities-item">
          <Entity state={state} entityName="Assets" category="asset" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {

  // const sim = useSimulation();
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
  const [simResult, setSimResult] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSimLoading, setIsSimLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  //tutorial stuff
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
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

  const overviewCards: OverviewCard[] = [
    {
      id: "net-worth",
      label: "Net Worth",
      value: formatCompactMoney(endingNetWorth),
      change: formatSignedPercent(netWorthChange),
      changeLabel: "vs start",
      meta: getReadableTrend(startingNetWorth, endingNetWorth, "Net worth"),
      icon: "⌁",
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
      icon: "$",
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
      icon: "◔",
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
      icon: "▭",
      tone: "orange",
      direction: getChangeDirection(startingLiabilities, totalLiabilities),
    },
  ];

  const handleTutorialNext = () => {
    setTutorialStepIndex((current) =>
      Math.min(current + 1, tutorialSteps.length - 1)
    );
  };
  
  const handleTutorialBack = () => {
    setTutorialStepIndex((current) => Math.max(current - 1, 0));
  };
  
  const handleTutorialComplete = () => {
    saveTutorialCompleted();
    setShowTutorial(false);
    setTutorialStepIndex(0);
    setActiveTutorialStepId(null);
  };

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      dispatch({ type: "HYDRATE_FROM_LOCAL_STORAGE", payload: saved });
    }

    const timer = setTimeout(() => {
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
    if (!showTutorial || !activeTutorialStepId) return;

    if (activeTutorialStepId === "expenses-assets") {
      document.querySelector(".entities-wrapper")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (activeTutorialStepId === "results") {
      document.querySelector(".overview-cards")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTutorialStepId, showTutorial]);

  return (
    <div className="dash-root" data-active-tutorial-step={activeTutorialStepId ?? ""}>
      {isSimLoading && ENABLE_LOCAL_STORAGE_PERSISTENCE && (
        <div className="dash-loading-overlay">
          <Audio height="100" width="100" color="#6d28d9" ariaLabel="audio-loading" visible={true} />
        </div>
      )}

      {showTutorial && ENABLE_TUTORIAL && (
        <TutorialOnboarding
          steps={tutorialSteps}
          currentStepIndex={tutorialStepIndex}
          state={state}
          dispatch={dispatch}
          onNext={handleTutorialNext}
          onBack={handleTutorialBack}
          onSkip={handleTutorialComplete}
          onFinish={handleTutorialComplete}
          onToast={showToast}
          onStepChange={setActiveTutorialStepId}
          onProfileComplete={(profile, mode) => {
            dispatch({ type: "UPDATE_SIMULATION_BOUNDS", payload: { user_start_age: profile.current_age, user_end_age: profile.retirement_age } });
            if (mode === "skipped") handleTutorialComplete();
          }}
        />
      )}

      <aside className={`dash-sidebar${sidebarCollapsed ? " dash-sidebar--collapsed" : ""}`}>
        <div className="dash-sidebar-inner">

          {/* Desktop layout */}
          <div className="dash-sidebar-header">
            <div className={`dash-logo${sidebarCollapsed ? " dash-logo--hidden" : ""}`}>
              
            <Image
              src="/vantage_logo_transparent.svg"
              alt="Vantage"
              width={120}
              height={34}
              className="dash-logo-img"
              priority
            />
            </div>
            <button
              type="button"
              className="dash-collapse-btn"
              onClick={() => setSidebarCollapsed(c => !c)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`dash-collapse-icon${sidebarCollapsed ? " dash-collapse-icon--flipped" : ""}`}
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <nav className="dash-nav" aria-label="Dashboard navigation">
            <Link href="/testing" className="dash-nav-item" title="Testing Grounds">
              <span className="dash-nav-icon">▦</span>
              <span className="dash-nav-label">Testing Grounds</span>
            </Link>
            <Link href="/visuals" className="dash-nav-item" title="Testing Visuals">
              <span className="dash-nav-icon">◔</span>
              <span className="dash-nav-label">Testing Visuals</span>
            </Link>
          </nav>

          <button
            type="button"
            className="dash-feedback-card"
            onClick={() => setIsFeedbackOpen(true)}
            title="Leave feedback"
          >
            <span className="dash-feedback-icon">✦</span>
            <span className="dash-feedback-copy">
              <strong>Leave feedback</strong>
              <p>Help us improve Vantage</p>
            </span>
          </button>
        </div>

        {/* Mobile topbar */}
        <div className="dash-mobile-bar">
          <Image
            src="/vantage_logo_transparent.svg"
            alt="Vantage"
            width={120}
            height={34}
            className="dash-logo-img"
            priority
          />
          <button
            type="button"
            className="dash-mobile-menu-btn"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            <span className={`dash-mobile-menu-icon${mobileNavOpen ? " dash-mobile-menu-icon--open" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileNavOpen && (
          <div className="dash-mobile-dropdown">
            <nav className="dash-mobile-nav">
              <Link href="/testing" className="dash-nav-item" onClick={() => setMobileNavOpen(false)}>
                <span className="dash-nav-icon">▦</span>
                <span className="dash-nav-label">Testing Grounds</span>
              </Link>
              <Link href="/visuals" className="dash-nav-item" onClick={() => setMobileNavOpen(false)}>
                <span className="dash-nav-icon">◔</span>
                <span className="dash-nav-label">Testing Visuals</span>
              </Link>
            </nav>
            <button
              type="button"
              className="dash-feedback-card"
              onClick={() => { setIsFeedbackOpen(true); setMobileNavOpen(false); }}
            >
              <span className="dash-feedback-icon">✦</span>
              <span className="dash-feedback-copy">
                <strong>Leave feedback</strong>
                <p>Help us improve Vantage</p>
              </span>
            </button>
          </div>
        )}
      </aside>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">AdVantage on Finances</h1>
          </div>
        </header>
{/* 
        <div style={{ display: "flex", justifyContent: "space-between"}}>
          <pre suppressHydrationWarning>{JSON.stringify(state, null, 2)}</pre>
          
          {simResult ? <JsonView
            value={simResult}
            collapsed={2}
            displayDataTypes={false}
            displayObjectSize={false}
            shortenTextAfterLength={40}
          />: "[]"}
          <UserAgeForm state={state} dispatch={dispatch} />
        </div> */}

        <FinancialOverviewCards cards={overviewCards} tutorialActive={activeTutorialStepId === "results"}/>
        <section className="simulation-results-grid">
          <IncomeGrowthChart data={simResult} tutorialActive={activeTutorialStepId === "results"} />

          <div>
            <SimulationHighlights data={simData} tutorialActive={activeTutorialStepId === "results"}/>
            <div className={activeTutorialStepId === "results" ? "ts-tutorial-target" : ""} style={{ borderRadius: "16px" }}>
              <SimulationControls state={state} setSimResult={setSimResult} />
            </div>
          </div>
        </section>

        <section className="simulation-section-header">
          <h2>Simulation Inputs</h2>
          <p>Define the components of your financial plan for the simulation.</p>
        </section>

        <div>
          <FinancialEntities state={state} dispatch={dispatch} onToast={showToast} tutorialStepId={activeTutorialStepId} />
        </div>

        {/* <SimResultViewer simResult={simResult} /> */}
        <ToastBanner toasts={toasts} setToasts={setToasts} />
      </main>
    </div>
  );
}