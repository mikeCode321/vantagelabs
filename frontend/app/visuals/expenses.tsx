import { useState } from "react";
import { ID} from "@/app/visuals/accounts";

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

export type LivingExpense = {
  source_type: "expense";
  variant: "living";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  monthly_expense: number;
  expense_growth: number;
};

export type RentExpense = {
  source_type: "expense";
  variant: "rent";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  monthly_expense: number;
  rent_growth: number;
};

export type DebtExpense = {
  source_type: "expense";
  variant: "debt";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  debt_amount: number;
  monthly_expense: number;

  interest_rate?: number | null;
};

export type HouseLoanExpense = {
  source_type: "expense";
  variant: "house_loan";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  // Links this mortgage to a specific house asset
  linked_asset_id: ID;

  monthly_expense: number;

  // Needed to track mortgage balance over time
  original_principal: number; //  house asset_value - down_payment
  interest_rate: number; // example: 0.0675 = 6.75%
  loan_term_years: number; // example: 30
};

export type CarLoanExpense = {
  source_type: "expense";
  variant: "car_loan";

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  linked_asset_id: ID; // points to the CarAsset

  monthly_expense: number;

  // Needed to track balance over time
  original_principal: number; //  car asset_value - down_payment
  interest_rate: number; // example: 0.072 = 7.2%
  loan_term_years: number; // example: 5
};

export type ExpenseSource = LivingExpense | RentExpense | DebtExpense | CarLoanExpense | HouseLoanExpense;

function calculateMonthlyLoanPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
) {
  const monthlyRate = annualInterestRate / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  return (
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

export function HouseLoanExpenseForm({ dispatch, houseAsset, onBack, onClose }) {
  const [interestRate, setInterestRate] = useState("6.75");
  const [loanTermYears, setLoanTermYears] = useState("30");
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState("");

  const originalPrincipal =
    Number(houseAsset.asset_value || 0) - Number(houseAsset.down_payment || 0);

  const monthlyExpense =
    originalPrincipal > 0 && Number(interestRate) >= 0 && Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          originalPrincipal,
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "house_loan",
        id: crypto.randomUUID(),
        name: `${houseAsset.name} Loan`,
        start_year: houseAsset.start_year,
        end_year: houseAsset.start_year + Number(loanTermYears),
        monthly_expense: monthlyExpense,
        original_principal: originalPrincipal,
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
        extra_monthly_payment:
          extraMonthlyPayment === "" ? null : Number(extraMonthlyPayment),
      },
    });

    if (onClose) onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🏦</div>
        <div>
          <h3 className="form-header-title">Add Home Loan</h3>
          <p className="form-header-desc">
            Add loan details for <strong>{houseAsset.name}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-info-card">
              <div className="form-info-label">Original Principal</div>
              <div className="form-info-value">
                ${originalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="form-info-desc">Home value minus down payment</div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate %</label>
              <input
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className="form-input"
                placeholder="6.75"
                type="number"
                step="0.01"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={e => setLoanTermYears(e.target.value)}
                className="form-input"
                placeholder="30"
                type="number"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Extra Monthly Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input
                  value={extraMonthlyPayment}
                  onChange={e => setExtraMonthlyPayment(e.target.value)}
                  className="form-input form-input--prefix-dollar"
                  placeholder="0"
                  type="number"
                />
              </div>
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading"></p>

            <div className="form-preview-card">
              <div className="form-preview-label">Estimated Payment</div>
              <div className="form-preview-value">
                ${monthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </div>
              <div className="form-preview-desc">Principal + interest only</div>
            </div>
          </div>
        </div>

        <div className="form-actions">

          {onBack && (
            <button type="button" onClick={onBack} className="form-btn-secondary">
              Back
            </button>
          )}

          {onClose && (
            <button type="button" onClick={onClose} className="form-btn-secondary">
              Skip Loan
            </button>
          )}

          <button type="submit" className="form-btn-primary">
            Add Home Loan
          </button>
        </div>
      </form>
    </div>
  );
}

