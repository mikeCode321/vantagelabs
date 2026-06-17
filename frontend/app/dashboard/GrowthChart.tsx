"use client";
import "./styles/GrowthChart.css";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
];

const PLACEHOLDER_DATA = [
  { age: 25, year: 25, value: 42000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 26, year: 26, value: 55000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 27, year: 27, value: 48000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 28, year: 28, value: 63000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 29, year: 29, value: 71000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
  { age: 30, year: 30, value: 78000, grossIncome: 0, netIncome: 0, taxesPaid: 0, netWorth: 0, events: [] },
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
  if (!req) return {};
  const byYear: Record<number, { icon: string; name: string; kind: string }[]> = {};

  const ageToYear = (age) =>
    req.user_start_age
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

const CHART_MARGIN = { top: 60, right: 0, left: 0, bottom: 0 };
const YAXIS_WIDTH = 42;
const ICON_R = 12;
const ICON_GAP = 6;
const MAX_ICONS = 3;

function getIconY(anchorY: number, index: number) {
  return anchorY - ICON_R - (ICON_R * 2 + ICON_GAP) * index - ICON_GAP;
}

function EventIconStack({ events, cx, anchorY, isLast, onLeave }: {
  events: { icon: string; name: string; kind: string }[];
  cx: number;
  anchorY: number;
  isLast: boolean;
  onLeave: () => void;
}) {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);

  return (
    <>
      {events.slice(0, MAX_ICONS).map((ev, i) => {
        const iconY = getIconY(anchorY, i);
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
                x1={cx} y1={anchorY}
                x2={cx} y2={iconY + ICON_R}
                stroke="#D1D5DB" strokeWidth={1} strokeDasharray="3 2"
              />
            )}
            <circle
              cx={cx} cy={iconY} r={ICON_R}
              fill={isHover ? "#F3F4F6" : "white"}
              stroke={ev.kind === "start" ? "#10B981" : "#F43F5E"}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => { setHoveredIcon(i); onLeave(); }}
              onMouseLeave={() => setHoveredIcon(null)}
            />
            <text
              x={cx} y={iconY}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={11}
              style={{ pointerEvents: "none", userSelect: "none" as any }}
            >
              {ev.icon}
            </text>
            {isHover && (
              <g style={{ pointerEvents: "none" }}>
                <rect x={labelX} y={iconY - labelH / 2} width={labelW} height={labelH} rx={4} fill="#1F2937" />
                <text x={textX} y={iconY} dominantBaseline="middle" fontSize={10} fill="white">
                  {label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {events.length > MAX_ICONS && (
        <g>
          <circle cx={cx} cy={getIconY(anchorY, MAX_ICONS)} r={ICON_R} fill="#1F2937" />
          <text
            x={cx} y={getIconY(anchorY, MAX_ICONS)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fill="white"
            style={{ pointerEvents: "none" }}
          >
            +{events.length - MAX_ICONS}
          </text>
        </g>
      )}
    </>
  );
}

// Parses an SVG path `d` string (as Recharts renders it for a `type="monotone"`
// Area/Line) into the pixel coordinates of each underlying data point.
// Recharts draws one path command per data point: an initial "M x,y" for the
// first point, then one "C x1,y1,x2,y2,x,y" cubic-bezier segment per
// subsequent point, where the segment's *endpoint* (the final x,y pair) is
// the next data point. No interpolation/scale math needed — these are the
// exact pixels the curve was drawn at.
function parseCurvePoints(d: string): { x: number; y: number }[] {
  const tokens = d.match(/[MLC][^MLC]*/g) ?? [];
  const points: { x: number; y: number }[] = [];
  for (const tok of tokens) {
    const nums = tok.slice(1).trim().split(",").map(Number);
    if (nums.length < 2) continue;
    const x = nums[nums.length - 2];
    const y = nums[nums.length - 1];
    if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
  }
  return points;
}

const ICON_OFFSET = 8; // px gap between the curve point and the first icon

function EventIconOverlay({ data, wrapRef, lastYear, activeKey, onLeave }: {
  data: any[];
  wrapRef: React.RefObject<HTMLDivElement>;
  lastYear: number;
  activeKey: string;
  onLeave: () => void;
}) {
  const [svgSize, setSvgSize] = useState<{ w: number; h: number } | null>(null);
  const [curvePoints, setCurvePoints] = useState<{ x: number; y: number }[] | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;

    const compute = () => {
      const svg = wrapRef.current?.querySelector("svg.recharts-surface") as SVGSVGElement | null;
      // The stroked curve line (not the filled area-under-curve shape, which
      // has extra path commands closing it back down to the x-axis).
      const curvePath = wrapRef.current?.querySelector(".recharts-area-curve") as SVGPathElement | null;
      if (!svg || !curvePath) return;

      setSvgSize({ w: svg.clientWidth, h: svg.clientHeight });

      const d = curvePath.getAttribute("d") ?? "";
      const points = parseCurvePoints(d);
      if (points.length === data.length) {
        setCurvePoints(points);
      }
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // activeKey is included because switching the active series remounts the
    // AreaChart (via `key={activeKey}` in the parent) and redraws the curve
    // at new pixel positions, even though `data` keeps the same identity.
  }, [data, activeKey]);

  if (!svgSize || !curvePoints) return null;

  const eventEntries = data
    .map((entry, i) => ({ entry, point: curvePoints[i] }))
    .filter(({ entry }) => entry.events?.length > 0);

  return (
    <svg
      width={svgSize.w}
      height={svgSize.h}
      viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {eventEntries.map(({ entry, point }, i) => {
        const anchorY = point.y - ICON_OFFSET;

        return (
          <g key={`${entry.year}-${i}`} style={{ pointerEvents: "all" }}>
            <EventIconStack
              events={entry.events}
              cx={point.x}
              anchorY={anchorY}
              isLast={entry.year === lastYear}
              onLeave={onLeave}
            />
          </g>
        );
      })}
    </svg>
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

export default function GrowthChart({ data, tutorialActive = false }) {
  const [activeKey, setActiveKey] = useState("netWorth");
  const [tooltip, setTooltip] = useState(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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
  const values = chartData.map((d) => d[view.dataKey]);
  const startValue = view.key === "netWorth"
    ? (data?.metrics?.starting_net_worth ?? values[0] ?? 0)
    : (values[0] ?? 0);
  const endValue = values[values.length - 1] ?? 0;
  const growth = startValue ? ((endValue - startValue) / startValue) * 100 : 0;

  const isEmpty = chartData.length === 0;
  const displayData = isEmpty ? PLACEHOLDER_DATA : chartData;
  const lastYear = displayData[displayData.length - 1]?.year;

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
            <span>Projected</span>
            <strong>{isEmpty ? "--" : formatCurrency(endValue)}</strong>
          </div>
          <div className="income-stat income-stat-positive">
            <span>Growth</span>
            <strong>{isEmpty ? "--" : `+${growth.toFixed(1)}%`}</strong>
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="income-chart-wrap" style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={activeKey}
            data={displayData}
            margin={CHART_MARGIN}
            onMouseMove={(e: any) => {
              if (isEmpty) return;
              if (e.activePayload?.length && e.activeCoordinate) {
                const rect = wrapRef.current?.getBoundingClientRect();
                setTooltip({
                  row: e.activePayload[0].payload,
                  x: (rect?.left ?? 0) + (e.chartX ?? e.activeCoordinate.x),
                  y: (rect?.top ?? 0) + e.activeCoordinate.y,
                  isLast: e.activePayload[0].payload.year === lastYear,
                });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              {VIEWS.map((v) => (
                <linearGradient key={v.gradientId} id={v.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={v.colors[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={v.colors[1]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#4B5563", fontSize: 10 }}
            />
            <YAxis
              width={YAXIS_WIDTH}
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#4B5563", fontSize: 10 }}
            />

            <Area
              type="monotone"
              dataKey={isEmpty ? "value" : view.dataKey}
              stroke={isEmpty ? "#E5E7EB" : view.colors[0]}
              strokeWidth={2}
              fill={isEmpty ? "#F3F4F6" : `url(#${view.gradientId})`}
              dot={false}
              activeDot={isEmpty ? false : { r: 4, fill: view.colors[0], strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {!isEmpty && (
          <EventIconOverlay
            key={activeKey}
            data={displayData}
            wrapRef={wrapRef}
            lastYear={lastYear}
            activeKey={activeKey}
            onLeave={() => setTooltip(null)}
          />
        )}

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