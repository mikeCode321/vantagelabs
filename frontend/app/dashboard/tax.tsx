// ═══════════════════════════════════════════════════════════════════════════
// tax.js — port of tax.py
// ═══════════════════════════════════════════════════════════════════════════

const STANDARD_DEDUCTION = {
  single: 15750,
  married_filing_jointly: 31500,
  head_of_household: 23625,
};

const SOCIAL_SECURITY_WAGE_BASE = 176_100;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;

const SE_TAX_RATE = 0.153;
const SE_NET_EARNINGS_FACTOR = 0.9235;

const ADDITIONAL_MEDICARE_THRESHOLD = {
  single: 200_000,
  married_filing_jointly: 250_000,
  married_filing_separate: 125_000,
  head_of_household: 200_000,
};
const ADDITIONAL_MEDICARE_RATE = 0.009;

class TaxService {
  constructor(filingStatus, state) {
    this.filingStatus = filingStatus;
    this.state = state;
  }

  calculateFica(income) {
    const ssTaxable = Math.min(income, SOCIAL_SECURITY_WAGE_BASE);
    const ssTax = ssTaxable * SOCIAL_SECURITY_RATE;
    const medicareTax = income * MEDICARE_RATE;
    return ssTax + medicareTax;
  }

  calculateStateTax(income) {
    const stateRates = {
      CA: 0.093,
      NY: 0.06,
      MI: 0.0425,
      TX: 0.0,
      FL: 0.0,
      default: 0.05,
    };

    if (!this.state) return 0.0;

    const rate =
      stateRates[this.state.toUpperCase()] !== undefined
        ? stateRates[this.state.toUpperCase()]
        : stateRates["default"];

    return income * rate;
  }

  calculateFederalTax(income) {
    const bracketsSingle = [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250525, 0.32],
      [626350, 0.35],
      [Infinity, 0.37],
    ];

    const bracketsMfj = [
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [Infinity, 0.37],
    ];

    const bracketsHoh = [
      [17000, 0.10],
      [64850, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250500, 0.32],
      [626350, 0.35],
      [Infinity, 0.37],
    ];

    let brackets;
    if (this.filingStatus === "married_filing_jointly") {
      brackets = bracketsMfj;
    } else if (this.filingStatus === "head_of_household") {
      brackets = bracketsHoh;
    } else {
      brackets = bracketsSingle;
    }

    let tax = 0.0;
    let prevLimit = 0.0;

    for (const [limit, rate] of brackets) {
      const taxable = Math.min(income, limit) - prevLimit;
      if (taxable > 0) {
        tax += taxable * rate;
      }
      prevLimit = limit;
      if (income <= limit) break;
    }

    return tax;
  }

  calculateIncomeTaxes(grossIncome, preTaxDeductions) {
    let deduction = STANDARD_DEDUCTION[this.filingStatus] ?? 15750;
    deduction += preTaxDeductions;

    const taxableIncome = Math.max(0.0, grossIncome - deduction);

    const federal = this.calculateFederalTax(taxableIncome);
    const fica = this.calculateFica(grossIncome);
    const stateTax = this.calculateStateTax(grossIncome);

    const total = federal + fica + stateTax;

    return {
      federal: Math.round(federal * 100) / 100,
      fica: Math.round(fica * 100) / 100,
      state: Math.round(stateTax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  _calculateSelfEmploymentTax(netSeIncome) {
    const seTaxable = netSeIncome * SE_NET_EARNINGS_FACTOR;

    const ssTaxable = Math.min(seTaxable, SOCIAL_SECURITY_WAGE_BASE);
    const ssTax = ssTaxable * 0.124;

    const medicareTax = seTaxable * 0.029;

    const threshold = ADDITIONAL_MEDICARE_THRESHOLD[this.filingStatus] ?? 200_000;
    const additionalMedicare =
      Math.max(0.0, seTaxable - threshold) * ADDITIONAL_MEDICARE_RATE;

    return ssTax + medicareTax + additionalMedicare;
  }

  calculateSeIncomeTaxes(grossIncome) {
    if (grossIncome < 400) {
      const federal = this.calculateFederalTax(
        Math.max(0.0, grossIncome - (STANDARD_DEDUCTION[this.filingStatus] ?? 15750))
      );
      const state = this.calculateStateTax(grossIncome);
      return {
        federal: Math.round(federal * 100) / 100,
        se_tax: 0.0,
        state: Math.round(state * 100) / 100,
        total: Math.round((federal + state) * 100) / 100,
      };
    }

    const seTax = this._calculateSelfEmploymentTax(grossIncome);
    const seDeductible = seTax * 0.5;

    const deduction = STANDARD_DEDUCTION[this.filingStatus] ?? 15750;
    const taxableIncome = Math.max(0.0, grossIncome - deduction - seDeductible);
    const federal = this.calculateFederalTax(taxableIncome);
    const state = this.calculateStateTax(grossIncome);
    const total = federal + seTax + state;

    return {
      federal: Math.round(federal * 100) / 100,
      se_tax: Math.round(seTax * 100) / 100,
      state: Math.round(state * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}

export {
  TaxService,
  STANDARD_DEDUCTION,
  SOCIAL_SECURITY_WAGE_BASE,
  SOCIAL_SECURITY_RATE,
  MEDICARE_RATE,
  SE_TAX_RATE,
  SE_NET_EARNINGS_FACTOR,
  ADDITIONAL_MEDICARE_THRESHOLD,
  ADDITIONAL_MEDICARE_RATE,
};