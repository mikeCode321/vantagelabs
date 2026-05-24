"use client";

import { useState } from "react";
import testData from "@/test.json";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import "./incomeGrowthChart.css";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

const chartData = testData.year_results.map((year) => ({
  year: year.year,
  age: year.age,
  grossIncome: year.income_earned.gross,
  netIncome: year.income_earned.net,
  taxesPaid: year.income_earned.taxes_paid,
  netWorth: year.net_worth,
}));

const VIEW_CONFIG = {
  gross: { dataKey: "grossIncome", label: "Gross", gradient: "incomeGradientGross" },
  net:   { dataKey: "netIncome",   label: "Net",   gradient: "incomeGradientNet"   },
  taxes: { dataKey: "taxesPaid",   label: "Taxes", gradient: "incomeGradientTaxes" },
  netWorth: { dataKey: "netWorth", label: "Net Worth", gradient: "incomeGradientWealth" },
};

const GROUPS = [
  { label: "Income", views: ["gross", "net", "taxes"] },
  { label: "Wealth", views: ["netWorth"] },
];

type ViewKey = keyof typeof VIEW_CONFIG;

export default function IncomeGrowthChart() {
  const [activeView, setActiveView] = useState<ViewKey>("gross");
  const config = VIEW_CONFIG[activeView];

  const startingValue = chartData[0][config.dataKey as keyof typeof chartData[0]] as number;
  const endingValue   = chartData[chartData.length - 1][config.dataKey as keyof typeof chartData[0]] as number;
  const totalGrowth   = ((endingValue - startingValue) / startingValue) * 100;

  return (
    <section className="income-chart-card">
      <div className="income-chart-header">
        <div>
          <div className="income-chart-label">Financial Projection</div>
          <h2 className="income-chart-title">{config.label}</h2>
          <p className="income-chart-subtitle">Simulated growth over time</p>
        </div>

        <div className="income-chart-stats">
          <div className="income-stat">
            <span>Starting</span>
            <strong>{formatCurrency(startingValue)}</strong>
          </div>
          <div className="income-stat">
            <span>Projected</span>
            <strong>{formatCurrency(endingValue)}</strong>
          </div>
          <div className="income-stat income-stat-positive">
            <span>Growth</span>
            <strong>+{totalGrowth.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Grouped pills */}
      <div className="income-chart-pill-groups">
        {GROUPS.map((group) => (
          <div key={group.label} className="income-pill-group">
            <span className="income-pill-group-label">{group.label}</span>
            <div className="income-chart-pills">
              {group.views.map((view) => (
                <button
                  key={view}
                  className={`income-pill income-pill-${view} ${activeView === view ? "income-pill-active" : ""}`}
                  onClick={() => setActiveView(view as ViewKey)}
                >
                  {VIEW_CONFIG[view as ViewKey].label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="income-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            <defs>
              <linearGradient id="incomeGradientGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="incomeGradientNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#7DD3FC" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="incomeGradientTaxes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#FDA4AF" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="incomeGradientWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />

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

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                return (
                  <div className="income-tooltip">
                    <div className="income-tooltip-title">
                      {row.year} · Age {row.age}
                    </div>
                    <div className="income-tooltip-row">
                      <span>Gross Income</span>
                      <strong>{formatCurrency(row.grossIncome)}</strong>
                    </div>
                    <div className="income-tooltip-row">
                      <span>Net Income</span>
                      <strong>{formatCurrency(row.netIncome)}</strong>
                    </div>
                    <div className="income-tooltip-row">
                      <span>Taxes Paid</span>
                      <strong>{formatCurrency(row.taxesPaid)}</strong>
                    </div>
                    <div className="income-tooltip-divider" />
                    <div className="income-tooltip-row">
                      <span>Net Worth</span>
                      <strong>{formatCurrency(row.netWorth)}</strong>
                    </div>
                  </div>
                );
              }}
            />

            <Bar
              dataKey={config.dataKey}
              fill={`url(#${config.gradient})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={70}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}