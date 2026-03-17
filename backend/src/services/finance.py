from typing import List
from schemas.finance import IncomeConfig, ExpensesConfig, InterestRateTier


def apply_tiered_interest(balance: float, tiers: List[InterestRateTier], periods_per_year: int) -> float:
    remaining = balance
    total = 0
    prev_threshold = 0
    last_rate = 0

    for tier in tiers:
        tier_size = tier.threshold - prev_threshold
        applied = min(remaining, tier_size)
        monthly_rate = tier.annual_rate / periods_per_year
        total += applied * (1 + monthly_rate)
        remaining -= applied
        prev_threshold = tier.threshold
        last_rate = tier.annual_rate

        if remaining <= 0:
            return total

    if remaining > 0:
        monthly_rate = last_rate / periods_per_year
        total += remaining * (1 + monthly_rate)

    return total


def calc_cash_on_hand(
    years: int,
    cash_on_hand: float,
    net_income_dict: IncomeConfig,
    expenses_dict: ExpensesConfig,
    tiers: List[InterestRateTier],
) -> List[dict]:
    periods_per_year = 12
    net_income = net_income_dict.net_income
    expenses = expenses_dict.expenses
    monthly_income = net_income / 12
    monthly_expenses = expenses / 12

    snapshots = []

    for year in range(1, years + 1):
        for month in range(periods_per_year):
            cash_on_hand += monthly_income
            cash_on_hand -= monthly_expenses
            cash_on_hand = apply_tiered_interest(cash_on_hand, tiers, periods_per_year)

            if (month + 1) % 12 == 0:  # annual compounding at end of each year
                net_income *= (1 + net_income_dict.interest_rate)
                expenses *= (1 + expenses_dict.interest_rate)
                monthly_income = net_income / 12
                monthly_expenses = expenses / 12

        snapshots.append({
            "cash_on_hand": round(cash_on_hand, 2),
            "net_income": round(net_income, 2),
            "expenses": round(expenses, 2),
        })

    return snapshots