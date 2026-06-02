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
  
  export function SimulationHighlights({ data, tutorialActive = false }) {
      const metrics = data?.metrics;
      const yearResults = data?.year_results;

      const finalYear = yearResults && yearResults.length > 0 ? yearResults[yearResults.length - 1] : null;

      const totalYears = metrics?.total_years ?? 0;

      const endingNetWorth = metrics?.ending_net_worth ?? 0;
      const startingNetWorth = metrics?.starting_net_worth ?? 0;

      const cagr = data && totalYears > 0 ? getCagr(startingNetWorth, endingNetWorth, totalYears) : 0;

      const lowestCashBalance = metrics?.lowest_cash_balance ?? 0;

      const isCashDrawdown = data && lowestCashBalance < startingNetWorth;

      const drawdownAmount = lowestCashBalance - startingNetWorth;

    
    const highlights: HighlightItem[] = [
      {
        id: "ending-net-worth",
        label: "Ending Net Worth",
        sublabel: finalYear ? `In year ${finalYear.age} (${finalYear.year})` : "Run a simulation",
        value: data ? formatCompactMoney(endingNetWorth) : "--",
        icon: "↗",
        tone: "purple",
      },
      {
        id: "cagr-net-worth",
        label: "CAGR (Net Worth)",
        sublabel: "Annualized growth rate",
        value: data ? `${cagr.toFixed(1)}%` : "--",
        icon: "$",
        tone: "green",
      },
      {
        id: "peak-net-worth",
        label: "Peak Net Worth",
        sublabel: data ? `At age ${metrics?.peak_net_worth_age}` : "Run a simulation",
        value: data ? formatCompactMoney(metrics?.peak_net_worth ?? 0) : "--",
        icon: "◔",
        tone: "blue",
      },
      {
        id: "max-drawdown",
        label: "Max Drawdown",
        sublabel: data ? `Lowest cash year ${metrics?.lowest_cash_balance_year}` : "Run a simulation",
        value: data ? (isCashDrawdown ? formatCompactMoney(drawdownAmount) : formatCompactMoney(0)) : "--",
        icon: "↘",
        tone: "red",
        isNegative: isCashDrawdown,
      },
    ];
  
    return (
      <aside className={`simulation-highlights-card${tutorialActive ? " ts-tutorial-target" : ""}`}>
        <div className="simulation-highlights-card__header">
          <h2>Simulation Highlights</h2>
        </div>
  
        <div className="simulation-highlights-card__list">
          {highlights.map((item) => (
            <SimulationHighlightRow key={item.id} item={item} />
          ))}
        </div>    
      </aside>
    );
  }

   {/* <button type="button" className="simulation-highlights-card__button">
          View Full Report
        </button> */}