import './styles/Entities.css';

import { useState} from "react";
import { CircleDollarSign, HandCoins, PieChart, Landmark, } from 'lucide-react';
import EntityModal from "@/app/visuals/EntityModal";
import {formatNumberWithCommas} from "@/app/visuals/utils";

const ENTITY_CARD_COPY = {
  account: {
    title: "Accounts",
    description: "Add your bank, investment, and other accounts.",
    icon: <Landmark/>,
    emptyText: "0 accounts added",
    itemText: "accounts added",
  },
  income: {
    title: "Income",
    description: "Add salary, side income, and other inflows.",
    icon: <CircleDollarSign/>,
    emptyText: "0 income sources",
    itemText: "income sources",
  },
  expense: {
    title: "Expenses",
    description: "Add living expenses, bills, and other outflows.",
    icon: <HandCoins/>,
    emptyText: "0 expense items",
    itemText: "expense items",
  },
  asset: {
    title: "Assets",
    description: "Add real estate, vehicles, and other assets.",
    icon: <PieChart/>,
    emptyText: "0 assets added",
    itemText: "assets added",
  },
};


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
      <div className="entity-row-left">

        <div className="entity-row-main">
          <div className="entity-row-topline">
            <p className="entity-row-name">{item.name}</p>
  
            {item.linked_401k_id || item.linked_income_id || item.linked_asset_id || item.linked_loan_id ? (
              <span className="entity-row-linked-pill">Linked</span>
            ) : null}
          </div>
  
          <div className="entity-row-meta">
            <span>{getEntityAmount(item)}</span>
            <span>•</span>
            <span>{getEntityYears(item)}</span>
          </div>
        </div>
      </div>
  
      <div className="entity-row-actions">
        <button
          type="button"
          className="entity-row-btn entity-row-btn-edit"
          onClick={() => onEdit(item, item.variant)}
        >
          Edit
        </button>
  
        <button
          type="button"
          className="entity-row-btn entity-row-btn-delete"
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

export default function EntityCard({ state, ENTITY_CONFIG, category, dispatch, onToast, tutorialActive }) {
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
        <div className="entity-card-top">
          <div className={`entity-card-icon entity-card-icon--${category}`}>
            {cardCopy.icon}
          </div>

          <div className="entity-card-copy">
            <h3 className="entity-card-title">{cardCopy.title}</h3>
            <p className="entity-card-desc">{cardCopy.description}</p>
          </div>

          <button
            type="button"
            className="entity-card-add-btn"
            onClick={() => setIsModalOpen(true)}
            aria-label={`Add ${cardCopy.title}`}
          >
            +
          </button>
        </div>

        {items.length > 0 && (
          <div className="entity-card-rows">
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

        <div className="entity-card-divider" />

        <p className="entity-card-footer">
          {items.length === 0 ? cardCopy.emptyText : `${items.length} ${cardCopy.itemText}`}
        </p>
      </div>

      {isModalOpen && (
        <EntityModal
          state={state}
          setIsModalOpen={handleCloseModal}
          data={data}
          category={category}
          dispatch={dispatch}
          variantBeingEdited={variantBeingEdited}
          onToast={onToast}
          ENTITY_CONFIG={ENTITY_CONFIG}
        />
      )}
    </>
  );
}