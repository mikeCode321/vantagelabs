"use client";
import "./dashboard.css";
import { SIM_MAX } from "@/app/testing/constants";
import { useState, useReducer, useEffect, useRef } from "react";

import { CheckingAccount, TaxableInvestmentAccount, EmployerRetirementAccount, LiquidAccount, CheckingAccountForm, TaxableInvestmentAccountForm, EmployerRetirementAccountForm, EditEmployerRetirementAccountForm, EditTaxableInvestmentAccountForm, EditCheckingAccountForm } from "@/app/visuals/accounts";

import { SalaryIncome, HourlyWageIncome, SideHustleIncome, IncomeSource, SalaryForm, HourlyWageForm, SideHustleForm, EditSalaryForm, EditHourlyWageForm, EditSideHustleForm } from "@/app/visuals/incomes";

import { LivingExpense, RentExpense, DebtExpense, CarLoanExpense, HouseLoanExpense, ExpenseSource, LivingExpensesForm, RentExpenseForm, DebtExpenseForm, HouseLoanExpenseForm, CarLoanExpenseForm, EditHouseLoanExpenseForm, EditCarLoanExpenseForm, EditLivingExpensesForm, EditRentExpenseForm, EditDebtExpenseForm } from "@/app/visuals/expenses";

import { HouseAsset, CarAsset, AssetSource, HouseAssetForm, CarAssetForm, EditHouseAssetForm, EditCarAssetForm } from "@/app/visuals/assets";

import { FeedbackModal, SimulationControls, NetWorthStackedChart, SimResultViewer, SimYearResult, Toast, ToastBanner, UserAgeForm } from "@/app/visuals/misc";

import { formatNumberWithCommas } from "@/app/visuals/utils";

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
      id: "house_loan",
      name: "Home Loan",
      emoji: "🏡",
      formComponent: HouseLoanExpenseForm,
      editFormComponent: EditHouseLoanExpenseForm,
    },

    car_loan: {
      id: "car_loan",
      name: "Car Loan",
      emoji: "🚗",
      formComponent: CarLoanExpenseForm,
      editFormComponent: EditCarLoanExpenseForm,
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

export function Modal({ setIsModalOpen, data, category, dispatch, variantBeingEdited, state, onToast }) {
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
      renderedForm = <FormComponent item={variantBeingEdited} state={state} dispatch={dispatch} onClose={closeModal} onToast={onToast} />;
    } else {
      renderedForm = <FormComponent dispatch={dispatch} state={state} onClose={closeModal} onToast={onToast} />;
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
  
  function getEntityRowIcon(item) {
    const icons = {
      checking: "🏦",
      taxable_investments: "📈",
      employer_retirement: "🏢",
      salary: "💼",
      hourly: "⏱️",
      side: "🚀",
      living: "🧾",
      rent: "🏠",
      debt: "💳",
      house_loan: "🏡",
      car_loan: "🚗",
      house: "🏡",
      car: "🚗",
    };
  
    return icons[item.variant] ?? "•";
  }

  return (
    <div className="entity-row">
      <div className="entity-row__left">
        <div className={`entity-row__icon entity-row__icon--${category}`}>
          {getEntityRowIcon(item)}
        </div>
  
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

export function Entity({ state, entityName, category, dispatch, onToast }) {
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
      <div className={`entity-card entity-card--${category}`}>
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

export function FinancialEntities({ state, dispatch, onToast }) {
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
          <Entity state={state} entityName="Accounts" category="account" dispatch={dispatch} onToast={onToast} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Incomes" category="income" dispatch={dispatch} onToast={onToast} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Expenses" category="expense" dispatch={dispatch} onToast={onToast} />
        </div>

        <div className="entities-item">
          <Entity state={state} entityName="Assets" category="asset" dispatch={dispatch} onToast={onToast} />
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
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (entityName: string, action: "added" | "edited" | "deleted") => {
    const id = crypto.randomUUID();
    const message = `${entityName} ${action} successfully`;

    setToasts((prev) => [...prev, { id, message, entityName, action, type: "success" }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

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
            <span className="dash-sim-badge">Sim: 30 yr</span>
          </div>
        </header>

        <div style={{ display: "flex", justifyContent: "space-between"}}>
          <pre>{JSON.stringify(state, null, 2)}</pre>
          <UserAgeForm state={state} dispatch={dispatch} />
        </div>
        

        <FinancialEntities state={state} dispatch={dispatch} onToast={showToast} />

        <SimulationControls state={state} setSimResult={setSimResult} />
        <IncomeGrowthChart />
        <SimResultViewer simResult={simResult} />

        <ToastBanner toasts={toasts} setToasts={setToasts} />
        {/* {sim.error && <div className="dash-error">{sim.error}</div>} */}

      </main>
    </div>
  );
}