export function CarLoanExpenseForm({ dispatch, carAsset, onBack, onClose }) {
  const [interestRate, setInterestRate] = useState("7.5");
  const [loanTermYears, setLoanTermYears] = useState("5");

  const originalPrincipal =
    Number(carAsset.asset_value || 0) - Number(carAsset.down_payment || 0);

  const monthlyExpense =
    originalPrincipal > 0 && Number(interestRate) >= 0 && Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          originalPrincipal,
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "car_loan",
        id: crypto.randomUUID(),
        name: `${carAsset.name} Loan`,
        start_year: carAsset.start_year,
        end_year: carAsset.start_year + Number(loanTermYears),
        monthly_expense: monthlyExpense,
        original_principal: originalPrincipal,
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
      },
    });

    if (onClose) onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🚗</div>
        <div>
          <h3 className="form-header-title">Add Car Loan</h3>
          <p className="form-header-desc">
            Add loan details for <strong>{carAsset.name}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-info-card">
              <div className="form-info-label">Original Principal</div>
              <div className="form-info-value">
                ${originalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="form-info-desc">Car value minus down payment</div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate %</label>
              <input
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="form-input"
                placeholder="7.5"
                type="number"
                step="0.01"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="form-input"
                placeholder="5"
                type="number"
                required
              />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Payment Preview</p>

            <div className="form-preview-card">
              <div className="form-preview-label">Estimated Payment</div>
              <div className="form-preview-value">
                ${monthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </div>
              <div className="form-preview-desc">Principal + interest only</div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          {onBack && (
            <button type="button" onClick={onBack} className="form-btn-secondary">
              Back
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="form-btn-secondary">
              Skip Loan
            </button>
          )}
          <button type="submit" className="form-btn-primary">
            Add Car Loan
          </button>
        </div>
      </form>
    </div>
  );
}

export function LivingExpensesForm({ dispatch }) {
  const [name, setName] = useState("Living Expenses");
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "living",
        id: crypto.randomUUID(),
        name,
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    setName("Living Expense");
    setAmount("");
    setGrowth("3");
    setStartYear("");
    setEndYear("");
  };

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏠</div>
        <div>
          <h3 className="form-header-title">Add Living Expenses</h3>
          <p className="form-header-desc">Track recurring monthly costs like groceries, utilities, and subscriptions.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Expense Details</p>

            <div className="form-field">
              <label className="form-label">Expense Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Groceries, Utilities, etc." />
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="3,000" type="number" required />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Growth Rate</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" type="number" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Living Expenses
          </button>
        </div>
      </form>
    </div>
  );
}

export function DebtExpenseForm({ dispatch }) {
  const [name, setName] = useState("Debt Expense");
  const [debtAmount, setDebtAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "debt",
        id: crypto.randomUUID(),
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    setName("Debt Expense");
    setDebtAmount("");
    setMonthlyPayment("");
    setInterestRate("");
    setStartYear("");
    setEndYear("");
  };

  const annualPayment = Number(monthlyPayment) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💳</div>
        <div>
          <h3 className="form-header-title">Add Debt</h3>
          <p className="form-header-desc">Track loans, credit cards, or any outstanding debt with monthly payments.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Debt Details</p>

            <div className="form-field">
              <label className="form-label">Debt Name</label>
              <input type="text" placeholder="Student Loan, Car Loan, Credit Card" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
            </div>

            <div className="form-field">
              <label className="form-label">Total Debt Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input type="number" placeholder="25,000" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="form-input form-input--prefix-dollar" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input type="number" placeholder="400" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input type="number" placeholder="6.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input--suffix" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input type="number" placeholder="1" value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input type="number" placeholder="10" value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Payment</span>
              </div>
              <div className="preview-card__amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(monthlyPayment) || 0).toLocaleString()}/mo × 12
                {interestRate && <span> · {Number(interestRate).toFixed(1)}% APR</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Debt
          </button>
        </div>
      </form>
    </div>
  );
}

export function RentExpenseForm({ dispatch }) {
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "rent",
        id: crypto.randomUUID(),
        name: "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    setAmount("");
    setGrowth("");
    setStartYear("");
    setEndYear("");
  };

  const annualRent = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Add Rent</h3>
          <p className="form-header-desc">Track monthly rent payments with expected annual rent growth.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Rent Details</p>

            <div className="form-field">
              <label className="form-label">Monthly Rent</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="2,000" type="number" required />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Rent Growth</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Rent Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(amount) || 0).toLocaleString()}/mo · grows {Number(growth).toFixed(1)}%/yr
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="form-btn-submit">
            Add Rent
          </button>
        </div>
      </form>
    </div>
  );
}


/* -------------------- EDIT EXPENSE FORMS -------------------- */


