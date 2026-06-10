import "./styles/FinancialOverviewCards.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type OverviewCardTone = "purple" | "green" | "blue" | "orange";
type OverviewCardDirection = "up" | "down" | "neutral"; 

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  meta: string;
  icon: any;
  tone: OverviewCardTone;
  direction?: OverviewCardDirection;
};

// ─── Helpers (moved from page.tsx) ───────────────────────────────────────────

export function formatCompactMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatSignedPercent(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function getPercentChange(start: number, end: number) {
  if (!start) return 0;
  return ((end - start) / start) * 100;
}

export function getChangeDirection(start: number, end: number): OverviewCardDirection {
  if (end > start) return "up";
  if (end < start) return "down";
  return "neutral";
}

export function getReadableTrend(start: number, end: number, label: string) {
  if (end > start) return `${label} increased over the simulation`;
  if (end < start) return `${label} decreased over the simulation`;
  return `${label} stayed flat over the simulation`;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getDirectionArrow(direction?: OverviewCardDirection) {
  if (direction === "up") return "↗";
  if (direction === "down") return "↘";
  return "→";
}

// ─── Components ───────────────────────────────────────────────────────────────

function FinancialOverviewCard({ card }: { card: OverviewCard }) {
  const direction = card.direction ?? "neutral";

  return (
    <article className={`overview-card overview-card--${card.tone}`}>
      <div className="overview-card-top">
        <div className="overview-card-icon">{card.icon}</div>

        <div className="overview-card-content">
          <p className="overview-card-label">{card.label}</p>

          <div className="overview-card-value-row">
            <h3 className="overview-card-value">{card.value}</h3>

            <div className={`overview-card-change overview-card-change--${direction}`}>
              <span>
                {getDirectionArrow(direction)} {card.change}
              </span>
              <small>{card.changeLabel}</small>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="overview-card-divider" /> */}

      {/* <p className="overview-card-meta">{card.meta}</p> */}
    </article>
  );
}

export function FinancialOverviewCards({ cards, tutorialActive = false }: { cards: OverviewCard[]; tutorialActive: boolean }) {
  return (
    <section className={`overview-cards${tutorialActive ? " ts-tutorial-target" : ""}`}>
      {cards.map((card) => (
        <FinancialOverviewCard key={card.id} card={card} />
      ))}
    </section>
  );
}