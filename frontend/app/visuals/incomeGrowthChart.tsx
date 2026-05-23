"use client";

import testData from "@/test.json";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./incomeGrowthChart.css";

function formatCurrency(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }

  return `$${value}`;
}

const baseIncome =
  testData.request.incomes.salary[0].gross_income;

const baseYear = testData.request.start_year;

const baseAge = testData.request.user_start_age;

const chartData = [
  {
    year: baseYear,
    age: baseAge,
    grossIncome: baseIncome,
    netIncome: null,
    taxesPaid: null,
    isBaseYear: true,
  },

  ...testData.year_results.map((year) => ({
    year: year.year,
    age: year.age,
    grossIncome: year.current_gross_income,
    netIncome: year.income_earned.net,
    taxesPaid: year.income_earned.taxes_paid,
    isBaseYear: false,
  })),
];

export default function IncomeGrowthChart() {
  const startingIncome = chartData[0].grossIncome;

  const endingIncome =
    chartData[chartData.length - 1].grossIncome;

  const totalGrowth =
    ((endingIncome - startingIncome) / startingIncome) * 100;

  return (
    <section className="income-chart-card">
      <div className="income-chart-header">
        <div>
          <div className="income-chart-label">
            Income Projection
          </div>

          <h2 className="income-chart-title">
            Income Growth
          </h2>

          <p className="income-chart-subtitle">
            Simulated salary growth 
          </p>
        </div>

        <div className="income-chart-stats">
          <div className="income-stat">
            <span>Starting</span>
            <strong>{formatCurrency(startingIncome)}</strong>
          </div>

          <div className="income-stat">
            <span>Projected</span>
            <strong>{formatCurrency(endingIncome)}</strong>
          </div>

          <div className="income-stat income-stat-positive">
            <span>Growth</span>
            <strong>+{totalGrowth.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      <div className="income-chart-pills">
        <div className="income-pill income-pill-active">
          Gross Income
        </div>

        <div className="income-pill">
          Net Income
        </div>

        <div className="income-pill">
          Taxes
        </div>
      </div>

      <div className="income-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
            barCategoryGap="28%"
          >
            <defs>
              <linearGradient
                id="incomeGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#7C3AED"
                  stopOpacity={0.95}
                />

                <stop
                  offset="100%"
                  stopColor="#A78BFA"
                  stopOpacity={0.9}
                />
              </linearGradient>
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
              tick={{
                fill: "#4B5563",
                fontSize: 12,
              }}
            />

            <YAxis
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={{ stroke: "#D1D5DB" }}
              tick={{
                fill: "#4B5563",
                fontSize: 12,
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const row = payload[0].payload;

                return (
                  <div className="income-tooltip">
                    <div className="income-tooltip-title">
                      {row.year} · Age {row.age}
                    </div>

                    <div className="income-tooltip-row">
                      <span>Gross Income</span>

                      <strong>
                        {formatCurrency(row.grossIncome)}
                      </strong>
                    </div>

                    {!row.isBaseYear && (
                      <>
                        <div className="income-tooltip-row">
                          <span>Net Income</span>

                          <strong>
                            {formatCurrency(row.netIncome)}
                          </strong>
                        </div>

                        <div className="income-tooltip-row">
                          <span>Taxes Paid</span>

                          <strong>
                            {formatCurrency(row.taxesPaid)}
                          </strong>
                        </div>
                      </>
                    )}

                    {row.isBaseYear && (
                      <div className="income-tooltip-note">
                        Starting income from request
                      </div>
                    )}
                  </div>
                );
              }}
            />

            <Bar
              dataKey="grossIncome"
              fill="url(#incomeGradient)"
              radius={[10, 10, 0, 0]}
              maxBarSize={70}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="income-chart-footer">
      </div>
    </section>
  );
}