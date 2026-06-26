// ═══════════════════════════════════════════════════════════════════════════
// finance.js — port of finance.py
// ═══════════════════════════════════════════════════════════════════════════

import {
  TaxService,
  STANDARD_DEDUCTION,
} from "@/app/dashboard/tax";

// ═══════════════════════════════════════════════════════════════════════════
// INTEREST CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════

class InterestCalculator {
  tiers;

  constructor(tiers) {
    this.tiers = tiers;
  }

  calculateTieredMonthlyInterest(balance) {
    if (balance <= 0 || !this.tiers || this.tiers.length === 0) return 0.0;

    let remaining = balance;
    let interest = 0.0;
    let prevThreshold = 0.0;
    let lastRate = 0.0;

    for (const tier of this.tiers) {
      const tierSize = tier.threshold - prevThreshold;
      const amountInTier = Math.min(remaining, tierSize);
      const monthlyRate = tier.annual_rate / 12;
      interest += amountInTier * monthlyRate;
      remaining -= amountInTier;
      prevThreshold = tier.threshold;
      lastRate = tier.annual_rate;
      if (remaining <= 0) return interest;
    }

    // Handle balance above highest tier
    if (remaining > 0) {
      const monthlyRate = lastRate / 12;
      interest += remaining * monthlyRate;
    }

    return interest;
  }

  static calculateSimpleMonthlyReturn(balance, annualReturn) {
    const monthlyRate = annualReturn / 12;
    return balance * monthlyRate;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT SIMULATORS
// ═══════════════════════════════════════════════════════════════════════════

class CheckingAccountSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    balance;
    interestCalculator;
    totalYearInterestEarned;
    monthlyBalanceHistory;
    monthlyInterestHistory;

  constructor(account) {
    this._id = account.id;
    this._variant = account.variant;
    this.name = account.name;
    this.startAge = account.start_age;
    this.endAge = account.end_age;

    this.balance = account.starting_balance;

    this.interestCalculator = new InterestCalculator(account.interest_tiers);

    this.totalYearInterestEarned = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  deposit(amount) {
    this.balance += amount;
  }

  withdraw(amount) {
    this.balance -= amount;
  }

  processMonthEnd() {
    const interest = this.interestCalculator.calculateTieredMonthlyInterest(this.balance);
    this.balance += interest;
    this.totalYearInterestEarned += interest;
    this.monthlyInterestHistory.push(interest);
    this.monthlyBalanceHistory.push(this.balance);
    return {
      balance: this.balance,
      interest_earned: this.totalYearInterestEarned,
      monthly_balance_history: this.monthlyBalanceHistory,
      monthly_interest_history: this.monthlyInterestHistory,
    };
  }

  processYearEnd() {
    this.totalYearInterestEarned = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
  }

  getBalance() {
    return this.balance;
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      balance: Math.round(this.balance * 100) / 100,
      annual_interest_earned: Math.round(this.totalYearInterestEarned * 100) / 100,
      balance_history: this.monthlyBalanceHistory,
      interest_history: this.monthlyInterestHistory,
    };
  }
}

class EmployerRetirementAccountSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    balance;
    expectedReturn;
    employerMatchRate;
    employerMatchLimit;
    contributionMode;
    contributionPercentage;
    monthlyContributionFixed;
    linkedIncomeId;
    totalYearlyInterestEarned;
    totalYearlyEmployeeContributions;
    totalYearlyEmployerContributions;
    monthlyBalanceHistory;
    monthlyInterestHistory;