export function EditCarLoanExpenseForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name || "Car Loan");

  const [originalPrincipal, setOriginalPrincipal] = useState(
    item.original_principal?.toString() || ""
  );

  const [interestRate, setInterestRate] = useState(item.interest_rate == null ? "" : (item.interest_rate * 100).toString());

  const [loanTermYears, setLoanTermYears] = useState(item.loan_term_years?.toString() || "5");

  const [startYear, setStartYear] = useState(item.start_year?.toString() || "");

  const [endYear, setEndYear] = useState(item.end_year == null ? "" : item.end_year.toString());

  const monthlyExpense =
    Number(originalPrincipal) > 0 &&
    Number(interestRate) >= 0 &&
    Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          Number(originalPrincipal),
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        source_type: "expense",
        variant: "car_loan",
        name: name || "Car Loan",
        start_year: Number(startYear),
        end_year:
          endYear === ""
            ? Number(startYear) + Number(loanTermYears)
            : Number(endYear),
        monthly_expense: monthlyExpense,
        original_principal: Number(originalPrincipal),
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
      },
    });

    onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🚗</div>
        <div>
          <h3 className="form-header-title">Edit Car Loan</h3>
          <p className="form-header-desc">
            Update vehicle loan details, payment assumptions, and timeline.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-field">
              <label className="form-label">Loan Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Mazda 3 Loan"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Original Principal</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input
                  value={originalPrincipal}
                  onChange={(e) => setOriginalPrincipal(e.target.value)}
                  className="form-input form-input--prefix-dollar"
                  placeholder="25,000"
                  type="number"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate</label>
              <div className="form-input-wrap">
                <input
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="form-input form-input--suffix"
                  placeholder="7.5"
                  type="number"
                  step="0.01"
                  required
                />
                <span className="form-input-suffix">%</span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="form-input"
                placeholder="5"
                type="number"
                required
              />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="form-input"
                  placeholder="1"
                  type="number"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(auto)</span>
                </label>
                <input
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="form-input"
                  placeholder={
                    startYear && loanTermYears
                      ? String(Number(startYear) + Number(loanTermYears))
                      : "6"
                  }
                  type="number"
                />
              </div>
            </div>

            <div className="form-preview-card">
              <div className="form-preview-label">Estimated Payment</div>
              <div className="form-preview-value">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="form-preview-desc">
                Principal + interest only
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>

          <button type="submit" className="form-btn-submit">
            Save Car Loan
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditHouseLoanExpenseForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);

  const [originalPrincipal, setOriginalPrincipal] = useState(
    item.original_principal?.toString() || ""  );

  const [interestRate, setInterestRate] = useState(
    item.interest_rate == null ? "" : (item.interest_rate * 100).toString() );

  const [loanTermYears, setLoanTermYears] = useState(
    item.loan_term_years?.toString() || "30");

  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(
    item.extra_monthly_payment == null
      ? ""
      : item.extra_monthly_payment.toString()
  );

  const [startYear, setStartYear] = useState(
    item.start_year?.toString() || "");

  const [endYear, setEndYear] = useState(
    item.end_year == null ? "" : item.end_year.toString());

  const monthlyExpense =
    Number(originalPrincipal) > 0 &&
    Number(interestRate) >= 0 &&
    Number(loanTermYears) > 0
      ? calculateMonthlyLoanPayment(
          Number(originalPrincipal),
          Number(interestRate) / 100,
          Number(loanTermYears)
        )
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        source_type: "expense",
        variant: "house_loan",
        name: name || "Home Loan",
        start_year: Number(startYear),
        end_year:
          endYear === ""
            ? Number(startYear) + Number(loanTermYears)
            : Number(endYear),
        monthly_expense: monthlyExpense,
        original_principal: Number(originalPrincipal),
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
        extra_monthly_payment:
          extraMonthlyPayment === "" ? null : Number(extraMonthlyPayment),
      },
    });

    onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🏦</div>
        <div>
          <h3 className="form-header-title">Edit Home Loan</h3>
          <p className="form-header-desc">
            Update mortgage details, payment assumptions, and timeline.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-field">
              <label className="form-label">Loan Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Primary Residence Loan"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Original Principal</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input
                  value={originalPrincipal}
                  onChange={(e) => setOriginalPrincipal(e.target.value)}
                  className="form-input form-input--prefix-dollar"
                  placeholder="320,000"
                  type="number"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate</label>
              <div className="form-input-wrap">
                <input
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="form-input form-input--suffix"
                  placeholder="6.75"
                  type="number"
                  step="0.01"
                  required
                />
                <span className="form-input-suffix">%</span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="form-input"
                placeholder="30"
                type="number"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Extra Monthly Payment{" "}
                <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input
                  value={extraMonthlyPayment}
                  onChange={(e) => setExtraMonthlyPayment(e.target.value)}
                  className="form-input form-input--prefix-dollar"
                  placeholder="0"
                  type="number"
                />
              </div>
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="form-input"
                  placeholder="1"
                  type="number"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(auto)</span>
                </label>
                <input
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="form-input"
                  placeholder={
                    startYear && loanTermYears
                      ? String(Number(startYear) + Number(loanTermYears))
                      : "31"
                  }
                  type="number"
                />
              </div>
            </div>

            <div className="form-preview-card">
              <div className="form-preview-label">Estimated Payment</div>
              <div className="form-preview-value">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="form-preview-desc">
                Principal + interest only
                {extraMonthlyPayment !== "" && (
                  <span>
                    {" "}
                    · +$
                    {Number(extraMonthlyPayment).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                    /mo extra
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>

          <button type="submit" className="form-btn-submit">
            Save Home Loan
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditLivingExpensesForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "living",
        name,
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onClose();
  };

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏠</div>
        <div>
          <h3 className="form-header-title">Edit Living Expenses</h3>
          <p className="form-header-desc">Update monthly amount and growth rate for this expense.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Expense Details</p>

            <div className="form-field">
              <label className="form-label">Expense Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Groceries, Utilities, etc." />
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="3,000" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Growth Rate</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="40" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Living Expenses
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditRentExpenseForm({ item, dispatch, onClose }) {
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year.toString());
  const [name, setName] = useState(item.name || "Rent");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "rent",
        name: name || "Rent",
        start_year: Number(startYear),
        end_year: Number(endYear),
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onClose();
  };

  const annualRent = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🏢</div>
        <div>
          <h3 className="form-header-title">Edit Rent</h3>
          <p className="form-header-desc">Update monthly rent and annual growth rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Rent Details</p>

            <div className="form-field">
              <label className="form-label">Monthly Rent</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="2,000" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Rent Growth</label>
                <span className="form-slider-value">{Number(growth).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={growth} onChange={(e) => setGrowth(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" />
              </div>
              <div className="form-field">
                <label className="form-label">End yr</label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" />
              </div>
            </div>

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Rent Cost</span>
              </div>
              <div className="preview-card__amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(amount) || 0).toLocaleString()}/mo · grows {Number(growth).toFixed(1)}%/yr
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Rent
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditDebtExpenseForm({ item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [debtAmount, setDebtAmount] = useState(item.debt_amount.toString());
  const [monthlyPayment, setMonthlyPayment] = useState(item.monthly_expense.toString());
  const [interestRate, setInterestRate] = useState(item.interest_rate == null ? "" : (item.interest_rate * 100).toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "debt",
        name: name || "Debt",
        start_year: Number(startYear),
        end_year: endYear === "" ? null : Number(endYear),
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    onClose();
  };

  const annualPayment = Number(monthlyPayment) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">💳</div>
        <div>
          <h3 className="form-header-title">Edit Debt</h3>
          <p className="form-header-desc">Update loan balance, monthly payment, and interest rate.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Debt Details</p>

            <div className="form-field">
              <label className="form-label">Debt Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Student Loan" />
            </div>

            <div className="form-field">
              <label className="form-label">Total Debt Amount</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="form-input form-input--prefix-dollar" placeholder="25,000" type="number" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="form-input form-input--prefix-dollar form-input--suffix" placeholder="400" type="number" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input--suffix" placeholder="6.5" type="number" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card__header">
                <span className="preview-icon">💸</span>
                <span className="preview-card__label">Annual Payment</span>
              </div>
              <div className="preview-card__amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card__unit">/yr</span>
              </div>
              <div className="preview-card__sub">
                ${(Number(monthlyPayment) || 0).toLocaleString()}/mo × 12
                {interestRate && <span> · {Number(interestRate).toFixed(1)}% APR</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Debt
          </button>
        </div>
      </form>
    </div>
  );
}