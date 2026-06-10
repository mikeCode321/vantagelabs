import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput } from "@/app/visuals/utils";
import { ID } from "@/app/visuals/Accounts";
import {
  TimelineAgeFields,
  getValidatedTimelinePayload,
} from "@/app/visuals/TimelineAgeFields";
import { CircleDollarSign,ChartNoAxesCombined ,ChartPie , HandCoins, PieChart, Landmark,Grid3x3 , ChevronLeft, ChevronRight, Handbag, CreditCard, ChartColumnIncreasing , Accessibility, Luggage, Clock, Rocket, House,BanknoteArrowDown, Building,ShoppingCart ,Car, HousePlus, TrendingUpDown, ArrowBigDownDash, BanknoteArrowUp, DollarSign, Link } from 'lucide-react';

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

export type LivingExpense = {
  source_type: "expense";
  variant: "living";

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  monthly_expense: number;
  expense_growth: number;
};

export type RentExpense = {
  source_type: "expense";
  variant: "rent";

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  monthly_expense: number;
  rent_growth: number;
};

export type DebtExpense = {
  source_type: "expense";
  variant: "debt";

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  debt_amount: number;
  monthly_expense: number;

  interest_rate?: number | null;
};

export type HouseLoanExpense = {
  source_type: "expense";
  variant: "house_loan";

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  // Links this mortgage to a specific house asset
  linked_asset_id?: ID;

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

  start_age: number;
  end_age?: number | null;

  linked_asset_id?: ID; // points to the CarAsset

  monthly_expense: number;

  // Needed to track balance over time
  original_principal: number; //  car asset_value - down_payment
  interest_rate: number; // example: 0.072 = 7.2%
  loan_term_years: number; // example: 5
};

export type ExpenseSource = LivingExpense | RentExpense | DebtExpense | CarLoanExpense | HouseLoanExpense;

