"use client";
import "./dashboard.css";
import { SIM_MAX } from "@/app/testing/constants";
import { useState, useReducer, useEffect, useRef } from "react";

import { 
  CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount, LiquidAccount, 
  CheckingAccountForm, TaxableInvestmentAccountForm, EmployerRetirementAccountForm, 
  EditEmployerRetirementAccountForm, EditTaxableInvestmentAccountForm, EditCheckingAccountForm } from "@/app/visuals/accounts";

import { 
  SalaryIncome, HourlyWageIncome, SideHustleIncome, IncomeSource, 
  SalaryForm, HourlyWageForm, SideHustleForm, 
  EditSalaryForm, EditHourlyWageForm, EditSideHustleForm } from "@/app/visuals/incomes";

import { 
  LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, ExpenseSource,
  LivingExpensesForm, RentExpenseForm, DebtExpenseForm, 
  EditLivingExpensesForm, EditRentExpenseForm, EditDebtExpenseForm } from "@/app/visuals/expenses";

import { 
  HouseAsset, CarAsset, AssetSource, HouseAssetForm, CarAssetForm, EditHouseAssetForm, EditCarAssetForm } from "@/app/visuals/assets";

import { 
  FeedbackModal, SimulationControls, NetWorthStackedChart, SimResultViewer, SimYearResult } from "@/app/visuals/misc";
  
import { formatNumberWithCommas } from "@/app/visuals/utils";

type SimRequest = {
  start_year: number;
  end_year: number;
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
    living: LivingExpense[]; // TODO: expenses will need to be updated
    rent: RentExpense[];
    car_loan: CarLoanExpense[];
    house_loan: HouseLoanExpense[];
    debt: DebtExpense[];
  };
  assets: {
    house: HouseAsset[]; // TODO: Replace with HouseAsset[] when implemented
    car: CarAsset[]; // TODO: Replace with CarAsset[] when implemented
  };
};

type Action =
  | { type: "ADD_ACCOUNT"; payload: LiquidAccount }
  | { type: "UPDATE_ACCOUNT"; payload: LiquidAccount }
  | {
      type: "DELETE_ACCOUNT";
      payload: { id: string; variant: "checking" | "taxable_investments" | "employer_retirement" };
    }
  | { type: "ADD_INCOME"; payload: IncomeSource }
  | { type: "UPDATE_INCOME"; payload: IncomeSource }
  | { type: "DELETE_INCOME"; payload: { id: string; variant: "salary" | "hourly" | "side" } }
  | { type: "ADD_EXPENSE"; payload: ExpenseSource }
  | { type: "UPDATE_EXPENSE"; payload: ExpenseSource }
  | { type: "DELETE_EXPENSE"; payload: { id: string; variant: "living" | "rent" | "debt" } }
  | { type: "ADD_ASSET"; payload: AssetSource }
  | { type: "UPDATE_ASSET"; payload: AssetSource }
  | { type: "DELETE_ASSET"; payload: { id: string; variant: "house" | "car" } };

function simReducer(state: SimRequest, action: Action): SimRequest {
  switch (action.type) {
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

    default:
      return state;
  }
}

