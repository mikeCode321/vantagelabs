import "./styles/EntityCard.css";

import { useEffect, useRef } from "react";
import EntityCard from "@/app/dashboard/EntityCard";

export default function EntitiesContainer({ state, dispatch, onToast, tutorialStepId, ENTITY_CONFIG }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const expenseRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (tutorialStepId === "expenses-assets" && expenseRef.current) {
      expenseRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [tutorialStepId]);

  return (
    <div className="entities-wrapper">
      <div ref={ref} className="entities-scroll">
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="account" dispatch={dispatch} onToast={onToast} tutorialActive={false}/>
        </div>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="income" dispatch={dispatch} onToast={onToast} tutorialActive={false}/>
        </div>
        <div className="entities-item" ref={expenseRef}>
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="expense" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="asset" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
      </div>
    </div>
  );
}