export function calculateMonthlyLoanPayment(principal: number, annualInterestRate: number, loanTermYears: number) {
  const monthlyRate = annualInterestRate / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  return (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}

export function HouseLoanExpenseForm({ dispatch, state, onClose, onToast }) {
  const [name, setName] = useState("House Loan");
  const [originalPrincipal, setOriginalPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("6.75");
  const [loanTermYears, setLoanTermYears] = useState("30");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState("");

  const [linkedAssetId, setLinkedAssetId] = useState("");
  const [linkError, setLinkError] = useState("");

  const availableHouses = state?.assets?.house || [];

  const handleHouseSelect = (assetId: string) => {
    setLinkError("");

    if (!assetId) {
      setLinkedAssetId("");
      return;
    }

    const selectedHouse = availableHouses.find((house) => house.id === assetId);

    if (selectedHouse?.linked_loan_id) {
      setLinkError("This house is already linked to another loan.");
      setLinkedAssetId("");
      return;
    }

    setLinkedAssetId(assetId);

    if (selectedHouse) {
      setName(`${selectedHouse.name} Loan`);
      setStartAge(selectedHouse.start_age.toString());

      const principal = Number(selectedHouse.asset_value || 0) - Number(selectedHouse.down_payment || 0);

      setOriginalPrincipal(principal.toString());

      if (selectedHouse.end_age && selectedHouse.start_age) {
        const lifeYears = selectedHouse.end_age - selectedHouse.start_age;
        setLoanTermYears(lifeYears.toString());
      }

    }
  };

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

  const calculatedEndYear = startAge && loanTermYears ? Number(startAge) + Number(loanTermYears) : "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    if (linkError) return;

    const loanId = crypto.randomUUID();

    const houseLoanExpense = {
      source_type: "expense",
      variant: "house_loan",
      id: loanId,
      name: name || "House Loan",
      start_age: timeline.start,
      end_age: timeline.end,
      linked_asset_id: linkedAssetId || null,
      monthly_expense: monthlyExpense,
      original_principal: Number(originalPrincipal),
      interest_rate: Number(interestRate) / 100,
      loan_term_years: Number(loanTermYears),
      extra_monthly_payment: extraMonthlyPayment === "" ? null : Number(extraMonthlyPayment),
    };

    if (linkedAssetId) {
      const selectedHouse = availableHouses.find(
        (house) => house.id === linkedAssetId
      );

      if (selectedHouse) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...selectedHouse,
            linked_loan_id: loanId,
          },
        });
      }
    }

    dispatch({
      type: "ADD_EXPENSE",
      payload: houseLoanExpense,
    });

    onToast(name, "added");
    
    if (onClose) onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><House/></div>
        <div>
          <h3 className="form-header-title">Add Home Loan</h3>
          <p className="form-header-desc">
            Add mortgage details and optionally link it to a house asset.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-field">
              <label className="form-label">Loan Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Primary Residence Loan" />
            </div>

            <div className="form-field">
              <label className="form-label">Original Principal</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(originalPrincipal)} onChange={(e) => handleNumberInput(e, setOriginalPrincipal)} className="form-input form-input-prefix-dollar" placeholder="320,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate %</label>
              <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input" placeholder="6.75" type="number" step="0.01" required />
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} className="form-input" placeholder="30" type="number" required />
            </div>

            <div className="form-field">
              <label className="form-label">
                Extra Monthly Payment <span className="form-label-muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(extraMonthlyPayment)} onChange={(e) => handleNumberInput(e, setExtraMonthlyPayment)} className="form-input form-input-prefix-dollar" placeholder="0" type="text" inputMode="decimal" />
              </div>
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a House Asset</div>
                    <div className="link-card-sub">
                      Sync this loan with an existing house
                    </div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {availableHouses.length === 0 ? (
                  <p className="link-card-no-accounts">
                    No house assets available.
                  </p>
                ) : (
                  <div className="form-field-gap8">
                    <select
                      value={linkedAssetId}
                      onChange={(e) => handleHouseSelect(e.target.value)}
                      className="form-input"
                    >
                      <option value="">None - No linking</option>

                      {availableHouses.map((house) => {
                        const isLinked = Boolean(house.linked_loan_id);

                        return (
                          <option
                            key={house.id}
                            value={house.id}
                            disabled={isLinked}
                          >
                            {house.name} {isLinked ? "(already linked)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {linkError && <p className="form-inline-error">{linkError}</p>}

                    {linkedAssetId && !linkError && (
                      <div className="link-card-synced">
                        <Link/> Linked to{" "}
                        {
                          availableHouses.find(
                            (house) => house.id === linkedAssetId
                          )?.name
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span><DollarSign/></span>
                <div className="preview-card-label">Estimated Payment</div>
              </div>
              <div className="preview-card-amount">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="preview-card-sub">Principal + interest only</div>
            </div>

          </div>
        </div>

        <div className="form-actions">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="form-btn-secondary"
            >
              Cancel
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


export function CarLoanExpenseForm({ dispatch, state, onClose, onToast }) {
  const [name, setName] = useState("Car Loan");
  const [originalPrincipal, setOriginalPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("7.5");
  const [loanTermYears, setLoanTermYears] = useState("5");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const [linkedAssetId, setLinkedAssetId] = useState("");
  const [linkError, setLinkError] = useState("");

  const availableCars = state?.assets?.car || [];

  const handleCarSelect = (assetId: string) => {
    setLinkError("");

    if (!assetId) {
      setLinkedAssetId("");
      return;
    }

    const selectedCar = availableCars.find((car) => car.id === assetId);

    if (selectedCar?.linked_loan_id) {
      setLinkError("This car is already linked to another loan.");
      setLinkedAssetId("");
      return;
    }

    setLinkedAssetId(assetId);

    if (selectedCar) {
      setName(`${selectedCar.name} Loan`);
      setStartAge(selectedCar.start_age.toString());

      const principal = Number(selectedCar.asset_value || 0) - Number(selectedCar.down_payment || 0);
      setOriginalPrincipal(principal.toString());

      if (selectedCar.end_age && selectedCar.start_age) {
        const lifeYears = selectedCar.end_age - selectedCar.start_age;
        setLoanTermYears(lifeYears.toString());
      }
    }
  };

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

  const calculatedEndYear = startAge && loanTermYears ? Number(startAge) + Number(loanTermYears) : "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    if (linkError) return;

    const loanId = crypto.randomUUID();

    const carLoanExpense = {
      source_type: "expense",
      variant: "car_loan",
      id: loanId,
      name: name || "Car Loan",
      start_age: timeline.start,
      end_age: timeline.end,
      linked_asset_id: linkedAssetId || null,
      monthly_expense: monthlyExpense,
      original_principal: Number(originalPrincipal),
      interest_rate: Number(interestRate) / 100,
      loan_term_years: Number(loanTermYears),
    };

    if (linkedAssetId) {
      const selectedCar = availableCars.find((car) => car.id === linkedAssetId);

      if (selectedCar) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...selectedCar,
            linked_loan_id: loanId,
          },
        });
      }
    }

    dispatch({
      type: "ADD_EXPENSE",
      payload: carLoanExpense,
    });

    onToast(name, "added");

    if (onClose) onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><Car/></div>
        <div>
          <h3 className="form-header-title">Add Car Loan</h3>
          <p className="form-header-desc">
            Add vehicle loan details and optionally link it to a car asset.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-field">
              <label className="form-label">Loan Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Mazda 3 Loan" />
            </div>

            <div className="form-field">
              <label className="form-label">Original Principal</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(originalPrincipal)} onChange={(e) => handleNumberInput(e, setOriginalPrincipal)} className="form-input form-input-prefix-dollar" placeholder="25,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate %</label>
              <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input" placeholder="7.5" type="number" step="0.01" required />
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} className="form-input" placeholder="5" type="number" required />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a Car Asset</div>
                    <div className="link-card-sub">
                      Sync this loan with an existing vehicle
                    </div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {availableCars.length === 0 ? (
                  <p className="link-card-no-accounts">
                    No car assets available.
                  </p>
                ) : (
                  <div className="form-field-gap8">
                    <select
                      value={linkedAssetId}
                      onChange={(e) => handleCarSelect(e.target.value)}
                      className="form-input"
                    >
                      <option value="">None - No linking</option>

                      {availableCars.map((car) => {
                        const isLinked = car.linked_loan_id;

                        return (
                          <option
                            key={car.id}
                            value={car.id}
                            disabled={isLinked}
                          >
                            {car.name} {isLinked ? "(already linked)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {linkError && <p className="form-inline-error">{linkError}</p>}

                    {linkedAssetId && !linkError && (
                      <div className="link-card-synced">
                        <Link/> Linked to{" "}
                        {
                          availableCars.find(
                            (car) => car.id === linkedAssetId
                          )?.name
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span><DollarSign/></span>
                <div className="preview-card-label">Estimated Payment</div>
              </div>
              <div className="preview-card-amount">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="preview-card-sub">Principal + interest only</div>
            </div>

          </div>
        </div>

        <div className="form-actions">
          {onClose && (
            <button type="button" onClick={onClose} className="form-btn-secondary">
              Cancel
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

export function LivingExpensesForm({ dispatch,state, onToast }) {
  const [name, setName] = useState("Living Expenses");
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "living",
        id: crypto.randomUUID(),
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onToast(name, "added");

    setName("Living Expense");
    setAmount("");
    setGrowth("3");
    setStartAge("");
    setEndAge("");
  };

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon"><ShoppingCart/></div>
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
                <input value={formatNumberWithCommas(amount)} onChange={(e) => handleNumberInput(e, setAmount)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="3,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><DollarSign/></span>
                <span className="preview-card-label">Annual Cost</span>
              </div>
              <div className="preview-card-amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
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

export function DebtExpenseForm({ dispatch,state, onToast }) {
  const [name, setName] = useState("Debt Expense");
  const [debtAmount, setDebtAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "debt",
        id: crypto.randomUUID(),
        name: name || "Debt",
        start_age: timeline.start,
        end_age: timeline.end,
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    onToast(name, "added");

    setName("Debt Expense");
    setDebtAmount("");
    setMonthlyPayment("");
    setInterestRate("");
    setStartAge("");
    setEndAge("");
  };

  const annualPayment = Number(monthlyPayment) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon"><HandCoins/></div>
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
                <input className="form-input form-input-prefix-dollar" value={formatNumberWithCommas(debtAmount)} onChange={(e) => handleNumberInput(e, setDebtAmount)} type="text" inputMode="decimal" placeholder="25,000" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input className="form-input form-input-prefix-dollar form-input-suffix" value={formatNumberWithCommas(monthlyPayment)} onChange={(e) => handleNumberInput(e, setMonthlyPayment)} type="text" inputMode="decimal" placeholder="400" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label-muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input type="number" placeholder="6.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input-suffix" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><DollarSign/></span>
                <span className="preview-card-label">Annual Payment</span>
              </div>
              <div className="preview-card-amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
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

export function RentExpenseForm({ dispatch,state, onToast, }) {
  const [amount, setAmount] = useState("");
  const [growth, setGrowth] = useState("3");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "ADD_EXPENSE",
      payload: {
        source_type: "expense",
        variant: "rent",
        id: crypto.randomUUID(),
        name: "Rent",
        start_age: timeline.start,
        end_age: timeline.end,
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onToast("Rent", "added");

    setAmount("");
    setGrowth("");
    setStartAge("");
    setEndAge("");
  };

  const annualRent = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon"><BanknoteArrowDown/></div>
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
                <input className="form-input form-input-prefix-dollar form-input-suffix" onChange={(e) => handleNumberInput(e, setAmount)} value={formatNumberWithCommas(amount)} placeholder="2,000" type="text" required />
              </div>
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon"><DollarSign/></span>
                <span className="preview-card-label">Annual Rent Cost</span>
              </div>
              <div className="preview-card-amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
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

export function EditCarLoanExpenseForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name || "Car Loan");
  const [originalPrincipal, setOriginalPrincipal] = useState(item.original_principal?.toString() || "");
  const [interestRate, setInterestRate] = useState(item.interest_rate == null ? "" : (item.interest_rate * 100).toString());
  const [loanTermYears, setLoanTermYears] = useState(item.loan_term_years?.toString() || "5");
  const [startAge, setStartAge] = useState(item.start_age?.toString() || "");
  const [endAge, setEndAge] = useState(item.end_age?.toString() || "");
  const [linkedAssetId, setLinkedAssetId] = useState(item.linked_asset_id || "");
  const [linkError, setLinkError] = useState("");

  const availableCars = state?.assets?.car || [];

  const monthlyExpense = Number(originalPrincipal) > 0 && Number(interestRate) >= 0 && Number(loanTermYears) > 0
    ? calculateMonthlyLoanPayment(Number(originalPrincipal), Number(interestRate) / 100, Number(loanTermYears))
    : 0;
  const calculatedEndYear = Number(startAge) + Number(loanTermYears);

  const handleCarSelect = (assetId: string) => {
    setLinkError("");
    if (!assetId) { setLinkedAssetId(""); return; }

    const selectedCar = availableCars.find((car) => car.id === assetId);
    if (selectedCar?.linked_loan_id && selectedCar.linked_loan_id !== item.id) {
      setLinkError("This car is already linked to another loan.");
      setLinkedAssetId("");
      return;
    }

    setLinkedAssetId(assetId);
    if (selectedCar) {
      setName(`${selectedCar.name} Loan`);
      setStartAge(selectedCar.start_age.toString());
      const principal = Number(selectedCar.asset_value || 0) - Number(selectedCar.down_payment || 0);
      setOriginalPrincipal(principal.toString());

      if (selectedCar.end_age && selectedCar.start_age) {
        setLoanTermYears((selectedCar.end_age - selectedCar.start_age).toString());
      }
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }
    if (linkError) return;

    if (item.linked_asset_id && item.linked_asset_id !== linkedAssetId) {
      const oldCar = availableCars.find((car) => car.id === item.linked_asset_id);
      if (oldCar) dispatch({ type: "UPDATE_ASSET", payload: { ...oldCar, linked_loan_id: null } });
    }

    if (linkedAssetId && linkedAssetId !== item.linked_asset_id) {
      const selectedCar = availableCars.find((car) => car.id === linkedAssetId);
      if (selectedCar) dispatch({ type: "UPDATE_ASSET", payload: { ...selectedCar, linked_loan_id: item.id } });
    }

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        source_type: "expense",
        variant: "car_loan",
        name: name || "Car Loan",
        start_age: timeline.start,
        end_age: timeline.end,
        linked_asset_id: linkedAssetId || null,
        monthly_expense: monthlyExpense,
        original_principal: Number(originalPrincipal),
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
      },
    });

    onToast(name, "edited");

    onClose();
  };

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon"><Car/></div>
        <div>
          <h3 className="form-header-title">Edit Car Loan</h3>
          <p className="form-header-desc">Update vehicle loan details, payment assumptions, and timeline.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Loan Details</p>

            <div className="form-field">
              <label className="form-label">Loan Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Mazda 3 Loan" />
            </div>

            <div className="form-field">
              <label className="form-label">Original Principal</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(originalPrincipal)} onChange={(e) => handleNumberInput(e, setOriginalPrincipal)} className="form-input form-input-prefix-dollar" placeholder="25,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Interest Rate</label>
              <div className="form-input-wrap">
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input-suffix" placeholder="7.5" type="number" step="0.01" required />
                <span className="form-input-suffix">%</span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Loan Term Years</label>
              <input value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} className="form-input" placeholder="5" type="number" required />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon"><Link/></span>
                  <div>
                    <div className="link-card-title">Link to a Car Asset</div>
                    <div className="link-card-sub">Sync this loan with an existing vehicle</div>
                  </div>
                </div>
              </div>
              <div className="link-card-body">
                {availableCars.length === 0 ? (
                  <p className="link-card-no-accounts">No car assets available.</p>
                ) : item.linked_asset_id ? (
                  <div className="link-card-synced">
                    🔗 Linked to {availableCars.find((car) => car.id === item.linked_asset_id)?.name || "Car"}
                    <p className="form-inline-muted">Delete the linked car to reassign</p>
                  </div>
                ) : (
                  <div className="form-field-gap8">
                    <select value={linkedAssetId} onChange={(e) => handleCarSelect(e.target.value)} className="form-input">
                      <option value="">None - No linking</option>
                      {availableCars.map((car) => (
                        <option key={car.id} value={car.id} disabled={car.linked_loan_id && car.linked_loan_id !== item.id}>
                          {car.name} {car.linked_loan_id && car.linked_loan_id !== item.id ? "(already linked)" : ""}
                        </option>
                      ))}
                    </select>
                    {linkError && <p className="form-inline-error">{linkError}</p>}
                    {linkedAssetId && !linkError && (
                      <div className="link-card-synced">
                        🔗 Linked to {availableCars.find((car) => car.id === linkedAssetId)?.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span><DollarSign/></span>
                <div className="preview-card-label">Estimated Payment</div>
              </div>
              <div className="preview-card-amount">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="preview-card-sub">Principal + interest only</div>
            </div>
            
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">Cancel</button>
          <button type="submit" className="form-btn-submit">Save Car Loan</button>
        </div>
      </form>
    </div>
  );
}

export function EditHouseLoanExpenseForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name || "Home Loan");
  const [originalPrincipal, setOriginalPrincipal] = useState(item.original_principal?.toString() || "" );
  const [interestRate, setInterestRate] = useState(
    item.interest_rate == null ? "" : (item.interest_rate * 100).toString()
  );
  const [loanTermYears, setLoanTermYears] = useState(
    item.loan_term_years?.toString() || "30"
  );
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(
    item.extra_monthly_payment == null
      ? ""
      : item.extra_monthly_payment.toString()
  );
  const [startAge, setStartAge] = useState(
    item.start_age?.toString() || ""
  );
  const [endAge, setEndAge] = useState(
    item.end_age?.toString() || ""
  );


  const isAlreadyLinked = !!item.linked_asset_id;

  const [linkedAssetId, setLinkedAssetId] = useState("");
  const [linkError, setLinkError] = useState("");

  const availableHouses = state?.assets?.house || [];

  const linkedHouse = linkedAssetId
  ? availableHouses.find((house) => house.id === linkedAssetId)
  : null;


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

  const calculatedEndYear =
    startAge && loanTermYears
      ? Number(startAge) + Number(loanTermYears)
      : "";

  const handleHouseSelect = (assetId: string) => {
    setLinkError("");

    if (!assetId) {
      setLinkedAssetId("");
      return;
    }

    const selectedHouse = availableHouses.find(
      (house) => house.id === assetId
    );

    if (
      selectedHouse?.linked_loan_id &&
      selectedHouse.linked_loan_id !== item.id
    ) {
      setLinkError("This house is already linked to another loan.");
      setLinkedAssetId("");
      return;
    }

    setLinkedAssetId(assetId);

    if (selectedHouse) {
      setName(`${selectedHouse.name} Loan`);
      setStartAge(selectedHouse.start_age.toString());

      const principal = Number(selectedHouse.asset_value || 0) - Number(selectedHouse.down_payment || 0);

      setOriginalPrincipal(principal.toString());

      if (selectedHouse.end_age && selectedHouse.start_age) {
        setLoanTermYears((selectedHouse.end_age - selectedHouse.start_age).toString());
      }
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    if (linkError) return;

    //  If this loan used to be linked to a different house, clear old house
    if (item.linked_asset_id && item.linked_asset_id !== linkedAssetId) {
      const oldHouse = availableHouses.find(
        (house) => house.id === item.linked_asset_id
      );

      if (oldHouse) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...oldHouse,
            linked_loan_id: null,
          },
        });
      }
    }

    // If this loan is now linked to a new house, update that house
    if (linkedAssetId && linkedAssetId !== item.linked_asset_id) {
      const selectedHouse = availableHouses.find(
        (house) => house.id === linkedAssetId
      );

      if (selectedHouse) {
        dispatch({
          type: "UPDATE_ASSET",
          payload: {
            ...selectedHouse,
            linked_loan_id: item.id,
          },
        });
      }
    }

    //  Update the loan itself
    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        source_type: "expense",
        variant: "house_loan",
        name: name || "Home Loan",
        start_age: timeline.start,
        end_age: timeline.end,
        linked_asset_id: item.linked_asset_id || linkedAssetId || null,
        monthly_expense: monthlyExpense,
        original_principal: Number(originalPrincipal),
        interest_rate: Number(interestRate) / 100,
        loan_term_years: Number(loanTermYears),
        extra_monthly_payment:
          extraMonthlyPayment === "" ? null : Number(extraMonthlyPayment),
      },
    });

    onToast(name, "edited");

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
                  value={formatNumberWithCommas(originalPrincipal)}
                  onChange={(e) =>
                    handleNumberInput(e, setOriginalPrincipal)
                  }
                  className="form-input form-input-prefix-dollar"
                  placeholder="320,000"
                  type="text"
                  inputMode="decimal"
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
                  className="form-input form-input-suffix"
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
                <span className="form-label-muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input
                  value={formatNumberWithCommas(extraMonthlyPayment)}
                  onChange={(e) =>
                    handleNumberInput(e, setExtraMonthlyPayment)
                  }
                  className="form-input form-input-prefix-dollar"
                  placeholder="0"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            <div className="link-card">
              <div className="link-card-header">
                <div className="link-card-info">
                  <span className="preview-icon">🏡</span>
                  <div>
                    <div className="link-card-title">
                      Link to a House Asset
                    </div>
                    <div className="link-card-sub">
                      Sync this loan with an existing house
                    </div>
                  </div>
                </div>
              </div>

              <div className="link-card-body">
                {availableHouses.length === 0 ? (
                  <p className="link-card-no-accounts">
                    No house assets available.
                  </p>
                ) : isAlreadyLinked ? (
                  <div className="link-card-synced">
                    🔗 Linked to {linkedHouse?.name || "House asset"}

                    <p className="form-inline-muted">Delete the linked house to reassign</p>
                  </div>
                ) : (
                  <div className="form-field-gap8">
                    <select
                      value={linkedAssetId}
                      onChange={(e) => handleHouseSelect(e.target.value)}
                      className="form-input"
                    >
                      <option value="">None - No linking</option>

                      {availableHouses.map((house) => {
                        const isLinked = Boolean(house.linked_loan_id);

                        return (
                          <option
                            key={house.id}
                            value={house.id}
                            disabled={isLinked}
                          >
                            {house.name} {isLinked ? "(already linked)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {linkError && <p className="form-inline-error">{linkError}</p>}

                    {linkedAssetId && !linkError && (
                      <div className="link-card-synced">
                        🔗 Linked to {linkedHouse?.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span><DollarSign/></span>
                <div className="preview-card-label">Estimated Payment</div>
              </div>
              <div className="preview-card-amount">
                $
                {monthlyExpense.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </div>
              <div className="preview-card-sub">Principal + interest only</div>
            </div>

          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            onClick={onClose}
            className="form-btn-cancel"
          >
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

export function EditLivingExpensesForm({ item, dispatch,state, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "living",
        name,
        start_age: timeline.start,
        end_age: timeline.end,
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onToast(name, "edited");

    onClose();
  };

  const annualExpense = Number(amount) * 12;

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon"><House/></div>
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
                <input value={formatNumberWithCommas(amount)} onChange={(e) => handleNumberInput(e, setAmount)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="3,000" type="text" />
              </div>
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon">💸</span>
                <span className="preview-card-label">Annual Cost</span>
              </div>
              <div className="preview-card-amount">
                ${annualExpense.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">${(Number(amount) || 0).toLocaleString()}/mo × 12</div>
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

export function EditRentExpenseForm({ item, dispatch,state, onClose, onToast }) {
  const [amount, setAmount] = useState(item.monthly_expense.toString());
  const [growth, setGrowth] = useState((item.expense_growth * 100).toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age.toString());
  const [name, setName] = useState(item.name || "Rent");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "rent",
        name: name || "Rent",
        start_age: timeline.start,
        end_age: timeline.end,
        monthly_expense: Number(amount),
        expense_growth: Number(growth) / 100,
      },
    });

    onToast(name, "edited");

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
                <input value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="2,000" />
              </div>
            </div>

            <div className="form-field-gap8">
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

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Cost Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon">💸</span>
                <span className="preview-card-label">Annual Rent Cost</span>
              </div>
              <div className="preview-card-amount">
                ${annualRent.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
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

export function EditDebtExpenseForm({ item, dispatch,state, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [debtAmount, setDebtAmount] = useState(item.debt_amount.toString());
  const [monthlyPayment, setMonthlyPayment] = useState(item.monthly_expense.toString());
  const [interestRate, setInterestRate] = useState(item.interest_rate == null ? "" : (item.interest_rate * 100).toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);
    
        if (timeline.invalid) {
            return;
        }

    dispatch({
      type: "UPDATE_EXPENSE",
      payload: {
        ...item,
        variant: "debt",
        name: name || "Debt",
        start_age: timeline.start,
        end_age: timeline.end,
        debt_amount: Number(debtAmount),
        monthly_expense: Number(monthlyPayment),
        interest_rate: interestRate === "" ? null : Number(interestRate) / 100,
      },
    });

    onToast(name, "edited");

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
                <input value={formatNumberWithCommas(debtAmount)} onChange={(e) => handleNumberInput(e, setDebtAmount)} className="form-input form-input-prefix-dollar" placeholder="25,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Monthly Payment</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <span className="form-input-suffix">/mo</span>
                <input value={formatNumberWithCommas(monthlyPayment)} onChange={(e) => handleNumberInput(e, setMonthlyPayment)} className="form-input form-input-prefix-dollar form-input-suffix" placeholder="400" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Interest Rate <span className="form-label-muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="form-input form-input-suffix" placeholder="6.5" type="number" />
                <span className="form-input-suffix">%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
            state={state}
            startAge={startAge}
            endAge={endAge}
            setStartAge={setStartAge}
            setEndAge={setEndAge}
          />

            {/* Annual Payment Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <span className="preview-icon">💸</span>
                <span className="preview-card-label">Annual Payment</span>
              </div>
              <div className="preview-card-amount">
                ${annualPayment.toLocaleString()}
                <span className="preview-card-unit">/yr</span>
              </div>
              <div className="preview-card-sub">
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
