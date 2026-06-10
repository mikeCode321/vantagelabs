"use client";
import { useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,} from "recharts";
import "./styles/incomeGrowthChart.css";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

const VIEWS = [
  { group: "Income", key: "gross",    label: "Gross Income", dataKey: "grossIncome", gradientId: "gradGross",   colors: ["#7C3AED", "#A78BFA"] },
  { group: "Income", key: "net",      label: "Net Income",   dataKey: "netIncome",   gradientId: "gradNet",     colors: ["#0EA5E9", "#7DD3FC"] },
  { group: "Income", key: "taxes",    label: "Taxes Paid",   dataKey: "taxesPaid",   gradientId: "gradTaxes",   colors: ["#F43F5E", "#FDA4AF"] },
  { group: "Wealth", key: "netWorth", label: "Net Worth", dataKey: "netWorth", gradientId: "gradWealth", colors: ["#10B981", "#6EE7B7"] }, 
];

const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.key, v]));
const GROUPS   = [...new Set(VIEWS.map((v) => v.group))];
const ICONS = {
  checking: "🏦", savings: "🏦",
  salary: "💼", hourly: "💼", side: "💼",
  employer_retirement: "📈", taxable_investments: "📈",
  rent: "🏠", house_loan: "🏠", house: "🏠",
  car: "🚗", car_loan: "🚗",
  debt: "💳", living: "🛒",
};

