import {
    formatCompactMoney,
  } from "@/app/visuals/FinancialOverviewCards";
  
  type YearResult = {
    year: number;
    age: number;
    net_worth: number;
    net_worth_change?: number;
    net_worth_change_percent?: number;
    total_cash?: number;
  };
  
  type SimulationMetrics = {
    total_years: number;
    starting_net_worth: number;
    ending_net_worth: number;
    peak_net_worth: number;
    peak_net_worth_age: number;
    total_income_lifetime: number;
    lowest_cash_balance_year: number;
    lowest_cash_balance: number;
  };
  
  type SimulationHighlightData = {
    metrics: SimulationMetrics;
    year_results: YearResult[];
  };
  
  type HighlightTone = "purple" | "green" | "blue" | "red";
  
  type HighlightItem = {
    id: string;
    label: string;
    sublabel: string;
    value: string;
    icon: string;
    tone: HighlightTone;
    isNegative?: boolean;
  };
  
  function getCagr(startValue: number, endValue: number, years: number) {
    if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  }
  
  function SimulationHighlightRow({ item }: { item: HighlightItem }) {
    return (
      <div className="simulation-highlight-row">
        <div className="simulation-highlight-row__left">
          <div
            className={`simulation-highlight-row__icon simulation-highlight-row__icon--${item.tone}`}
          >
            {item.icon}
          </div>
  
          <div className="simulation-highlight-row__copy">
            <p className="simulation-highlight-row__label">{item.label}</p>
            <p className="simulation-highlight-row__sublabel">{item.sublabel}</p>
          </div>
        </div>
  
        <p
          className={`simulation-highlight-row__value ${
            item.isNegative ? "simulation-highlight-row__value--negative" : ""
          }`}
        >
          {item.value}
        </p>
      </div>
    );
  }
  
  export function SimulationHighlights({
    data,
  }: {
    data: SimulationHighlightData;
  }) {
    const { metrics, year_results } = data;
  
    const finalYear = year_results[year_results.length - 1];
    const totalYears = metrics.total_years;
  
    const endingNetWorth = metrics.ending_net_worth;
    const startingNetWorth = metrics.starting_net_worth;
  
    const cagr = getCagr(startingNetWorth, endingNetWorth, totalYears);
  
    const lowestCashBalance = metrics.lowest_cash_balance;
    const isCashDrawdown = lowestCashBalance < startingNetWorth;
    const drawdownAmount = lowestCashBalance - startingNetWorth;
  
    const highlights: HighlightItem[] = [
      {
        id: "ending-net-worth",
        label: "Ending Net Worth",
        sublabel: `In year ${finalYear.age} (${finalYear.year})`,
        value: formatCompactMoney(endingNetWorth),
        icon: "↗",
        tone: "purple",
      },
      {
        id: "cagr-net-worth",
        label: "CAGR (Net Worth)",
        sublabel: "Annualized growth rate",
        value: `${cagr.toFixed(1)}%`,
        icon: "$",
        tone: "green",
      },
      {
        id: "peak-net-worth",
        label: "Peak Net Worth",
        sublabel: `At age ${metrics.peak_net_worth_age}`,
        value: formatCompactMoney(metrics.peak_net_worth),
        icon: "◔",
        tone: "blue",
      },
      {
        id: "max-drawdown",
        label: "Max Drawdown",
        sublabel: `Lowest cash year ${metrics.lowest_cash_balance_year}`,
        value: isCashDrawdown
          ? formatCompactMoney(drawdownAmount)
          : formatCompactMoney(0),
        icon: "↘",
        tone: "red",
        isNegative: isCashDrawdown,
      },
    ];
  
    return (
      <aside className="simulation-highlights-card">
        <div className="simulation-highlights-card__header">
          <h2>Simulation Highlights</h2>
        </div>
  
        <div className="simulation-highlights-card__list">
          {highlights.map((item) => (
            <SimulationHighlightRow key={item.id} item={item} />
          ))}
        </div>
  
        {/* <button type="button" className="simulation-highlights-card__button">
          <span>⌁</span>
          View Full Report
        </button> */}
      </aside>
    );
  }