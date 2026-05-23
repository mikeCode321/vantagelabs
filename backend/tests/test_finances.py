import json
from src.services.finance import CheckingAccount, CheckingAccountSim, SalaryIncome, SalaryIncomeSim, EmployerRetirementAccount, EmployerRetirementAccountSim

# checking_acc = {
#     "source_type": "liquid",
#     "variant": "checking",
#     "id": "129536df-3544-4d9c-b167-047ddbeaaaa1",
#     "name": "Checking Account",
#     "start_age": 25,
#     "end_age": 27,
#     "starting_balance": 10000,
#     "interest_tiers": [
#         {
#         "threshold": 15000,
#         "annual_rate": 0.00
#         },
#         {
#         "threshold": 100000,
#         "annual_rate": 0.03
#         },
#         {
#         "threshold": 300000,
#         "annual_rate": 0.04
#         }
#     ]
# }

# checkingAccSim = CheckingAccountSim(CheckingAccount(**checking_acc))
# for month in range(12):
#     checkingAccSim.deposit(1000)
#     checkingAccSim.withdraw(500)
#     checkingAccSim.end_of_month()

# print(json.dumps( checkingAccSim.snapshot(), indent=2))

# ////// Salary Sim Test

# salary = {
#         "source_type": "income",
#         "variant": "salary",
#         "id": "79940d9f-398e-4274-8c1d-d068d2b0c46b",
#         "name": "SWE",
#         "start_age": 25,
#         "end_age": 27,
#         "gross_income": 100000,
#         "income_growth": 0.03,
#         "linked_401k_id": "6d37503e-6cb9-4acc-a912-edb0a7e7753e"
# }

# salary_sim = SalaryIncomeSim(SalaryIncome(**salary), filing_status="single", state="MI")

# for year in range(2):
#     salary_sim.calculate_net_income()
#     monthly_net_income = salary_sim.monthly_net_income()
#     for month in range(12):
#         if month == 11:
#             print(monthly_net_income)

#     salary_sim.project_next_year()

#     print( json.dumps( salary_sim.snapshot(is_active=True), indent=2 ) )
#     salary_sim.advance_year()



# retire_input = {
#     "source_type": "liquid",
#     "variant": "employer_retirement",
#     "id": "6d37503e-6cb9-4acc-a912-edb0a7e7753e",
#     "name": "salary 401",
#     "start_age": 25,
#     "end_age": 27,
#     "starting_balance": 0,
#     "contribution_mode": "percentage",
#     "monthly_contribution": 833.3333333333335,
#     "contribution_percentage": 0.10,
#     "expected_return": 0.1,
#     "employer_match": 0.05,
#     "linked_income_id": "79940d9f-398e-4274-8c1d-d068d2b0c46b"
# }

# retire_obj = EmployerRetirementAccountSim(EmployerRetirementAccount(**retire_input))
# job_obj = {
#     "gross_income": 103000,
# }
# for month in range(12):
#     retire_obj.end_of_month()

# print(json.dumps(retire_obj.snapshot(), indent=2 ) )
# retire_obj.flush()
# retire_obj.advance_year(job_obj["gross_income"])

# for month in range(12):
#     retire_obj.end_of_month()

# print(json.dumps(retire_obj.snapshot(), indent=2 ) )
