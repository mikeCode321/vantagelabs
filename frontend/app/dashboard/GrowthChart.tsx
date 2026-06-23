"use client";
import { BriefcaseBusiness, Car, ChartNoAxesColumnIncreasing, CreditCard, House, Landmark, ShoppingCart } from "lucide-react";
import "./styles/GrowthChart.css";

import { useState, useMemo, useRef, useCallback } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea } from "recharts";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

const VIEWS = [
  { group: "Income", key: "gross",    label: "Gross Income", dataKey: "grossIncome", gradientId: "gradGross",   colors: ["#7C3AED", "#A78BFA"] },
  { group: "Income", key: "net",      label: "Net Income",   dataKey: "netIncome",   gradientId: "gradNet",     colors: ["#0EA5E9", "#7DD3FC"] },
  { group: "Income", key: "taxes",    label: "Taxes Paid",   dataKey: "taxesPaid",   gradientId: "gradTaxes",   colors: ["#F43F5E", "#FDA4AF"] },
  { group: "Wealth", key: "netWorth", label: "Net Worth",    dataKey: "netWorth",    gradientId: "gradWealth",  colors: ["#10B981", "#6EE7B7"] },
  { group: "Expense", key: "expense", label: "Total Expenses",    dataKey: "expense",    gradientId: "gradExpense",  colors: ["#c90000", "#6d2727"] },
];

const PLACEHOLDER_DATA = [
  { age: 25, year: 25, value: 42000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, expense: 0,events: [] },
  { age: 26, year: 26, value: 55000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0,expense: 0, events: [] },
  { age: 27, year: 27, value: 48000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, expense:0, events: [] },
  { age: 28, year: 28, value: 63000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, expense:0,events: [] },
  { age: 29, year: 29, value: 71000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0,expense:0, events: [] },
  { age: 30, year: 30, value: 78000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0,expense:0, events: [] },
];

const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.key, v]));
const GROUPS   = [...new Set(VIEWS.map((v) => v.group))];
const ICONS = {
  checking: <Landmark/>, savings: <Landmark/>,
  salary: <BriefcaseBusiness />, hourly: <BriefcaseBusiness/>, side: <BriefcaseBusiness />,
  employer_retirement: <ChartNoAxesColumnIncreasing />, taxable_investments: <ChartNoAxesColumnIncreasing/>,
  rent: <House/>, house_loan: <House/>, house: <House/>,
  car: <Car/>, car_loan: <Car/>,
  debt: <CreditCard/>, living: <ShoppingCart/>,
};

function buildEventsByYear(req) {
  if (!req) return {};
  const byYear = {};
  const ageToYear = (age) => req.user_start_age ? new Date().getFullYear() + (age - req.user_start_age) : age;
  const allEntities = [
    ...(req.accounts?.checking ?? []),
    ...(req.accounts?.taxable_investments ?? []),
    ...(req.accounts?.employer_retirement ?? []),
    ...(req.incomes?.salary ?? []),
    ...(req.incomes?.hourly ?? []),
    ...(req.incomes?.side ?? []),
    ...(req.expenses?.living ?? []),
    ...(req.expenses?.rent ?? []),
    ...(req.expenses?.house_loan ?? []),
    ...(req.expenses?.car_loan ?? []),
    ...(req.expenses?.debt ?? []),
    ...(req.assets?.house ?? []),
    ...(req.assets?.car ?? []),
  ];
  for (const e of allEntities) {
    const icon = ICONS[e.variant] ?? "📌";
    for (const ev of [
      { year: ageToYear(e.start_age), kind: "start" },
      { year: ageToYear(e.end_age),   kind: "end" },
    ]) {
      if (!byYear[ev.year]) byYear[ev.year] = [];
      byYear[ev.year].push({ icon, name: e.name, kind: ev.kind });
    }
  }
  return byYear;
}


