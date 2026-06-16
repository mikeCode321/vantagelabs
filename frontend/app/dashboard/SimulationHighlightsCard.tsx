import "./styles/SimulationHighlights.css";

import { formatCompactMoney, } from "@/app/dashboard/FinancialOverviewContainer";
import { CircleDollarSign, TrendingUpDown, ArrowBigDownDash, BanknoteArrowUp } from 'lucide-react';


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
    icon: any;
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
      <div className="simulation-highlight-row-left">
        <div
          className={`simulation-highlight-row-icon simulation-highlight-row-icon-${item.tone}`}
        >
          {item.icon}
        </div>

        <div className="simulation-highlight-row-copy">
          <p className="simulation-highlight-row-label">{item.label}</p>
          <p className="simulation-highlight-row-sublabel">{item.sublabel}</p>
        </div>
      </div>

      <p
        className={`simulation-highlight-row-value ${
          item.isNegative ? "simulation-highlight-row-value-negative" : ""
        }`}
      >
        {item.value}
      </p>
    </div>
  );
}
  
export default function SimulationHighlightsCard({ data, tutorialActive = false, selectedYearData = null }) {
  const metrics = data?.metrics;
  const yearResults = data?.year_results;

  const totalYears = metrics?.total_years ?? 0;
  const startingNetWorth = metrics?.starting_net_worth ?? 0;

  // Use selectedYearData if available, otherwise fall back to final year
  const displayYear = selectedYearData ?? (yearResults?.[yearResults.length - 1] ?? null);
  const displayNetWorth = selectedYearData?.net_worth ?? metrics?.ending_net_worth ?? 0;
  const displayYearsElapsed = selectedYearData && yearResults
    ? yearResults.findIndex(yr => yr.year === selectedYearData.year) + 1
    : totalYears;

  const cagr = data && displayYearsElapsed > 0
    ? getCagr(startingNetWorth, displayNetWorth, displayYearsElapsed)
    : 0;

  const lowestCashBalance = metrics?.lowest_cash_balance ?? 0;
  const isCashDrawdown = data && lowestCashBalance < startingNetWorth;
  const drawdownAmount = lowestCashBalance - startingNetWorth;
  
  const highlights: HighlightItem[] = [
    {
      id: "ending-net-worth",
      label: "Ending Net Worth",
      sublabel: displayYear ? `At age ${displayYear.age} (${displayYear.year})` : "Run a simulation",
      value: data ? formatCompactMoney(displayNetWorth) : "-",
      icon: <TrendingUpDown />,
      tone: "purple",
    },
    {
      id: "cagr-net-worth",
      label: "CAGR (Net Worth)",
      sublabel: displayYear ? `Over ${displayYearsElapsed} years` : "Annualized growth rate",
      value: data ? `${cagr.toFixed(1)}%` : "-",
      icon: <CircleDollarSign/>,
      tone: "green",
    },
    {
      id: "peak-net-worth",
      label: "Peak Net Worth",
      sublabel: data ? `At age ${metrics?.peak_net_worth_age}` : "Run a simulation",
      value: data ? formatCompactMoney(metrics?.peak_net_worth ?? 0) : "-",
      icon: <BanknoteArrowUp/>,
      tone: "blue",
    },
    {
      id: "max-drawdown",
      label: "Max Drawdown",
      sublabel: data ? `Lowest cash year ${metrics?.lowest_cash_balance_year}` : "Run a simulation",
      value: data ? (isCashDrawdown ? formatCompactMoney(drawdownAmount) : formatCompactMoney(0)) : "-",
      icon: <ArrowBigDownDash/>,
      tone: "red",
      isNegative: isCashDrawdown,
    },
  ];

  return (
    <aside className={`simulation-highlights-card${tutorialActive ? " ts-tutorial-target" : ""}`}>
      <div className="simulation-highlights-card-header">
        <h2>Simulation Highlights</h2>
      </div>

      <div className="simulation-highlights-card-list">
        {highlights.map((item) => (
          <SimulationHighlightRow key={item.id} item={item} />
        ))}
      </div>    
    </aside>
  );
}