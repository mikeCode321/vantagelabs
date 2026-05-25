type OverviewCardTone = "purple" | "green" | "blue" | "orange";
type OverviewCardDirection = "up" | "down" | "neutral";

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  meta: string;
  icon: string;
  tone: OverviewCardTone;
  direction?: OverviewCardDirection;
};

function getDirectionArrow(direction?: OverviewCardDirection) {
  if (direction === "up") return "↗";
  if (direction === "down") return "↘";
  return "→";
}

function FinancialOverviewCard({ card }: { card: OverviewCard }) {
  const direction = card.direction ?? "neutral";

  return (
    <article className={`overview-card overview-card--${card.tone}`}>
      <div className="overview-card__top">
        <div className="overview-card__icon">{card.icon}</div>

        <div className="overview-card__content">
          <p className="overview-card__label">{card.label}</p>

          <div className="overview-card__value-row">
            <h3 className="overview-card__value">{card.value}</h3>

            <div className={`overview-card__change overview-card__change--${direction}`}>
              <span>
                {getDirectionArrow(direction)} {card.change}
              </span>
              <small>{card.changeLabel}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-card__divider" />

      <p className="overview-card__meta">{card.meta}</p>
    </article>
  );
}

export function FinancialOverviewCards({ cards }: { cards: OverviewCard[] }) {
  return (
    <section className="overview-cards">
      {cards.map((card) => (
        <FinancialOverviewCard key={card.id} card={card} />
      ))}
    </section>
  );
}