function buildEventsByYear(req) {
//   {
//   2025: [
//     { icon: "🏦", name: "Checking Account", kind: "start" },
//     { icon: "💼", name: "Software Engineer", kind: "start" },
//     { icon: "📈", name: "salary 401", kind: "start" }
//   ], 
// }

  if (!req) return {};
  const byYear = {};

  const ageToYear = (age) => req.user_start_age 
    ? new Date().getFullYear() + (age - req.user_start_age) 
    : age;

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
const ICON_R   = 12;
const ICON_GAP = 6;
const MAX_ICONS = 3;

function getIconY(y, index) {
  return ( y - ICON_R - (ICON_R * 2 + ICON_GAP) * index - ICON_GAP );
}

function EventIconStack({ events, cx, y, isLast, onBarLeave, }) {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  return (
    <>
      {events.slice(0, MAX_ICONS).map((ev, i) => {
        const iconY = getIconY(y, i);
        const isHover = hoveredIcon === i;

        const label = `${ev.kind === "start" ? "Start" : "End"}: ${ev.name}`;

        const labelH = 22;
        const labelPadX = 8;
        const labelW = label.length * 6.5 + labelPadX * 2;

        const labelX = isLast ? cx - ICON_R - 6 - labelW : cx + ICON_R + 6;
        const textX = labelX + labelPadX;

        return (
          <g key={i}>
            {i === 0 && (
              <line
                x1={cx}
                y1={y}
                x2={cx}
                y2={iconY + ICON_R}
                stroke="#D1D5DB"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}

            <circle
              cx={cx}
              cy={iconY}
              r={ICON_R}
              fill={isHover ? "#F3F4F6" : "white"}
              stroke="#E5E7EB"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => { setHoveredIcon(i); onBarLeave(); }}
              onMouseLeave={() => setHoveredIcon(null)}
            />

            <text
              x={cx}
              y={iconY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              style={{ pointerEvents: "none", userSelect: "none", }} >
              {ev.icon}
            </text>

            {isHover && (
              <g style={{ pointerEvents: "none" }}>
                <rect x={labelX} y={iconY - labelH / 2} width={labelW} height={labelH} rx={4} fill="#1F2937" />

                <text x={textX} y={iconY} dominantBaseline="middle" fontSize={10} fill="white" >
                  {label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {events.length > MAX_ICONS && (
        <g>
          <circle cx={cx} cy={getIconY(y, MAX_ICONS)} r={ICON_R} fill="#1F2937" />

          <text
            x={cx}
            y={getIconY(y, MAX_ICONS)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="white"
            style={{ pointerEvents: "none" }}
          >
            +{events.length - MAX_ICONS}
          </text>
        </g>
      )}
    </>
  );
}

function CustomBar(props) {
  const { x, y, width, height, fill, payload, onBarEnter, onBarLeave, lastYear} = props;

  const events = payload?.events ?? [];
  const cx = x + width / 2;

  const isLast = payload?.year === lastYear;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} style={{ cursor: "default" }}
        onMouseEnter={(e) => onBarEnter( payload, e.clientX, e.clientY, isLast ) }
        onMouseLeave={onBarLeave}
      />

      <EventIconStack
        events={events}
        cx={cx}
        y={y}
        isLast={isLast}
        onBarLeave={onBarLeave}
      />
    </g>
  );
}

function ChartTooltip({ tooltip }) {
  if (!tooltip) return null;

  const { row, x, y } = tooltip;

  const TOOLTIP_W = 190;
  const GAP = 12;

  const left = tooltip.isLast ? x - GAP - TOOLTIP_W : x + GAP;

  return (
    <div className="income-tooltip" style={{ left, top: y - 12 }}>
      <div className="income-tooltip-title">{row.year} · Age {row.age}</div>

      <div className="income-tooltip-row">
        <span>Gross Income</span><strong>{formatCurrency(row.grossIncome)}</strong>
      </div>

      <div className="income-tooltip-row">
        <span>Net Income</span><strong>{formatCurrency(row.netIncome)}</strong>
      </div>

      <div className="income-tooltip-row">
        <span>Taxes Paid</span><strong>{formatCurrency(row.taxesPaid)}</strong>
      </div>

      <div className="income-tooltip-divider" />
      <div className="income-tooltip-row">
        <span>Net Worth</span><strong>{formatCurrency(row.netWorth)}</strong>
      </div>
    </div>
  );
}

const PLACEHOLDER_DATA = [
  { age: 25, year: 25, value: 42000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 26, year: 26, value: 55000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 27, year: 27, value: 48000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 28, year: 28, value: 63000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 29, year: 29, value: 71000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 30, year: 30, value: 78000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
];

export default function IncomeGrowthChart({ data, tutorialActive = false }) {
  const [activeKey, setActiveKey] = useState("netWorth");
  const [tooltip, setTooltip] = useState(null);
  const chartData = useMemo(() => {
    if (!data?.year_results) return [];
    const eventsByYear = buildEventsByYear(data.request);
    return data.year_results.map((yr) => ({
      year:        yr.year,
      age:         yr.age,
      grossIncome: yr.income_earned.gross,
      netIncome:   yr.income_earned.net,
      taxesPaid:   yr.income_earned.taxes_paid,
      netWorth:    yr.net_worth,
      events:      eventsByYear[yr.year] ?? [],
    }));
  }, [data]);

  const view = VIEW_MAP[activeKey];

  const values = chartData.map(d => d[view.dataKey]);
  const startValue = view.key === "netWorth"  ? (data?.metrics?.starting_net_worth ?? values[0] ?? 0) : (values[0] ?? 0);
  const endValue = values[values.length - 1] ?? 0;
  const growth = startValue ? ((endValue - startValue) / startValue) * 100 : 0;

  const isEmpty = chartData.length === 0;
  const displayData = isEmpty ? PLACEHOLDER_DATA : chartData;

  return (
  <section className={`income-chart-card${tutorialActive ? " ts-tutorial-target" : ""}`}>

    <div className="income-chart-top">

    <div className="income-chart-controls">
      <select
        id="income-chart-view"
        className="income-chart-select"
        value={activeKey}
        onChange={(e) => setActiveKey(e.target.value)}
      >
        {GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {VIEWS.filter((v) => v.group === group).map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
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
          <span>Projected</span>
          <strong>{isEmpty ? "--" : formatCurrency(endValue)}</strong>
        </div>

        <div className="income-stat income-stat-positive">
          <span>Growth</span>
          <strong>{isEmpty ? "--" : `+${growth.toFixed(1)}%`}</strong>
        </div>
      </div>

    </div>

    <div className="income-chart-wrap" style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart key={activeKey}
                  data={displayData} 
                  margin={{ top: 60, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
          <defs>
            {VIEWS.map(v => (
              <linearGradient key={v.gradientId} id={v.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={v.colors[0]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={v.colors[1]} stopOpacity={0.9} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#E5E7EB"
          />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: "#D1D5DB" }}
            tick={{ fill: "#4B5563", fontSize: 12 }}
          />

          <YAxis
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={{ stroke: "#D1D5DB" }}
            tick={{ fill: "#4B5563", fontSize: 12 }}
          />

          <Bar
            dataKey={isEmpty ? "value" : view.dataKey}
            maxBarSize={70}
            shape={(props) => (
              <CustomBar
                {...props}
                fill={isEmpty ? "#E5E7EB" : `url(#${view.gradientId})`}
                lastYear={displayData[displayData.length - 1]?.year}
                onBarEnter={isEmpty ? () => {} : (row, x, y, isLast) => setTooltip({ row, x, y, isLast })}
                onBarLeave={() => setTooltip(null)}
              />
            )}
          />
        </BarChart>
      </ResponsiveContainer>

      {isEmpty && (
        <div className="income-chart-empty">
          <p className="income-chart-empty-title">No simulation data yet</p>
          <p className="income-chart-empty-subtitle">
            Add your financial details and run a simulation to see results
          </p>
        </div>
      )}

      <ChartTooltip tooltip={tooltip} />
    </div>
  </section>
);
}