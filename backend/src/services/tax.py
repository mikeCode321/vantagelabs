from schemas.tax import TaxBreakdown


STANDARD_DEDUCTION = {
    "single": 15750,
    "married_filing_jointly": 31500,
    "head_of_household": 23625,
}


class TaxService:

    def __init__(self, filing_status, state):
        self.filing_status = filing_status
        self.state = state

    def calculate_fica(self, income) -> float:
        return income * 0.0765

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