export default function GrowthChart({ data, selectedYear = null, tutorialActive = false }) {
  const [activeKey, setActiveKey] = useState("netWorth");
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback((eventData) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.innerHTML = `<div>${eventData.type}: <b>${eventData.name}</b></div><div>year: ${eventData.year}</div>`;
    el.style.display = "block";
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.display = "none";
  }, []);

  const chartData = useMemo(() => {
    if (!data?.year_results) return [];  
    const eventsByYear = buildEventsByYear(data.request);
  
    return data.year_results.map((yr) => {
      const monthlyExpenses = Number(yr.expenses?.total_monthly ?? 0);
      const annualExpenses = monthlyExpenses * 12;
  
      return {
        year: yr.year,
        age: yr.age,
        grossIncome: yr.income_earned.gross,
        netIncome: yr.income_earned.net,
        taxesPaid: yr.income_earned.taxes_paid,
        netWorth: yr.net_worth,
        expense: annualExpenses,
        incomesSummary: yr.incomes_summary,
        incomeEarned: yr.income_earned,
        events: eventsByYear[yr.year] ?? [],
      };
    });
  }, [data]);

  const view = VIEW_MAP[activeKey];
  const values = chartData.map((d) => d[view.dataKey]);
  
  const startValue = view.key === "netWorth" ? (data?.metrics?.starting_net_worth ?? values[0] ?? 0) : (values[0] ?? 0);
  const selectedRow = chartData.find(d => d.year === selectedYear) ?? chartData[chartData.length - 1];
  const endValue = selectedRow?.[view.dataKey] ?? 0;
  const growth = startValue ? ((endValue - startValue) / startValue) * 100 : 0;

  const isEmpty = chartData.length === 0;
  const displayData = isEmpty ? PLACEHOLDER_DATA : chartData;

  const renderCustomAreaLabel = useCallback((props) => {
    const { x, y, index } = props;
    const row = displayData[index];
    if (!row?.events?.length) return null;
    return (
      <g>
        {row.events.map((event, i) => {
          const isStart = event.kind === "start";
          const eventData = { ...event, year: row.year, type: isStart ? "start" : "end" };
          const size = 20;
  
          return (
            <foreignObject
              key={i}
              x={x - size / 2}
              y={y - size - 4 - i * (size + 4)}
              width={size}
              height={size}
              style={{ cursor: "pointer", overflow: "visible" }}
              onMouseEnter={() => showTooltip(eventData)}
              onMouseLeave={() => hideTooltip()}
              onTouchStart={(e) => { e.preventDefault(); showTooltip(eventData); }}
              onTouchEnd={(e) => { e.preventDefault(); hideTooltip(); }}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                className="chart-event-icon"
                data-kind={event.kind}
                style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {event.icon}
              </div>
            </foreignObject>
          );
        })}
      </g>
    );
  }, [displayData, showTooltip, hideTooltip]);

  function formatVariantLabel(variant: string) {
    return variant
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const CustomTooltip = useCallback((props) => {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;
    const value = payload[0].value;
    const dataKey = payload[0].dataKey;
    const view = VIEWS.find((v) => v.dataKey === dataKey);
    const row = payload[0].payload;
    const incomeByVariant = row?.incomesSummary?.by_variant;
    const showGrossIncomeBreakdown = dataKey === "grossIncome" && incomeByVariant;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">Year: {label}</div>
        <div className="chart-tooltip-value" style={{ color: view?.colors[0] }}>
          {view?.label}: {formatCurrency(value)}
        </div>
        {showGrossIncomeBreakdown && (
          <div className="chart-tooltip-breakdown">
            {Object.entries(incomeByVariant)
              .filter(([, amount]) => Number(amount) > 0)
              .map(([variant, amount]) => (
                <div key={variant} className="chart-tooltip-breakdown-row">
                  <span>{formatVariantLabel(variant)}</span>
                  <strong>{formatCurrency(Number(amount))}</strong>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <section className={`income-chart-card${tutorialActive ? " ts-tutorial-target" : ""}`}>
      <div className="income-chart-top">
        <div className="income-chart-controls">
          <select id="income-chart-view" className="income-chart-select" value={activeKey} onChange={(e) => setActiveKey(e.target.value)}>
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {VIEWS.filter((v) => v.group === group).map((v) => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="income-chart-stats">
          <div className="income-stat">
            <span>Starting</span>
            <strong>{isEmpty ? "--" : formatCurrency(startValue)}</strong>
          </div>
          <div className="income-stat">
            <span>{selectedYear && selectedYear !== displayData[displayData.length - 1]?.year ? `Year ${selectedYear}` : "Projected"}</span>
            <strong>{isEmpty ? "--" : formatCurrency(endValue)}</strong>
          </div>
          <div className="income-stat income-stat-positive">
            <span>Growth</span>
            <strong>{isEmpty ? "--" : `+${growth.toFixed(1)}%`}</strong>
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="income-chart-wrap" style={{ position: "relative", touchAction: "none" }} onMouseLeave={() => hideTooltip()}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart key={activeKey} data={displayData} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
            <defs>
              {VIEWS.map((v) => (
                <linearGradient key={v.gradientId} id={v.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={v.colors[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={v.colors[1]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 8 }}
              ticks={(() => {
                const years = displayData.map((d) => d.year);
                if (years.length <= 1) return years;
                const first = years[0];
                const last = years[years.length - 1];
                const count = 5;
                return Array.from({ length: count }, (_, i) =>
                  Math.round(first + (i / (count - 1)) * (last - first))
                );
              })()}
            />
            <YAxis tickFormatter={formatCurrency} tickLine={false} axisLine={false} tick={{ fontSize: 8 }} width={36} domain={[0, (dataMax: number) => Math.round(dataMax * 1.5)]} />
            
            {selectedYear && !isEmpty && (
              <ReferenceArea
                x1={displayData[0].year}
                x2={selectedYear}
                fill={view.colors[0]}
                fillOpacity={0.06}
                strokeOpacity={0}
              />
            )}

            <Area
              type="monotone"
              dataKey={isEmpty ? "value" : view.dataKey}
              stroke={isEmpty ? "#E5E7EB" : view.colors[0]}
              strokeWidth={2}
              fill={isEmpty ? "#F3F4F6" : `url(#${view.gradientId})`}
              dot={false}
              activeDot={isEmpty ? false : { r: 4, fill: view.colors[0] }}
              label={renderCustomAreaLabel}
            />

            {selectedYear && !isEmpty && (
              <ReferenceLine
                x={selectedYear}
                stroke={view.colors[0]}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.7}
              />
            )}
            <Tooltip content={CustomTooltip}/>
          </AreaChart>
        </ResponsiveContainer>

        {/* Tooltip is always mounted — shown/hidden via direct DOM writes, never via state */}
        <div
          ref={tooltipRef}
          className="chart-event-tooltip"
          style={{ display: "none" }}
        />

        {isEmpty && (
          <div className="income-chart-empty">
            <p className="income-chart-empty-title">No simulation data yet</p>
            <p className="income-chart-empty-subtitle">
              Add your financial details and run a simulation to see results
            </p>
          </div>
        )}
      </div>
    </section>
  );
}