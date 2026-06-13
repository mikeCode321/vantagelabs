import "./styles/EntityModal.css";

import { useState } from "react";
import { ChartPie, Landmark , Handbag, CreditCard } from 'lucide-react';

/* -------------------- Modal -------------------- */

export function EntityModalCell({ item, setSelectedVariant }) {
  return (
    <button type="button" className="entity-select-card" onClick={() => setSelectedVariant(item.id)} >
      <span className={`entity-select-card-icon entity-select-card-icon--${item.iconTone ?? "purple"}`}>
        {item.emoji}
      </span>

      <span className="entity-select-card-copy">
        <span className="entity-select-card-title">{item.name}</span>
        <span className="entity-select-card-desc">
          {item.description ?? "Add this item to your simulation."}
        </span>
      </span>
    </button>
  );
}
    
export default function EntityModal({ setIsModalOpen, data, category, dispatch, variantBeingEdited, state, onToast, ENTITY_CONFIG }) {
  const [selectedVariant, setSelectedVariant] = useState(variantBeingEdited?.variant || null);

  const goBack = () => setSelectedVariant(null);
  const closeModal = () => setIsModalOpen(false);

  const FormComponent = selectedVariant ? (variantBeingEdited ? ENTITY_CONFIG[category][selectedVariant]?.editFormComponent : ENTITY_CONFIG[category][selectedVariant]?.formComponent) : null;
  const MODAL_COPY = {
    account: {
      icon: <Landmark/>,
      title: "Choose an account type",
      description: "Select the account you want to add to your simulation.",
    },
    income: {
      icon: <Handbag/>,
      title: "Choose an income type",
      description: "Select the income source you want to add to your simulation.",
    },
    expense: {
      icon: <CreditCard/>,
      title: "Choose an expense type",
      description: "Select the expense you want to add to your simulation.",
    },
    asset: {
      icon: <ChartPie/>,
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
              <div className="entity-select-header-icon">
                {modalCopy.icon}
              </div>
              
              <div className="entity-select-header-copy">
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
