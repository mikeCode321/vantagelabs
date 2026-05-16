from schemas.tax import TaxBreakdown


STANDARD_DEDUCTION = {
    "single": 15750,
    "married_filing_jointly": 31500,
    "head_of_household": 23625,
}


def calculate_fica(income: float) -> float:
    return income * 0.0765


def calculate_state_tax(income: float, state: str | None, year: int) -> float:
    state_rates = {
        "CA": 0.093,
        "NY": 0.06,
        "MI": 0.0425,
        "TX": 0.0,
        "FL": 0.0,
        "default": 0.05,
    }

    if not state:
        return 0.0

    rate = state_rates.get(state.upper(), state_rates["default"])
    return income * rate


def calculate_federal_tax(income: float, filing_status: str) -> float:

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

    if filing_status == "married_filing_jointly":
        brackets = brackets_mfj
    elif filing_status == "head_of_household":
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


def calculate_income_taxes(
    gross_income: float,
    year: int,
    filing_status: str,
    state: str | None,
) -> TaxBreakdown:

    deduction = STANDARD_DEDUCTION.get(filing_status, 14600)
    taxable_income = max(0.0, gross_income - deduction)

    federal = calculate_federal_tax(taxable_income, filing_status)
    fica = calculate_fica(gross_income)
    state_tax = calculate_state_tax(gross_income, state, year)

    total = federal + fica + state_tax

    return TaxBreakdown(
        federal=round(federal, 2),
        fica=round(fica, 2),
        state=round(state_tax, 2),
        total=round(total, 2),
        net=round(gross_income - total, 2),
    )
