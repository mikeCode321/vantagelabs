from schemas.tax import TaxBreakdown


STANDARD_DEDUCTION = {
    "single": 15750,
    "married_filing_jointly": 31500,
    "head_of_household": 23625,
}

SOCIAL_SECURITY_WAGE_BASE = 176_100
SOCIAL_SECURITY_RATE = 0.062
MEDICARE_RATE = 0.0145

SE_TAX_RATE = 0.153
SE_NET_EARNINGS_FACTOR = 0.9235 

ADDITIONAL_MEDICARE_THRESHOLD = {
    "single": 200_000,
    "married_filing_jointly": 250_000,
    "married_filing_separate": 125_000,
    "head_of_household": 200_000,
}
ADDITIONAL_MEDICARE_RATE = 0.009


class TaxService:

    def __init__(self, filing_status, state):
        self.filing_status = filing_status
        self.state = state

    def calculate_fica(self, income) -> float:
        ss_taxable = min(income, SOCIAL_SECURITY_WAGE_BASE)
        ss_tax = ss_taxable * SOCIAL_SECURITY_RATE
        medicare_tax = income * MEDICARE_RATE
        return ss_tax + medicare_tax

    def calculate_state_tax(self, income) -> float:
        state_rates = {
            "CA": 0.093,
            "NY": 0.06,
            "MI": 0.0425,
            "TX": 0.0,
            "FL": 0.0,
            "default": 0.05,
        }

        if not self.state:
            return 0.0

        rate = state_rates.get(self.state.upper(), state_rates["default"])
        return income * rate


    def calculate_federal_tax(self, income) -> float:

        brackets_single = [
            (11925, 0.10),
            (48475, 0.12),
            (103350, 0.22),
            (197300, 0.24),
            (250525, 0.32),
            (626350, 0.35),
            (float("inf"), 0.37),
        ]

        brackets_mfj = [
            (23850, 0.10),
            (96950, 0.12),
            (206700, 0.22),
            (394600, 0.24),
            (501050, 0.32),
            (751600, 0.35),
            (float("inf"), 0.37),
        ]

        brackets_hoh = [
            (17000, 0.10),
            (64850, 0.12),
            (103350, 0.22),
            (197300, 0.24),
            (250500, 0.32),
            (626350, 0.35),
            (float("inf"), 0.37),
        ]

        if self.filing_status == "married_filing_jointly":
            brackets = brackets_mfj
        elif self.filing_status == "head_of_household":
            brackets = brackets_hoh
        else:
            brackets = brackets_single

        tax = 0.0
        prev_limit = 0.0

        for limit, rate in brackets:
            taxable = min(income, limit) - prev_limit
            if taxable > 0:
                tax += taxable * rate

            prev_limit = limit

            if income <= limit:
                break

        return tax


    def calculate_income_taxes(self, gross_income, pre_tax_deductions) -> TaxBreakdown:
        deduction = STANDARD_DEDUCTION.get(self.filing_status, 15750)
        deduction += pre_tax_deductions
        
        taxable_income = max(0.0, gross_income - deduction)

        federal = self.calculate_federal_tax(taxable_income)
        fica = self.calculate_fica(gross_income)
        state_tax = self.calculate_state_tax(gross_income)

        total = federal + fica + state_tax

        return TaxBreakdown(
            federal=round(federal, 2),
            fica=round(fica, 2),
            state=round(state_tax, 2),
            total=round(total, 2),
        )

    def _calculate_self_employment_tax(self, net_se_income: float) -> float:
        """
        SE tax on 92.35% of net SE income.
        SS portion (12.4%) capped at SOCIAL_SECURITY_WAGE_BASE.
        Medicare (2.9%) on all earnings + 0.9% surtax above threshold.
        """
        se_taxable = net_se_income * SE_NET_EARNINGS_FACTOR

        ss_taxable = min(se_taxable, SOCIAL_SECURITY_WAGE_BASE)
        ss_tax = ss_taxable * 0.124

        medicare_tax = se_taxable * 0.029

        threshold = ADDITIONAL_MEDICARE_THRESHOLD.get(self.filing_status, 200_000)
        additional_medicare = max(0.0, se_taxable - threshold) * ADDITIONAL_MEDICARE_RATE

        return ss_tax + medicare_tax + additional_medicare

    def calculate_se_income_taxes(self, gross_income: float):
        """
        Tax calculation for self-employment income.
        SE tax replaces FICA. Deductible half of SE tax reduces federal taxable income.
        No pre_tax_deductions — no 401k on side hustle income.
        """
        if gross_income < 400:
            federal = self.calculate_federal_tax(max(0.0, gross_income - STANDARD_DEDUCTION.get(self.filing_status, 15750)))
            state = self.calculate_state_tax(gross_income)
            return {
                "federal": round(federal, 2), 
                "se_tax": 0.0, 
                "state": round(state, 2), 
                "total": round(federal + state, 2)
            }

        se_tax = self._calculate_self_employment_tax(gross_income)
        se_deductible = se_tax * 0.5

        deduction = STANDARD_DEDUCTION.get(self.filing_status, 15750)
        taxable_income = max(0.0, gross_income - deduction - se_deductible)
        federal = self.calculate_federal_tax(taxable_income)
        state = self.calculate_state_tax(gross_income)
        total = federal + se_tax + state

        return {
            "federal": round(federal, 2),
            "se_tax": round(se_tax, 2),
            "state": round(state, 2),
            "total": round(total, 2),
        }