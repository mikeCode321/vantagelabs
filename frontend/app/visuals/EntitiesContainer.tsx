import "./styles/Entities.css";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EntityCard from "@/app/visuals/EntityCard";

/* --------------------  Entities Container -------------------- */

export default function EntitiesContainer({ state, dispatch, onToast, tutorialStepId, ENTITY_CONFIG }) {
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
        <button className="entities-arrow entities-arrow-left" onClick={() => scrollByStep("left")}>
          <ChevronLeft/>
        </button>
      )}

      {showArrows && canScrollRight && (
        <button className="entities-arrow entities-arrow-right" onClick={() => scrollByStep("right")}>
          <ChevronRight/>
        </button>
      )}

      <div ref={ref} className="entities-scroll" onScroll={updateScrollState}>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="account" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "checking" || tutorialStepId === "retirement"}/>
        </div>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="income" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "salary"}/>
        </div>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="expense" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
        <div className="entities-item">
          <EntityCard state={state} ENTITY_CONFIG={ENTITY_CONFIG} category="asset" dispatch={dispatch} onToast={onToast} tutorialActive={tutorialStepId === "expenses-assets"}/>
        </div>
      </div>
    </div>
  );
}