const INITIAL_STATE: SimRequest = {
  start_year: 1,
  end_year: SIM_MAX,

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

// ENTITY DATA:
const ENTITY_CONFIG = {
  account: {
    checking: {
      id: "checking",
      name: "Checking",
      emoji: "💳",
      formComponent: CheckingAccountForm,
      editFormComponent: EditCheckingAccountForm,
    },
    taxable_investments: {
      id: "taxable_investments",
      name: "Taxable Investments",
      emoji: "📊",
      formComponent: TaxableInvestmentAccountForm,
      editFormComponent: EditTaxableInvestmentAccountForm,
    },
    employer_retirement: {
      id: "employer_retirement",
      name: "Employer Retirement Accounts",
      emoji: "🏢",
      formComponent: EmployerRetirementAccountForm,
      editFormComponent: EditEmployerRetirementAccountForm,
    },
  },
  income: {
    salary: {
      id: "salary",
      name: "Salary",
      emoji: "💼",
      formComponent: SalaryForm,
      editFormComponent: EditSalaryForm,
    },
    hourly: {
      id: "hourly",
      name: "Hourly Wage",
      emoji: "⏱️",
      formComponent: HourlyWageForm,
      editFormComponent: EditHourlyWageForm,
    },
    side: {
      id: "side",
      name: "Side Hustle",
      emoji: "🚀",
      formComponent: SideHustleForm,
      editFormComponent: EditSideHustleForm,
    },
  },
  //TODO: implement expenses and asset below uncomment each form once its implemented
  expense: {
    living: {
      id: "living",
      name: "Living Expenses",
      emoji: "🏠",
      formComponent: LivingExpensesForm,
      editFormComponent: EditLivingExpensesForm,
    },
    rent: {
      id: "rent",
      name: "Rent",
      emoji: "🏢",
      formComponent: RentExpenseForm,
      editFormComponent: EditRentExpenseForm,
    },
    debt: {
      id: "debt",
      name: "Debt",
      emoji: "💳",
      formComponent: DebtExpenseForm,
      editFormComponent: EditDebtExpenseForm,
    },
    house_loan: {
      id: "home_loan",
      name: "Home Loan",
      emoji: "🏡",
      //formComponent: HouseLoanExpenseForm,
      //editFormComponent: EditHouseLoanExpenseForm,
    },

    car_loan: {
      id: "car_loan",
      name: "Car Loan",
      emoji: "🚗",
      //formComponent: CarLoanExpenseForm,
      //editFormComponent: EditCarLoanExpenseForm,
    },
  },
  asset: {
    house: {
      id: "house",
      name: "House",
      emoji: "🏡",
      formComponent: HouseAssetForm,
      editFormComponent: EditHouseAssetForm,
    },
    car: {
      id: "car",
      name: "Car",
      emoji: "🚗",
      formComponent: CarAssetForm,
      editFormComponent: EditCarAssetForm,
    },
  },
};

/* -------------------- Modal -------------------- */

export function EntityModalCell({ item, setSelectedVariant }) {
  return (
    <div className="entity-cell" onClick={() => setSelectedVariant(item.id)}>
      <span>{item.emoji}</span>
      <span>{item.name}</span>
    </div>
  );
}

export function Modal({ setIsModalOpen, data, category, dispatch, variantBeingEdited, state }) {
  const [selectedVariant, setSelectedVariant] = useState(variantBeingEdited?.variant || null);

  const goBack = () => setSelectedVariant(null);
  const closeModal = () => setIsModalOpen(false);

  const FormComponent = selectedVariant ? (variantBeingEdited ? ENTITY_CONFIG[category][selectedVariant]?.editFormComponent : ENTITY_CONFIG[category][selectedVariant]?.formComponent) : null;

  let renderedForm;

  if (selectedVariant) {
    if (!FormComponent) {
      renderedForm = <div>Form not implemented</div>;
    } else if (variantBeingEdited) {
      // i'm not sure how passing state for one edit form doesn't affect others check on this, but it works for now
      renderedForm = <FormComponent item={variantBeingEdited} state={state} dispatch={dispatch} onClose={closeModal} />;
    } else {
      renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} />;
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* ENTITY PICKER HEADER */}
        {!selectedVariant && !variantBeingEdited && (
          <div className="modal-header">
            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ADD FORM HEADER */}
        {selectedVariant && !variantBeingEdited && (
          <div className="modal-header">
            <button onClick={goBack}>← Back</button>

            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* EDIT FORM HEADER */}
        {variantBeingEdited && (
          <div className="modal-header">
            {/* <div>icon + title + description</div> */}

            <button className="modal-close" onClick={closeModal}>
              close
            </button>
          </div>
        )}

        {/* ENTITY SOURCE SELECTION MODAL */}
        {!selectedVariant && !variantBeingEdited && (
          <div className="modal-body">
            {data.map((item) => (
              <EntityModalCell key={item.id} item={item} setSelectedVariant={setSelectedVariant} />
            ))}
          </div>
        )}

        {/* EDIT/ADD MODAL */}
        {renderedForm}
      </div>
    </div>
  );
}

/* -------------------- Row Styles -------------------- */

function EntityRow({ item, category, dispatch, onEdit }) {
  const handleDelete = () => {
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
  };

  return (
    <div className="entity-row">
      <div className="entity-row__main">
        <p className="entity-row__name">{item.name}</p>
        <div className="entity-row__meta">
          {item.balance != null && <span>${formatNumberWithCommas(item.balance.toString())}</span>}
          {item.net_income != null && <span>${formatNumberWithCommas(item.net_income.toString())}</span>}
          {item.monthly_expense != null && <span>${formatNumberWithCommas(item.monthly_expense.toString())}</span>}
          {item.asset_value != null && <span>${formatNumberWithCommas(item.asset_value.toString())}</span>}
          <span>
            {item.start_year}–{item.end_year}
          </span>
        </div>
      </div>

      <div className="entity-row__actions">
        <button className="entity-row__btn-edit" onClick={() => onEdit(item, item.variant)}>
          Edit
        </button>
        <button className="entity-row__btn-delete" onClick={handleDelete}>
          ✕
        </button>
      </div>
    </div>
  );
}
/* -------------------- Financial Entity Card -------------------- */

export function Entity({ state, entityName, category, dispatch }) {
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
  const data = Object.keys(config).map((key) => {
    const v = config[key as keyof typeof config];
    return {
      id: v.id,
      name: v.name,
      emoji: v.emoji,
    };
  });
  
  const getItems = () => {
    switch (category) {
      case "account":
        return [...state.accounts.checking, ...state.accounts.taxable_investments, ...state.accounts.employer_retirement];
      case "income":
        return [...state.incomes.salary, ...state.incomes.hourly, ...state.incomes.side];
      case "expense":
        return [...state.expenses.living, ...state.expenses.rent, ...state.expenses.debt];
      case "asset":
        return [...state.assets.house, ...state.assets.car];
      default:
        return [];
    }
  };

  return (
    <>
      <div className="entity-card">
        <div className="entity-card__header">
          <h1 className="entity-card__title">{entityName}</h1>

          <button className="entity-card__add-btn" onClick={() => setIsModalOpen(true)}>
            +
          </button>
        </div>

        {getItems().map((item) => (
          <EntityRow key={item.id} item={item} category={category} dispatch={dispatch} onEdit={handleEdit} />
        ))}
      </div>

      {isModalOpen && <Modal state={state} setIsModalOpen={handleCloseModal} data={data} category={category} dispatch={dispatch} variantBeingEdited={variantBeingEdited} />}
    </>
  );
}
/* -------------------- Financial Entities (Horizontal Container) -------------------- */

export function FinancialEntities({ state, dispatch }) {
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
          <Entity state={state} entityName="Accounts" category="account" dispatch={dispatch} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Incomes" category="income" dispatch={dispatch} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Expenses" category="expense" dispatch={dispatch} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Assets" category="asset" dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // const sim = useSimulation();
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);
  const [simResult, setSimResult] = useState<SimYearResult[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-mark">VL</span>
          <span className="dash-logo-text">VantageLabs</span>
        </div>
        <nav className="dash-nav">
          <a href="/testing" className="dash-nav-item dash-nav-active">
            TESTING GROUNDS
          </a>
          <a href="#" className="dash-nav-item dash-nav-active">
            TESTING VISUALS
          </a>
        </nav>
        <button type="button" className="dash-nav-item feedback-nav-btn" onClick={() => setIsFeedbackOpen(true)}>
          LEAVE FEEDBACK
        </button>
      </aside>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1 className="dash-page-title">Financial Overview</h1>
            <p className="dash-page-sub">Stepwise simulation · Annual variables</p>
          </div>
          <div className="dash-topbar-right">
            <span className="dash-sim-badge">Sim: {SIM_MAX}yr</span>
          </div>
        </header>

        <pre>{JSON.stringify(state, null, 2)}</pre>
        <FinancialEntities state={state} dispatch={dispatch} />

        <SimulationControls state={state} setSimResult={setSimResult} />
        <NetWorthStackedChart simResult={simResult} />
        <SimResultViewer simResult={simResult} />

        {/* {sim.error && <div className="dash-error">{sim.error}</div>} */}
      </main>
    </div>
  );
}