  constructor(account) {
    this._id = account.id;
    this._variant = account.variant;
    this.name = account.name;
    this.startAge = account.start_age;
    this.endAge = account.end_age;

    this.balance = account.starting_balance;

    this.expectedReturn = account.expected_return;
    this.employerMatchRate = account.employer_match_rate;
    this.employerMatchLimit = account.employer_match_limit;

    this.contributionMode = account.contribution_mode;
    this.contributionPercentage = account.contribution_percentage;
    this.monthlyContributionFixed = account.monthly_contribution;
    this.linkedIncomeId = account.linked_income_id;

    this.totalYearlyInterestEarned = 0.0;
    this.totalYearlyEmployeeContributions = 0.0;
    this.totalYearlyEmployerContributions = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  calculateEmployeeContribution(grossIncome) {
    if (this.contributionMode === "percentage") {
      return grossIncome * this.contributionPercentage;
    }
    return this.monthlyContributionFixed;
  }

  deposit(amount) {
    this.balance += amount;
  }

  contributeEmployee(amount) {
    this.deposit(amount);
    this.totalYearlyEmployeeContributions += amount;
  }

  contributeEmployer(employeeAmount, monthlyGross) {
    const matchCap = monthlyGross * this.employerMatchLimit;
    const matchedContribution = Math.min(employeeAmount, matchCap);
    const matchAmount = matchedContribution * this.employerMatchRate;
    this.deposit(matchAmount);
    this.totalYearlyEmployerContributions += matchAmount;
  }

  withdraw(amount) {
    this.balance = Math.max(0, this.balance - amount);
  }

  processMonthEnd() {
    const interest = InterestCalculator.calculateSimpleMonthlyReturn(
      this.balance,
      this.expectedReturn
    );
    this.balance += interest;
    this.totalYearlyInterestEarned += interest;
    this.monthlyInterestHistory.push(interest);
    this.monthlyBalanceHistory.push(this.balance);
    return {
      balance: Math.round(this.balance * 100) / 100,
      interest_earned: Math.round(this.totalYearlyInterestEarned * 100) / 100,
      monthly_balance_history: this.monthlyBalanceHistory,
      monthly_interest_history: this.monthlyInterestHistory,
    };
  }

  processYearEnd() {
    this.totalYearlyInterestEarned = 0.0;
    this.totalYearlyEmployeeContributions = 0.0;
    this.totalYearlyEmployerContributions = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
  }

  getBalance() {
    return this.balance;
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      balance: Math.round(this.balance * 100) / 100,
      annual_interest_earned: Math.round(this.totalYearlyInterestEarned * 100) / 100,
      total_employee_contributions: Math.round(this.totalYearlyEmployeeContributions * 100) / 100,
      total_employer_contributions: Math.round(this.totalYearlyEmployerContributions * 100) / 100,
      balance_history: this.monthlyBalanceHistory,
      interest_history: this.monthlyInterestHistory,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const QUALIFIED_DIVIDEND_TAX_RATE = 0.15;

class TaxableInvestmentSim {
    _id
    _variant;
    name;
    startAge;
    endAge;
    expectedReturn;
    dividendYield;
    dividendReinvestment;
    contributionMode;
    monthlyContributionFixed;
    contributionPercentage;
    linkedIncomeId;
    lotMethod;
    filingStatus;
    balance;
    costBasis;
    taxLots;
    annualAppreciationEarned;
    annualDividendsEarned;
    annualCapitalGainsRealized;
    monthlyBalanceHistory;
    monthlyReturnHistory;
    _monthIndex;

  constructor(account, filingStatus = "single", state = "MI") {
    this._id = account.id;
    this._variant = account.variant;
    this.name = account.name;
    this.startAge = account.start_age;
    this.endAge = account.end_age;

    this.expectedReturn = account.expected_return;
    this.dividendYield = account.dividend_yield;
    this.dividendReinvestment = account.dividend_reinvestment; // "drip" | "cash_out"
    this.contributionMode = account.contribution_mode;         // "dollar" | "percentage"
    this.monthlyContributionFixed = account.monthly_contribution;
    this.contributionPercentage = (account.contribution_percentage ?? 0.0);

    this.linkedIncomeId = account.linked_income_id ?? null;
    this.lotMethod = account.lot_method ?? "hifo";
    this.filingStatus = filingStatus;

    this.balance = account.starting_balance;
    this.costBasis = account.starting_balance;

    // Tax lots: { month_index: int, cost: float }
    this.taxLots = [];
    if (account.starting_balance > 0) {
      this.taxLots.push({ month_index: -13, cost: account.starting_balance });
    }

    this.annualAppreciationEarned = 0.0;
    this.annualDividendsEarned = 0.0;
    this.annualCapitalGainsRealized = 0.0;

    this.monthlyBalanceHistory = [];
    this.monthlyReturnHistory = [];

    this._monthIndex = 0;
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  calculateContribution(monthlyGross = 0.0) {
    if (this.contributionMode === "percentage") {
      return monthlyGross * this.contributionPercentage;
    }
    return this.monthlyContributionFixed;
  }

  deposit(amount) {
    if (amount <= 0) return;
    this.balance += amount;
    this.costBasis += amount;
    this.taxLots.push({ month_index: this._monthIndex, cost: amount });
  }

  _dripDeposit(amount) {
    if (amount <= 0) return;
    this.balance += amount;
    this.costBasis += amount;
    this.taxLots.push({ month_index: this._monthIndex, cost: amount });
  }

  withdraw(amount) {
    this.balance = Math.max(0.0, this.balance - amount);
  }

  processMonthEnd() {
    const monthlyRate = this.expectedReturn / 12;
    const appreciation = this.balance * monthlyRate;
    this.balance += appreciation;
    this.annualAppreciationEarned += appreciation;

    const dividend = this.balance * (this.dividendYield / 12);
    this.annualDividendsEarned += dividend;

    let cashDividendOut = 0.0;
    if (this.dividendReinvestment === "drip") {
      this._dripDeposit(dividend);
    } else {
      cashDividendOut = dividend;
    }

    this.monthlyBalanceHistory.push(Math.round(this.balance * 100) / 100);
    this.monthlyReturnHistory.push(Math.round(appreciation * 100) / 100);
    this._monthIndex += 1;

    return cashDividendOut;
  }

  processYearEnd() {
    const dividendTax = this.annualDividendsEarned * QUALIFIED_DIVIDEND_TAX_RATE;
    const capitalGainsTax = this.annualCapitalGainsRealized * QUALIFIED_DIVIDEND_TAX_RATE;
    const taxesOwed = dividendTax + capitalGainsTax;

    this.annualAppreciationEarned = 0.0;
    this.annualDividendsEarned = 0.0;
    this.annualCapitalGainsRealized = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyReturnHistory = [];

    return Math.round(taxesOwed * 100) / 100;
  }

  getBalance() {
    return this.balance;
  }

  snapshot() {
    const unrealizedGain = this.balance - this.costBasis;
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      balance: Math.round(this.balance * 100) / 100,
      cost_basis: Math.round(this.costBasis * 100) / 100,
      unrealized_gain: Math.round(unrealizedGain * 100) / 100,
      annual_appreciation_earned: Math.round(this.annualAppreciationEarned * 100) / 100,
      annual_dividends_earned: Math.round(this.annualDividendsEarned * 100) / 100,
      annual_capital_gains_realized: Math.round(this.annualCapitalGainsRealized * 100) / 100,
      balance_history: this.monthlyBalanceHistory,
      return_history: this.monthlyReturnHistory,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INCOME SIMULATORS
// ═══════════════════════════════════════════════════════════════════════════

const ANNUAL_401K_EMPLOYEE_LIMIT = 23500;

class SalaryIncomeSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    grossAnnual;
    incomeGrowth;
    currentGrossAnnual;
    retirementAccount;
    taxService;
    annual401kContributions;
    annualFederalTax;
    annualFicaTax;
    annualStateTax;
    annualTotalTax;
    currentNetAnnual;

  constructor(income, retirementAccount = null, filingStatus = "single", state = "MI") {
    this._id = income.id;
    this._variant = income.variant;
    this.name = income.name;
    this.startAge = income.start_age;
    this.endAge = income.end_age;

    this.grossAnnual = income.gross_income;
    this.incomeGrowth = income.income_growth;
    this.currentGrossAnnual = this.grossAnnual;

    this.retirementAccount = retirementAccount;
    this.taxService = new TaxService(filingStatus, state);

    this._calculateAndSetAnnualValues();
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  _calculateAndSetAnnualValues() {
    if (this.retirementAccount) {
      const monthlyGross = this.currentGrossAnnual / 12;
      const monthly401k = this.retirementAccount.calculateEmployeeContribution(monthlyGross);
      this.annual401kContributions = Math.min(monthly401k * 12, ANNUAL_401K_EMPLOYEE_LIMIT);
    } else {
      this.annual401kContributions = 0.0;
    }

    const taxes = this.taxService.calculateIncomeTaxes(
      this.currentGrossAnnual,
      this.annual401kContributions
    );

    this.annualFederalTax = taxes.federal;
    this.annualFicaTax = taxes.fica;
    this.annualStateTax = taxes.state;
    this.annualTotalTax = taxes.total;

    this.currentNetAnnual =
      this.currentGrossAnnual - this.annual401kContributions - this.annualTotalTax;
  }

  _applyRetirementContribution(contribution, monthlyGross) {
    if (!this.retirementAccount) return;
    this.retirementAccount.contributeEmployee(contribution);
    this.retirementAccount.contributeEmployer(contribution, monthlyGross);
  }

  processMonthlyPayroll() {
    const monthly401k = this.annual401kContributions / 12;
    const monthlyGross = this.currentGrossAnnual / 12;
    this._applyRetirementContribution(monthly401k, monthlyGross);
    return {
      gross_income: Math.round(this.grossAnnual * 100) / 100,
      taxable_income: Math.round(((this.currentGrossAnnual - this.annual401kContributions) / 12) * 100) / 100,
      retirement_contribution: Math.round(monthly401k * 100) / 100,
      net_income: Math.round((this.currentNetAnnual / 12) * 100) / 100,
      taxes: {
        total: this.annualTotalTax / 12,
        federal: this.annualFederalTax / 12,
        fica: this.annualFicaTax / 12,
        state: this.annualStateTax / 12,
      },
    };
  }

  calculateGrowth() {
    return this.currentGrossAnnual * (1 + this.incomeGrowth);
  }

  _applyGrowth() {
    this.currentGrossAnnual = this.calculateGrowth();
  }

  processYearEnd() {
    this._applyGrowth();
    this._calculateAndSetAnnualValues();
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      gross_annual: Math.round(this.currentGrossAnnual * 100) / 100,
      net_annual: Math.round(this.currentNetAnnual * 100) / 100,
      annual_401k_contributions: Math.round(this.annual401kContributions * 100) / 100,
      taxes: {
        federal: Math.round(this.annualFederalTax * 100) / 100,
        fica: Math.round(this.annualFicaTax * 100) / 100,
        state: Math.round(this.annualStateTax * 100) / 100,
      },
    };
  }
}

class HourlyIncomeSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    hourlyRate;
    hoursPerWeek;
    incomeGrowth;
    currentGrossAnnual;
    retirementAccount;
    taxService;
    
    annual401kContributions;
    annualFederalTax;
    annualFicaTax;
    annualStateTax;
    annualTotalTax;
    currentNetAnnual;

  constructor(income, retirementAccount = null, filingStatus = "single", state = "MI") {
    this._id = income.id;
    this._variant = income.variant;
    this.name = income.name;
    this.startAge = income.start_age;
    this.endAge = income.end_age;
    this.hourlyRate = income.hourly_rate;
    this.hoursPerWeek = income.hours_per_week;
    this.incomeGrowth = income.income_growth;
    this.currentGrossAnnual = this.hourlyRate * this.hoursPerWeek * 52;
    this.retirementAccount = retirementAccount;
    this.taxService = new TaxService(filingStatus, state);
    this._calculateAndSetAnnualValues();
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  _calculateAndSetAnnualValues() {
    if (this.retirementAccount) {
      const monthlyGross = this.currentGrossAnnual / 12;
      const monthly401k = this.retirementAccount.calculateEmployeeContribution(monthlyGross);
      this.annual401kContributions = Math.min(monthly401k * 12, ANNUAL_401K_EMPLOYEE_LIMIT);
    } else {
      this.annual401kContributions = 0.0;
    }

    const taxes = this.taxService.calculateIncomeTaxes(
      this.currentGrossAnnual,
      this.annual401kContributions
    );
    this.annualFederalTax = taxes.federal;
    this.annualFicaTax = taxes.fica;
    this.annualStateTax = taxes.state;
    this.annualTotalTax = taxes.total;
    this.currentNetAnnual =
      this.currentGrossAnnual - this.annual401kContributions - this.annualTotalTax;
  }

  _applyRetirementContribution(monthly401k, monthlyGross) {
    if (!this.retirementAccount) return;
    this.retirementAccount.contributeEmployee(monthly401k);
    this.retirementAccount.contributeEmployer(monthly401k, monthlyGross);
  }

  processMonthlyPayroll() {
    const monthly401k = this.annual401kContributions / 12;
    const monthlyGross = this.currentGrossAnnual / 12;
    this._applyRetirementContribution(monthly401k, monthlyGross);
    return {
      gross_income: Math.round(monthlyGross * 100) / 100,
      taxable_income: Math.round(((this.currentGrossAnnual - this.annual401kContributions) / 12) * 100) / 100,
      retirement_contribution: Math.round(monthly401k * 100) / 100,
      net_income: Math.round((this.currentNetAnnual / 12) * 100) / 100,
      taxes: {
        total: this.annualTotalTax / 12,
        federal: this.annualFederalTax / 12,
        fica: this.annualFicaTax / 12,
        state: this.annualStateTax / 12,
      },
    };
  }

  calculateGrowth() {
    const nextRate = this.hourlyRate * (1 + this.incomeGrowth);
    return nextRate * this.hoursPerWeek * 52;
  }

  _applyGrowth() {
    this.hourlyRate = this.hourlyRate * (1 + this.incomeGrowth);
    this.currentGrossAnnual = this.hourlyRate * this.hoursPerWeek * 52;
  }

  processYearEnd() {
    this._applyGrowth();
    this._calculateAndSetAnnualValues();
  }

  snapshot() {
    return {
      id: this._id,
      name: this.name,
      variant: this._variant,
      gross_annual: Math.round(this.currentGrossAnnual * 100) / 100,
      net_annual: Math.round(this.currentNetAnnual * 100) / 100,
      annual_401k_contributions: Math.round(this.annual401kContributions * 100) / 100,
      taxes: {
        federal: Math.round(this.annualFederalTax * 100) / 100,
        fica: Math.round(this.annualFicaTax * 100) / 100,
        state: Math.round(this.annualStateTax * 100) / 100,
      },
    };
  }
}

const SIDE_HUSTLE_INCOME_GROWTH = 0.03;
const PERIODS_PER_YEAR = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
};

class SideHustleIncomeSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    averageIncomePerPeriod;
    frequency;
    variability;
    periodsPerYear;
    periodsPerMonth;
    taxService;
    totalYearGross;
    annualFederalTax;
    annualSeTax;
    annualStateTax;
    annualTotalTax;
    currentNetAnnual;

  constructor(income, filingStatus = "single", state = "MI") {
    this._id = income.id;
    this._variant = income.variant;
    this.name = income.name;
    this.startAge = income.start_age;
    this.endAge = income.end_age;

    this.averageIncomePerPeriod = income.average_income_per_period;
    this.frequency = income.frequency;
    this.variability = income.variability;
    this.periodsPerYear = PERIODS_PER_YEAR[this.frequency];
    this.periodsPerMonth = this.periodsPerYear / 12;

    this.taxService = new TaxService(filingStatus, state);

    this.totalYearGross = 0.0;
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  _calculateAndSetAnnualValues() {
    const taxes = this.taxService.calculateSeIncomeTaxes(this.totalYearGross);
    this.annualFederalTax = taxes.federal;
    this.annualSeTax = taxes.se_tax;
    this.annualStateTax = taxes.state;
    this.annualTotalTax = taxes.total;
    this.currentNetAnnual = this.totalYearGross - this.annualTotalTax;
    return this.annualTotalTax;
  }

  _applyRetirementContribution(_monthly401k, _monthlyGross) {
    // no employer account
  }

  /**
   * Sample from a normal distribution.
   * Uses the Box-Muller transform since JS has no built-in normal distribution.
   */
  _sampleNormal(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
  }

  _sampleMonthlyIncome() {
    const mean = this.averageIncomePerPeriod * this.periodsPerMonth;
    const std = mean * this.variability;
    return Math.max(0.0, this._sampleNormal(mean, std));
  }

  processMonthlyPayroll() {
    const monthlyGross = this._sampleMonthlyIncome();
    this.totalYearGross += monthlyGross;
    return {
      gross_income: Math.round(monthlyGross * 100) / 100,
      taxable_income: Math.round(monthlyGross * 100) / 100,
      retirement_contribution: 0.0,
      net_income: Math.round(monthlyGross * 100) / 100, // full amount, taxes settled at year end
      taxes: {
        total: 0.0,
        federal: 0.0,
        fica: 0.0,
        state: 0.0,
      },
    };
  }

  _computeTaxes(gross) {
    const taxes = this.taxService.calculateSeIncomeTaxes(gross);
    return {
      federal: taxes.federal,
      se_tax: taxes.se_tax,
      state: taxes.state,
      total: taxes.total,
    };
  }

  calculateGrowth() {
    return this.averageIncomePerPeriod * (1 + SIDE_HUSTLE_INCOME_GROWTH) * this.periodsPerYear;
  }

  _applyGrowth() {
    this.averageIncomePerPeriod *= (1 + SIDE_HUSTLE_INCOME_GROWTH);
  }

  processYearEnd() {
    const taxes = this._computeTaxes(this.totalYearGross);
    this.annualFederalTax = taxes.federal;
    this.annualSeTax = taxes.se_tax;
    this.annualStateTax = taxes.state;
    this.annualTotalTax = taxes.total;
    const taxesOwed = taxes.total;
    this._applyGrowth();
    this.totalYearGross = 0.0;
    return taxesOwed;
  }

  snapshot() {
    const taxes = this._computeTaxes(this.totalYearGross);
    const net = this.totalYearGross - taxes.total;
    return {
      id: this._id,
      name: this.name,
      variant: this._variant,
      gross_annual: Math.round(this.totalYearGross * 100) / 100,
      net_annual: Math.round(net * 100) / 100,
      annual_401k_contributions: 0.0,
      taxes: {
        total: Math.round(taxes.total * 100) / 100,
        federal: Math.round(taxes.federal * 100) / 100,
        fica: Math.round(taxes.se_tax * 100) / 100,
        state: Math.round(taxes.state * 100) / 100,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════

class HouseLoanSim {
    _id;
    _variant;
    name;
    startAge;
    linkedAssetId;
    originalPrincipal;
    interestRate;
    loanTermYears;
    extraMonthlyPayment;
    monthlyPayment;
    remainingBalance;
    isPaidOff;
    _lifetimeTotalPaid;
    principalPaid;
    interestPaidLifetime;
    annualPrincipalPaid;
    annualInterestPaid;
    monthlyBalanceHistory;
    monthlyPrincipalHistory;
    monthlyInterestHistory;
    monthlyTotalPaidHistory;

  constructor(loan) {
    this._id = loan.id;
    this._variant = loan.variant;
    this.name = loan.name;
    this.startAge = loan.start_age;
    this.linkedAssetId = loan.linked_asset_id ?? null;

    this.originalPrincipal = loan.original_principal;
    this.interestRate = loan.interest_rate;
    this.loanTermYears = loan.loan_term_years;
    this.extraMonthlyPayment = loan.extra_monthly_payment ?? 0.0;

    // Recalculate monthly payment from first principles
    const r = this.interestRate / 12;
    const n = this.loanTermYears * 12;
    this.monthlyPayment = this.originalPrincipal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    this.remainingBalance = parseFloat(this.originalPrincipal);
    this.isPaidOff = false;

    this._lifetimeTotalPaid = 0.0;
    this.principalPaid = 0.0;
    this.interestPaidLifetime = 0.0;

    this.annualPrincipalPaid = 0.0;
    this.annualInterestPaid = 0.0;

    this.monthlyBalanceHistory = [];
    this.monthlyPrincipalHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyTotalPaidHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && !this.isPaidOff;
  }

  processMonthlyPayment() {
    if (this.isPaidOff || this.remainingBalance <= 0) {
      return { payment: 0.0, principal: 0.0, interest: 0.0, remaining_balance: 0.0 };
    }

    const monthlyRate = this.interestRate / 12;
    const interestPortion = this.remainingBalance * monthlyRate;
    const principalPortion = Math.min(
      this.monthlyPayment - interestPortion,
      this.remainingBalance
    );
    const extra = Math.min(
      this.extraMonthlyPayment,
      this.remainingBalance - principalPortion
    );
    const totalPrincipal = principalPortion + extra;
    const totalPaid = totalPrincipal + interestPortion;

    this.remainingBalance -= totalPrincipal;
    this.remainingBalance = Math.max(0.0, this.remainingBalance);

    this.principalPaid += totalPrincipal;
    this.interestPaidLifetime += interestPortion;
    this.annualPrincipalPaid += totalPrincipal;
    this.annualInterestPaid += interestPortion;
    this._lifetimeTotalPaid += totalPaid;

    if (this.remainingBalance === 0.0) this.isPaidOff = true;

    this.monthlyBalanceHistory.push(Math.round(this.remainingBalance * 100) / 100);
    this.monthlyPrincipalHistory.push(Math.round(totalPrincipal * 100) / 100);
    this.monthlyInterestHistory.push(Math.round(interestPortion * 100) / 100);
    this.monthlyTotalPaidHistory.push(Math.round(this._lifetimeTotalPaid * 100) / 100);

    return {
      payment: Math.round(totalPaid * 100) / 100,
      principal: Math.round(totalPrincipal * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
    };
  }

  terminateOnSale() {
    this.isPaidOff = true;
    const payoffAmount = this.remainingBalance;
    this.remainingBalance = 0.0;
    return payoffAmount;
  }

  processYearEnd() {
    this.annualPrincipalPaid = 0.0;
    this.annualInterestPaid = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyPrincipalHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyTotalPaidHistory = [];
  }

  snapshot() {
    let remainingTermMonths = 0;
    if (this.remainingBalance > 0) {
      const r = this.interestRate / 12;
      if (this.monthlyPayment > this.remainingBalance * r) {
        remainingTermMonths = Math.ceil(
          -Math.log(1 - (this.remainingBalance * r) / this.monthlyPayment) /
            Math.log(1 + r)
        );
      }
    }

    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
      original_principal: this.originalPrincipal,
      principal_paid: Math.round(this.principalPaid * 100) / 100,
      interest_paid_lifetime: Math.round(this.interestPaidLifetime * 100) / 100,
      monthly_payment: Math.round(this.monthlyPayment * 100) / 100,
      extra_monthly_payment: this.extraMonthlyPayment,
      effective_interest_rate: this.interestRate,
      remaining_term_months: remainingTermMonths,
      annual_principal_paid: Math.round(this.annualPrincipalPaid * 100) / 100,
      annual_interest_paid: Math.round(this.annualInterestPaid * 100) / 100,
      balance_history: this.monthlyBalanceHistory,
      principal_history: this.monthlyPrincipalHistory,
      interest_history: this.monthlyInterestHistory,
      total_paid_history: this.monthlyTotalPaidHistory,
    };
  }
}

class CarLoanSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    linkedAssetId;
    originalPrincipal
    interestRate;
    loanTermYears;
    monthlyPayment;
    remainingBalance;
    isPaidOff;
    _lifetimeTotalPaid;
    principalPaid;
    interestPaidLifetime;
    annualPrincipalPaid;
    annualInterestPaid;
    monthlyBalanceHistory;
    monthlyPrincipalHistory;
    monthlyInterestHistory;
    monthlyTotalPaidHistory;

  constructor(loan) {
    this._id = loan.id;
    this._variant = loan.variant;
    this.name = loan.name;
    this.startAge = loan.start_age;
    this.endAge = loan.end_age;
    this.linkedAssetId = loan.linked_asset_id ?? null;

    this.originalPrincipal = loan.original_principal;
    this.interestRate = loan.interest_rate;
    this.loanTermYears = loan.loan_term_years;

    const r = this.interestRate / 12;
    const n = this.loanTermYears * 12;
    this.monthlyPayment = this.originalPrincipal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    this.remainingBalance = parseFloat(this.originalPrincipal);
    this.isPaidOff = false;

    this._lifetimeTotalPaid = 0.0;
    this.principalPaid = 0.0;
    this.interestPaidLifetime = 0.0;

    this.annualPrincipalPaid = 0.0;
    this.annualInterestPaid = 0.0;

    this.monthlyBalanceHistory = [];
    this.monthlyPrincipalHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyTotalPaidHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge && !this.isPaidOff;
  }

  processMonthlyPayment() {
    if (this.isPaidOff || this.remainingBalance <= 0) {
      return { payment: 0.0, principal: 0.0, interest: 0.0, remaining_balance: 0.0 };
    }

    const monthlyRate = this.interestRate / 12;
    const interestPortion = this.remainingBalance * monthlyRate;
    const principalPortion = Math.min(
      this.monthlyPayment - interestPortion,
      this.remainingBalance
    );
    const totalPaid = principalPortion + interestPortion;

    this.remainingBalance -= principalPortion;
    this.remainingBalance = Math.max(0.0, this.remainingBalance);

    this.principalPaid += principalPortion;
    this.interestPaidLifetime += interestPortion;
    this.annualPrincipalPaid += principalPortion;
    this.annualInterestPaid += interestPortion;
    this._lifetimeTotalPaid += totalPaid;

    this.monthlyBalanceHistory.push(Math.round(this.remainingBalance * 100) / 100);
    this.monthlyPrincipalHistory.push(Math.round(principalPortion * 100) / 100);
    this.monthlyInterestHistory.push(Math.round(interestPortion * 100) / 100);
    this.monthlyTotalPaidHistory.push(Math.round(this._lifetimeTotalPaid * 100) / 100);

    if (this.remainingBalance === 0.0) this.isPaidOff = true;

    return {
      payment: Math.round(totalPaid * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
    };
  }

  terminateOnSale() {
    this.isPaidOff = true;
    const payoffAmount = this.remainingBalance;
    this.remainingBalance = 0.0;
    return payoffAmount;
  }

  processYearEnd() {
    this.annualPrincipalPaid = 0.0;
    this.annualInterestPaid = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyPrincipalHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyTotalPaidHistory = [];
  }

  snapshot() {
    const r = this.interestRate / 12;
    let remainingTermMonths = 0;
    if (this.remainingBalance > 0 && this.monthlyPayment > this.remainingBalance * r) {
      remainingTermMonths = Math.ceil(
        -Math.log(1 - (this.remainingBalance * r) / this.monthlyPayment) /
          Math.log(1 + r)
      );
    }

    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
      original_principal: this.originalPrincipal,
      principal_paid: Math.round(this.principalPaid * 100) / 100,
      interest_paid_lifetime: Math.round(this.interestPaidLifetime * 100) / 100,
      monthly_payment: Math.round(this.monthlyPayment * 100) / 100,
      effective_interest_rate: this.interestRate,
      remaining_term_months: remainingTermMonths,
      annual_principal_paid: Math.round(this.annualPrincipalPaid * 100) / 100,
      annual_interest_paid: Math.round(this.annualInterestPaid * 100) / 100,
      balance_history: this.monthlyBalanceHistory,
      principal_history: this.monthlyPrincipalHistory,
      interest_history: this.monthlyInterestHistory,
      total_paid_history: this.monthlyTotalPaidHistory,
    };
  }
}

class LivingExpenseSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    currentMonthlyExpense;
    expenseGrowth;
    annualTotalPaid;
    monthlyPaymentHistory;

  constructor(expense) {
    this._id = expense.id;
    this._variant = expense.variant;
    this.name = expense.name;
    this.startAge = expense.start_age;
    this.endAge = expense.end_age;

    this.currentMonthlyExpense = parseFloat(expense.monthly_expense);
    this.expenseGrowth = expense.expense_growth ?? 0.0;

    this.annualTotalPaid = 0.0;
    this.monthlyPaymentHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge;
  }

  processMonthlyPayment() {
    const payment = this.currentMonthlyExpense;
    this.annualTotalPaid += payment;
    this.monthlyPaymentHistory.push(Math.round(payment * 100) / 100);
    return {
      payment: Math.round(payment * 100) / 100,
      principal: 0.0,
      interest: 0.0,
      remaining_balance: 0.0,
    };
  }

  processYearEnd() {
    this.currentMonthlyExpense *= (1 + this.expenseGrowth);
    this.annualTotalPaid = 0.0;
    this.monthlyPaymentHistory = [];
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      monthly_payment: Math.round(this.currentMonthlyExpense * 100) / 100,
      annual_total_paid: Math.round(this.annualTotalPaid * 100) / 100,
      interest_paid_lifetime: 0.0,
      expense_growth: this.expenseGrowth,
      payment_history: this.monthlyPaymentHistory,
    };
  }
}

class RentSim extends LivingExpenseSim {
  // NOTE: if living or rent diverge we must account for this — right now they're identical
}

class DebtSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    originalBalance;
    monthlyPayment;
    interestRate;
    monthlyRate;
    remainingBalance;
    isPaidOff;
    totalInterestPaid;
    totalAmountPaid;
    annualInterestPaid;
    annualPrincipalPaid;
    monthlyBalanceHistory;
    monthlyInterestHistory;
    monthlyPrincipalHistory;

  constructor(expense) {
    this._id = expense.id;
    this._variant = expense.variant;
    this.name = expense.name;
    this.startAge = expense.start_age;
    this.endAge = expense.end_age;

    this.originalBalance = parseFloat(expense.debt_amount);
    this.monthlyPayment = parseFloat(expense.monthly_expense);
    this.interestRate = parseFloat(expense.interest_rate);
    this.monthlyRate = this.interestRate / 12;

    this.remainingBalance = this.originalBalance;
    this.isPaidOff = false;

    this.totalInterestPaid = 0.0;
    this.totalAmountPaid = 0.0;

    this.annualInterestPaid = 0.0;
    this.annualPrincipalPaid = 0.0;

    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyPrincipalHistory = [];
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && age < this.endAge && !this.isPaidOff;
  }

  _computePayoffProjection() {
    const interestThisMonth = this.remainingBalance * this.monthlyRate;
    const principalThisMonth = this.monthlyPayment - interestThisMonth;

    const underpayingInterest = this.monthlyPayment < interestThisMonth;
    const negativeAmortization = !underpayingInterest && principalThisMonth < 0;
    const neverPaysOff =
      underpayingInterest || (this.monthlyRate === 0 && this.monthlyPayment <= 0);

    let payoffMonths: number | null  = null;
    let payoffAge: number | null = null;
    let payoffDate: string | null = null;

    if (!neverPaysOff) {
      try {
        if (this.monthlyRate === 0) {
          payoffMonths = Math.ceil(this.remainingBalance / this.monthlyPayment);
        } else {
          const n =
            Math.log(
              this.monthlyPayment /
                (this.monthlyPayment - this.monthlyRate * this.remainingBalance)
            ) / Math.log(1 + this.monthlyRate);
          payoffMonths = Math.ceil(n);
        }

        const monthsAlreadyPaid = Math.round(
          (this.originalBalance - this.remainingBalance) /
            Math.max(this.monthlyPayment, 0.01)
        );
        payoffAge =
          Math.round(
            (this.startAge + (monthsAlreadyPaid + payoffMonths) / 12) * 10
          ) / 10;

        const now = new Date();
        const totalMonths = now.getMonth() + payoffMonths;
        const payoffYear = now.getFullYear() + Math.floor(totalMonths / 12);
        const payoffMonth = (totalMonths % 12) + 1;
        payoffDate = `${payoffYear}-${String(payoffMonth).padStart(2, "0")}`;
      } catch {
        // neverPaysOff stays false but we leave nulls
      }
    }

    return {
      payoff_months: payoffMonths,
      payoff_age: payoffAge,
      payoff_date: payoffDate,
      never_pays_off: neverPaysOff,
      negative_amortization: negativeAmortization,
      underpaying_interest: underpayingInterest,
    };
  }

  _minimumPaymentToPayOff() {
    return Math.round((this.remainingBalance * this.monthlyRate + 0.01) * 100) / 100;
  }

  processMonthlyPayment() {
    if (this.isPaidOff || this.remainingBalance <= 0) {
      return { payment: 0.0, principal: 0.0, interest: 0.0, remaining_balance: 0.0 };
    }

    const interestPortion = this.remainingBalance * this.monthlyRate;
    const principalPortion = Math.min(
      this.monthlyPayment - interestPortion,
      this.remainingBalance
    );
    const actualPayment = principalPortion + interestPortion;

    this.remainingBalance -= principalPortion;
    this.remainingBalance = Math.max(0.0, this.remainingBalance);

    this.totalInterestPaid += interestPortion;
    this.totalAmountPaid += actualPayment;
    this.annualInterestPaid += interestPortion;
    this.annualPrincipalPaid += principalPortion; // may go negative if underpaying

    this.monthlyBalanceHistory.push(Math.round(this.remainingBalance * 100) / 100);
    this.monthlyInterestHistory.push(Math.round(interestPortion * 100) / 100);
    this.monthlyPrincipalHistory.push(Math.round(principalPortion * 100) / 100);

    if (this.remainingBalance === 0.0) this.isPaidOff = true;

    return {
      payment: Math.round(actualPayment * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
    };
  }

  processYearEnd() {
    this.annualInterestPaid = 0.0;
    this.annualPrincipalPaid = 0.0;
    this.monthlyBalanceHistory = [];
    this.monthlyInterestHistory = [];
    this.monthlyPrincipalHistory = [];
  }

  snapshot() {
    const projection = this._computePayoffProjection();
    const minPayment = this._minimumPaymentToPayOff();
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      monthly_payment: Math.round(this.monthlyPayment * 100) / 100,
      interest_paid_lifetime: Math.round(this.totalInterestPaid * 100) / 100,
      remaining_balance: Math.round(this.remainingBalance * 100) / 100,
      original_balance: this.originalBalance,
      total_interest_paid: Math.round(this.totalInterestPaid * 100) / 100,
      total_amount_paid: Math.round(this.totalAmountPaid * 100) / 100,
      annual_interest_paid: Math.round(this.annualInterestPaid * 100) / 100,
      annual_principal_paid: Math.round(Math.max(this.annualPrincipalPaid, 0.0) * 100) / 100,
      annual_balance_growth:
        Math.round(Math.abs(Math.min(this.annualPrincipalPaid, 0.0)) * 100) / 100,
      minimum_payment_to_pay_off: minPayment,
      underpaying_by: Math.round(Math.max(minPayment - this.monthlyPayment, 0.0) * 100) / 100,
      ...projection,
      balance_history: this.monthlyBalanceHistory,
      interest_history: this.monthlyInterestHistory,
      principal_history: this.monthlyPrincipalHistory,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════════════════════════════════════════

class HouseAssetSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    annualAppreciation;
    downPayment;
    linkedLoan;
    currentValue;
    isSold;
    
  constructor(asset, linkedLoan = null) {
    this._id = asset.id;
    this._variant = asset.variant;
    this.name = asset.name;
    this.startAge = asset.start_age;
    this.endAge = asset.end_age;
    this.annualAppreciation = asset.annual_appreciation;
    this.downPayment = asset.down_payment;
    this.linkedLoan = linkedLoan;

    this.currentValue = parseFloat(asset.asset_value);
    this.isSold = false;
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && !this.isSold;
  }

  getEquity() {
    const loanBalance = this.linkedLoan ? this.linkedLoan.remainingBalance : 0.0;
    return this.currentValue - loanBalance;
  }

  processYearEnd() {
    this.currentValue *= (1 + this.annualAppreciation);
  }

  processSale() {
    const salePrice = this.currentValue;
    const loanPayoff = this.linkedLoan ? this.linkedLoan.terminateOnSale() : 0.0;
    const netProceeds = salePrice - loanPayoff;
    this.isSold = true;
    return netProceeds;
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      current_value: Math.round(this.currentValue * 100) / 100,
      equity: Math.round(this.getEquity() * 100) / 100,
      down_payment: this.downPayment,
      annual_appreciation: this.annualAppreciation,
    };
  }
}

class CarAssetSim {
    _id;
    _variant;
    name;
    startAge;
    endAge;
    annualDepreciation;
    downPayment;
    linkedLoan;
    currentValue;
    isSold;
  constructor(asset, linkedLoan = null) {
    this._id = asset.id;
    this._variant = asset.variant;
    this.name = asset.name;
    this.startAge = asset.start_age;
    this.endAge = asset.end_age;
    this.annualDepreciation = asset.annual_depreciation;
    this.downPayment = asset.down_payment;
    this.linkedLoan = linkedLoan;
    this.currentValue = parseFloat(asset.asset_value);
    this.isSold = false;
  }

  get id() { return this._id; }
  get variant() { return this._variant; }

  isActive(age) {
    return this.startAge <= age && !this.isSold;
  }

  getEquity() {
    const loanBalance = this.linkedLoan ? this.linkedLoan.remainingBalance : 0.0;
    return this.currentValue - loanBalance;
  }

  processYearEnd() {
    this.currentValue *= (1 - this.annualDepreciation);
  }

  processSale() {
    const salePrice = this.currentValue;
    const loanPayoff = this.linkedLoan ? this.linkedLoan.terminateOnSale() : 0.0;
    const netProceeds = salePrice - loanPayoff;
    this.isSold = true;
    return netProceeds;
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      variant: this.variant,
      current_value: Math.round(this.currentValue * 100) / 100,
      equity: Math.round(this.getEquity() * 100) / 100,
      down_payment: this.downPayment,
      annual_depreciation: this.annualDepreciation,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════

class SimulationState {
    checkingAccounts;
    retirementAccounts;
    salaryIncomes;
    hourlyIncomes;
    sideHustleIncomes;
    taxableInvestmentAccounts;
    houseLoans;
    carLoans;
    livingExpenses;
    rentExpenses;
    debtExpenses;
    houseAssets;
    carAssets;
    primaryChecking;

  constructor() {
    this.checkingAccounts = [];
    this.retirementAccounts = [];
    this.salaryIncomes = [];
    this.hourlyIncomes = [];
    this.sideHustleIncomes = [];
    this.taxableInvestmentAccounts = [];

    this.houseLoans = [];
    this.carLoans = [];
    this.livingExpenses = [];
    this.rentExpenses = [];
    this.debtExpenses = [];

    this.houseAssets = [];
    this.carAssets = [];

    this.primaryChecking = null;
  }

  getAllAccounts() {
    return [
      ...this.checkingAccounts,
      ...this.retirementAccounts,
      ...this.taxableInvestmentAccounts,
    ];
  }

  getAccountById(accountId) {
    return this.getAllAccounts().find((acc) => acc.id === accountId) ?? null;
  }
}

function simulate(req) {
  console.log('simulating..')
  const state = new SimulationState();
  const filingStatus = req.filing_status ?? "single";
  const stateCode = req.state ?? "MI";

  for (const acc of req.accounts.checking) {
    const checkingSim = new CheckingAccountSim(acc);
    state.checkingAccounts.push(checkingSim);
    if (state.primaryChecking === null) {
      state.primaryChecking = checkingSim;
    }
  }

  const retirementById = {};
  for (const acc of req.accounts.employer_retirement) {
    const retirementSim = new EmployerRetirementAccountSim(acc);
    state.retirementAccounts.push(retirementSim);
    retirementById[acc.id] = retirementSim;
  }

  for (const acc of req.accounts.taxable_investments) {
    const invSim = new TaxableInvestmentSim(acc, filingStatus, stateCode);
    state.taxableInvestmentAccounts.push(invSim);
  }

  const houseLoanById = {};
  for (const loan of req.expenses.house_loan ?? []) {
    const loanSim = new HouseLoanSim(loan);
    state.houseLoans.push(loanSim);
    houseLoanById[loan.id] = loanSim;
  }

  for (const asset of req.assets.house ?? []) {
    const linkedLoan =
      houseLoanById[asset.linked_loan_id] ??
      Object.values(houseLoanById).find(l => l.linkedAssetId === asset.id) ??
      null;
    const assetSim = new HouseAssetSim(asset, linkedLoan);
    state.houseAssets.push(assetSim);
  }

  for (const income of req.incomes.salary) {
    const linkedRetirement =
      income.linked_401k_id ? retirementById[income.linked_401k_id] ?? null : null;
    const salarySim = new SalaryIncomeSim(income, linkedRetirement, filingStatus, stateCode);
    state.salaryIncomes.push(salarySim);
  }

  for (const income of req.incomes.hourly) {
    const linkedRetirement =
      income.linked_401k_id ? retirementById[income.linked_401k_id] ?? null : null;
    const hourlySim = new HourlyIncomeSim(income, linkedRetirement, filingStatus, stateCode);
    state.hourlyIncomes.push(hourlySim);
  }

  for (const income of req.incomes.side) {
    const sideSim = new SideHustleIncomeSim(income, filingStatus, stateCode);
    state.sideHustleIncomes.push(sideSim);
  }

  const carLoanById = {};
  for (const loan of req.expenses.car_loan ?? []) {
    const loanSim = new CarLoanSim(loan);
    state.carLoans.push(loanSim);
    carLoanById[loan.id] = loanSim;
  }

  for (const expense of req.expenses.living ?? []) {
    state.livingExpenses.push(new LivingExpenseSim(expense));
  }

  for (const expense of req.expenses.rent ?? []) {
    state.rentExpenses.push(new RentSim(expense));
  }

  for (const expense of req.expenses.debt ?? []) {
    state.debtExpenses.push(new DebtSim(expense));
  }

  for (const asset of req.assets.car ?? []) {
    const linkedLoan =
      carLoanById[asset.linked_loan_id] ??
      Object.values(carLoanById).find(l => l.linkedAssetId === asset.id) ??
      null;
    state.carAssets.push(new CarAssetSim(asset, linkedLoan));
  }

  // ── SIMULATION LOOP ───────────────────────────────────────────────────────
  const results = [];
  const startingNetWorth =
  state.getAllAccounts().reduce((sum, acc) => sum + acc.getBalance(), 0) +
  state.houseAssets.reduce((sum, a) => sum + a.getEquity(), 0) +
  state.carAssets.reduce((sum, a) => sum + a.getEquity(), 0);

  for (
    let yearOffset = 0;
    yearOffset < req.sim_end_age - req.user_start_age;
    yearOffset++
  ) {
    const currentAge = req.user_start_age + yearOffset;
    const calendarYear = new Date().getFullYear() + yearOffset;

    const activeChecking = state.checkingAccounts.filter((a) => a.isActive(currentAge));
    const activeRetirement = state.retirementAccounts.filter((a) => a.isActive(currentAge));
    const activeTaxable = state.taxableInvestmentAccounts.filter((a) => a.isActive(currentAge));

    const activeSalaries = state.salaryIncomes.filter((i) => i.isActive(currentAge));
    const activeHourlies = state.hourlyIncomes.filter((i) => i.isActive(currentAge));
    const activeSide = state.sideHustleIncomes.filter((i) => i.isActive(currentAge));

    const activeHouseLoans = state.houseLoans.filter((l) => l.isActive(currentAge));
    const activeCarLoans = state.carLoans.filter((l) => l.isActive(currentAge));
    const activeLiving = state.livingExpenses.filter((e) => e.isActive(currentAge));
    const activeRent = state.rentExpenses.filter((e) => e.isActive(currentAge));
    const activeDebt = state.debtExpenses.filter((e) => e.isActive(currentAge));

    const activeHouseAssets = state.houseAssets.filter((a) => a.isActive(currentAge));
    const activeCarAssets = state.carAssets.filter((a) => a.isActive(currentAge));

    for (let month = 0; month < 12; month++) {
      // ── INCOME ────────────────────────────────────────────────────────
      for (const salarySim of activeSalaries) {
        const cashflow = salarySim.processMonthlyPayroll();
        state.primaryChecking.deposit(cashflow.net_income);
      }

      for (const hourlySim of activeHourlies) {
        const cashflow = hourlySim.processMonthlyPayroll();
        state.primaryChecking.deposit(cashflow.net_income);
      }

      for (const sideSim of activeSide) {
        const cashflow = sideSim.processMonthlyPayroll();
        state.primaryChecking.deposit(cashflow.net_income);
      }

      // ── ONE TIME PURCHASES (first month of asset's start year) ────────
      if (month === 0) {
        for (const assetSim of activeHouseAssets) {
          if (currentAge === assetSim.startAge) {
            state.primaryChecking.withdraw(assetSim.downPayment);
          }
        }
        for (const assetSim of activeCarAssets) {
          if (currentAge === assetSim.startAge) {
            state.primaryChecking.withdraw(assetSim.downPayment);
          }
        }
      }

      // ── TAXABLE INVESTMENT CONTRIBUTIONS ──────────────────────────────
      const monthlyGrossById = {};
      for (const s of activeSalaries) {
        monthlyGrossById[s.id] = s.currentGrossAnnual / 12;
      }
      for (const h of activeHourlies) {
        monthlyGrossById[h.id] = h.currentGrossAnnual / 12;
      }

      for (const invSim of activeTaxable) {
        const linkedGross = monthlyGrossById[invSim.linkedIncomeId] ?? 0.0;
        let contribution;
        if (invSim.contributionMode === "percentage" && linkedGross === 0.0) {
          contribution = invSim.monthlyContributionFixed;
        } else {
          contribution = invSim.calculateContribution(linkedGross);
        }
        state.primaryChecking.withdraw(contribution);
        invSim.deposit(contribution);
      }

      // ── LOAN PAYMENTS ─────────────────────────────────────────────────
      for (const loanSim of activeHouseLoans) {
        const payment = loanSim.processMonthlyPayment();
        state.primaryChecking.withdraw(payment.payment);
      }

      for (const loanSim of activeCarLoans) {
        const payment = loanSim.processMonthlyPayment();
        state.primaryChecking.withdraw(payment.payment);
      }

      // ── EXPENSES ───────────────────────────────────────────────
      for (const livingSim of activeLiving) {
        const payment = livingSim.processMonthlyPayment();
        state.primaryChecking.withdraw(payment.payment);
      }

      for (const rentSim of activeRent) {
        const payment = rentSim.processMonthlyPayment();
        state.primaryChecking.withdraw(payment.payment);
      }

      for (const debtSim of activeDebt) {
        const payment = debtSim.processMonthlyPayment();
        state.primaryChecking.withdraw(payment.payment);
      }

      // ── MONTHLY COMPOUNDING ───────────────────────────────────────────
      for (const account of [...activeChecking, ...activeRetirement, ...activeTaxable]) {
        if (account.variant === "taxable_investments") {
          const cashDividend = account.processMonthEnd();
          if (cashDividend) {
            state.primaryChecking.deposit(cashDividend);
          }
        } else {
          account.processMonthEnd();
        }
      }
    }

    // ── SNAPSHOTS ─────────────────────────────────────────────────────────
    const checkingAccountSnapshots = activeChecking.map((acc) => acc.snapshot());
    const retirementAccountSnapshots = activeRetirement.map((acc) => acc.snapshot());
    const taxableSnapshots = activeTaxable.map((acc) => acc.snapshot());

    const salarySnapshots = activeSalaries.map((sim) => sim.snapshot());
    const hourlySnapshots = activeHourlies.map((sim) => sim.snapshot());
    const sideSnapshots = activeSide.map((sim) => sim.snapshot());
    const allIncomeSnapshots = [...salarySnapshots, ...hourlySnapshots, ...sideSnapshots];

    const houseLoanSnapshots = activeHouseLoans.map((l) => l.snapshot());
    const carLoanSnapshots = activeCarLoans.map((l) => l.snapshot());
    const livingSnapshots = activeLiving.map((e) => e.snapshot());
    const rentSnapshots = activeRent.map((e) => e.snapshot());
    const debtSnapshots = activeDebt.map((e) => e.snapshot());

    const allLoanSnapshots = [...houseLoanSnapshots, ...carLoanSnapshots];

    const houseAssetSnapshots = activeHouseAssets.map((a) => a.snapshot());
    const carAssetSnapshots = activeCarAssets.map((a) => a.snapshot());

    // ── AGGREGATES ────────────────────────────────────────────────────────
    const totalCash = Math.round(
      [...checkingAccountSnapshots, ...retirementAccountSnapshots, ...taxableSnapshots].reduce(
        (sum, acc) => sum + acc.balance,
        0
      ) * 100
    ) / 100;
    const totalHomeEquity = Math.round(
      houseAssetSnapshots.reduce((sum, a) => sum + a.equity, 0) * 100
    ) / 100;
    const totalCarEquity = Math.round(
      carAssetSnapshots.reduce((sum, a) => sum + a.equity, 0) * 100
    ) / 100;
    const totalNetWorth = Math.round((totalCash + totalHomeEquity + totalCarEquity) * 100) / 100;

    const totalGrossIncome = allIncomeSnapshots.reduce((sum, s) => sum + s.gross_annual, 0);
    const totalNetIncome = allIncomeSnapshots.reduce((sum, s) => sum + s.net_annual, 0);
    const yearFederalTax = Math.round(
      allIncomeSnapshots.reduce((sum, s) => sum + s.taxes.federal, 0) * 100
    ) / 100;
    const yearFicaTax = Math.round(
      allIncomeSnapshots.reduce((sum, s) => sum + s.taxes.fica, 0) * 100
    ) / 100;
    const yearStateTax = Math.round(
      allIncomeSnapshots.reduce((sum, s) => sum + s.taxes.state, 0) * 100
    ) / 100;
    const totalYearTaxesPaid = Math.round((yearFederalTax + yearFicaTax + yearStateTax) * 100) / 100;
    const effectiveTaxRate =
      totalGrossIncome > 0
        ? Math.round((totalYearTaxesPaid / totalGrossIncome) * 100 * 100) / 100
        : 0;

    const nextGrossIncome =
      activeSalaries.reduce((sum, s) => sum + s.calculateGrowth(), 0) +
      activeHourlies.reduce((sum, h) => sum + h.calculateGrowth(), 0);

    let netWorthChange;
    let netWorthChangePct;
    if (results.length > 0) {
      const prevYearNetWorth = results[results.length - 1].net_worth;
      netWorthChange = totalNetWorth - prevYearNetWorth;
      netWorthChangePct =
        prevYearNetWorth !== 0
          ? Math.round((netWorthChange / prevYearNetWorth) * 100 * 100) / 100
          : 0;
    } else {
      netWorthChange = totalNetWorth - startingNetWorth;
      netWorthChangePct =
        startingNetWorth !== 0
          ? Math.round((netWorthChange / startingNetWorth) * 100 * 100) / 100
          : 0;
    }

    // ── SUMMARIES ─────────────────────────────────────────────────────────
    const accountsSummary = {
      total_balance: totalCash,
      total_interest_earned: Math.round(
        [...checkingAccountSnapshots, ...retirementAccountSnapshots].reduce(
          (sum, acc) => sum + acc.annual_interest_earned,
          0
        ) * 100
      ) / 100,
      by_variant: {
        checking: Math.round(
          checkingAccountSnapshots.reduce((sum, acc) => sum + acc.balance, 0) * 100
        ) / 100,
        employer_retirement: Math.round(
          retirementAccountSnapshots.reduce((sum, acc) => sum + acc.balance, 0) * 100
        ) / 100,
        taxable_investments: Math.round(
          taxableSnapshots.reduce((sum, acc) => sum + acc.balance, 0) * 100
        ) / 100,
      },
      accounts: [...checkingAccountSnapshots, ...retirementAccountSnapshots, ...taxableSnapshots],
    };

    const incomesSummary = {
      total_gross_income: totalGrossIncome,
      total_net_income: totalNetIncome,
      active_sources: activeSalaries.length + activeHourlies.length + activeSide.length,
      by_variant: {
        salary: Math.round(salarySnapshots.reduce((sum, s) => sum + s.gross_annual, 0) * 100) / 100,
        hourly: Math.round(hourlySnapshots.reduce((sum, s) => sum + s.gross_annual, 0) * 100) / 100,
        side: Math.round(sideSnapshots.reduce((sum, s) => sum + s.gross_annual, 0) * 100) / 100,
      },
      incomes: allIncomeSnapshots,
    };

    const expensesSummary = {
      total_monthly: Math.round(
        (allLoanSnapshots.reduce((sum, l) => sum + l.monthly_payment, 0) +
          livingSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0) +
          rentSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0) +
          debtSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0)) *
          100
      ) / 100,
      total_interest_paid_lifetime: Math.round(
        ([...allLoanSnapshots, ...debtSnapshots].reduce(
          (sum, e) => sum + e.interest_paid_lifetime,
          0
        )) * 100
      ) / 100,
      by_variant: {
        house_loan: Math.round(houseLoanSnapshots.reduce((sum, l) => sum + l.monthly_payment, 0) * 100) / 100,
        car_loan: Math.round(carLoanSnapshots.reduce((sum, l) => sum + l.monthly_payment, 0) * 100) / 100,
        living: Math.round(livingSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0) * 100) / 100,
        rent: Math.round(rentSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0) * 100) / 100,
        debt: Math.round(debtSnapshots.reduce((sum, e) => sum + e.monthly_payment, 0) * 100) / 100,
      },
      expenses: [...allLoanSnapshots, ...livingSnapshots, ...rentSnapshots, ...debtSnapshots],
    };

    const assetsSummary = {
      total_value: Math.round(
        [...houseAssetSnapshots, ...carAssetSnapshots].reduce((sum, a) => sum + a.current_value, 0) * 100
      ) / 100,
      total_equity: Math.round((totalHomeEquity + totalCarEquity) * 100) / 100,
      by_variant: {
        house: Math.round(houseAssetSnapshots.reduce((sum, a) => sum + a.current_value, 0) * 100) / 100,
        car: Math.round(carAssetSnapshots.reduce((sum, a) => sum + a.current_value, 0) * 100) / 100,
      },
      assets: [...houseAssetSnapshots, ...carAssetSnapshots],
    };

    const yearResult = {
      year: calendarYear,
      age: currentAge,
      net_worth: totalNetWorth,
      net_worth_change: Math.round(netWorthChange * 100) / 100,
      net_worth_change_percent: netWorthChangePct,
      total_cash: totalCash,
      income_earned: {
        gross: Math.round(totalGrossIncome * 100) / 100,
        net: Math.round(totalNetIncome * 100) / 100,
        taxes_paid: totalYearTaxesPaid,
        federal_tax: yearFederalTax,
        fica_tax: yearFicaTax,
        state_tax: yearStateTax,
        effective_tax_rate: effectiveTaxRate,
      },
      current_gross_income: nextGrossIncome,
      accounts_summary: accountsSummary,
      incomes_summary: incomesSummary,
      expenses: expensesSummary,
      assets: assetsSummary,
    };

    results.push(yearResult);

    // ── ADVANCE STATE (after result recorded) ─────────────────────────────
    for (const salarySim of activeSalaries) salarySim.processYearEnd();
    for (const hourlySim of activeHourlies) hourlySim.processYearEnd();

    for (const sideSim of activeSide) {
      const taxesOwed = sideSim.processYearEnd();
      if (taxesOwed && state.primaryChecking) {
        state.primaryChecking.withdraw(taxesOwed);
      }
    }

    for (const accSim of activeChecking) accSim.processYearEnd();
    for (const accSim of activeRetirement) accSim.processYearEnd();

    for (const invSim of activeTaxable) {
      const taxesOwed = invSim.processYearEnd();
      if (taxesOwed && state.primaryChecking) {
        state.primaryChecking.withdraw(taxesOwed);
      }
    }

    // ── ASSET SALES + YEAR END ────────────────────────────────────────────
    for (const assetSim of activeHouseAssets) {
      if (currentAge + 1 === assetSim.endAge) {
        const netProceeds = assetSim.processSale();
        if (netProceeds >= 0) {
          state.primaryChecking.deposit(netProceeds);
        } else {
          state.primaryChecking.withdraw(Math.abs(netProceeds));
        }
      }
      assetSim.processYearEnd();
    }

    for (const loanSim of activeHouseLoans) loanSim.processYearEnd();

    for (const assetSim of activeCarAssets) {
      if (currentAge + 1 === assetSim.endAge) {
        const netProceeds = assetSim.processSale();
        if (netProceeds >= 0) {
          state.primaryChecking.deposit(netProceeds);
        } else {
          state.primaryChecking.withdraw(Math.abs(netProceeds));
        }
      }
      assetSim.processYearEnd();
    }

    for (const loanSim of activeCarLoans) loanSim.processYearEnd();
    for (const livingSim of activeLiving) livingSim.processYearEnd();
    for (const rentSim of activeRent) rentSim.processYearEnd();
    for (const debtSim of activeDebt) debtSim.processYearEnd();
  }

  // ── BUILD FINAL METRICS ───────────────────────────────────────────────────
  const peakNetWorthIndex = results.reduce(
    (maxIdx, r, i) => (r.net_worth > results[maxIdx].net_worth ? i : maxIdx),
    0
  );
  const lowestCashIndex = results.reduce(
    (minIdx, r, i) => (r.total_cash < results[minIdx].total_cash ? i : minIdx),
    0
  );

  const metrics = {
    total_years: results.length,
    starting_net_worth: Math.round(startingNetWorth * 100) / 100,
    ending_net_worth: results.length > 0 ? results[results.length - 1].net_worth : 0,
    peak_net_worth: results.length > 0 ? Math.round(Math.max(...results.map((r) => r.net_worth)) * 100) / 100 : 0,
    peak_net_worth_age: results.length > 0 ? results[peakNetWorthIndex].age : 0,
    total_income_lifetime: Math.round(results.reduce((sum, r) => sum + r.income_earned.gross, 0) * 100) / 100,
    lowest_cash_balance_year: results.length > 0 ? results[lowestCashIndex].year : 0,
    lowest_cash_balance: results.length > 0 ? Math.round(Math.min(...results.map((r) => r.total_cash)) * 100) / 100 : 0,
  };

  console.log({
      total_years_simulated: req.sim_end_age - req.user_start_age,
      request: req,
      metrics,
      year_results: results,
      net_worth_trend: results.map((r) => r.net_worth),
      cash_trend: results.map((r) => r.total_cash),
      annual_income_trend: results.map((r) => r.current_gross_income),
    }
  )

  return {
    total_years_simulated: req.sim_end_age - req.user_start_age,
    request: req,
    metrics,
    year_results: results,
    net_worth_trend: results.map((r) => r.net_worth),
    cash_trend: results.map((r) => r.total_cash),
    annual_income_trend: results.map((r) => r.current_gross_income),
  };
}

export {
  // Calculators
  InterestCalculator,
  // Account sims
  CheckingAccountSim,
  EmployerRetirementAccountSim,
  TaxableInvestmentSim,
  // Income sims
  SalaryIncomeSim,
  HourlyIncomeSim,
  SideHustleIncomeSim,
  // Expense sims
  HouseLoanSim,
  CarLoanSim,
  LivingExpenseSim,
  RentSim,
  DebtSim,
  // Asset sims
  HouseAssetSim,
  CarAssetSim,
  // Coordinator
  SimulationState,
  simulate,
  // Constants
  ANNUAL_401K_EMPLOYEE_LIMIT,
  QUALIFIED_DIVIDEND_TAX_RATE,
  SIDE_HUSTLE_INCOME_GROWTH,
  PERIODS_PER_YEAR,
};