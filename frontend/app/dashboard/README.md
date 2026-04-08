When the user clicks play:

setIsPlaying(true) fires
The useEffect re-runs because isPlaying changed
It finds the current year's entry in the ledger
If result === null and nothing is fetching — it calls fetchSnapshots for 1 year, which hits the API and calls setLedger with the result when it comes back
That setLedger triggers another useEffect run — now result !== null and isPlaying is true, so it sets a 300ms timeout
After 300ms — seeds the next year's entry in the ledger, increments currentYear
currentYear change triggers useEffect again — new year has result === null, so it fetches again
Repeat until currentYear >= SIM_MAX, at which point setIsPlaying(false) fires



When the user drags the slider to year 10:

onSeek(10) → seekTo(10) fires
setIsPlaying(false), setCurrentYear(10)
Checks if year 10 is already cached — if yes, done, nothing else happens
If not — finds maxCached (say year 3), calculates yearsNeeded = 10 - 3 = 7
Calls fetchSnapshots with year 3's compounded outputs as inputs, starting at year 4, for 7 years
API returns a list of 7 snapshots [year4, year5, ..., year10]
setLedger merges all 7 into the ledger at once
currentYear is already 10, and now the ledger has a result for year 10, so useEffect re-runs and sees result !== null but isPlaying is false — nothing more happens, just displays the result


When the sim has already run and the user is sliding through previous years:

onSeek(5) → seekTo(5) fires
setCurrentYear(5)
ledger.find((e) => e.year === 5 && e.result !== null) — found, so return immediately, no fetch
currentEntry updates to the year 5 entry
displayResult is just currentEntry.result — already non-null
useEffect runs — entry.result !== null but isPlaying is false — nothing happens
CashOnHandCalc re-renders with the year 5 data instantly from the ledger, no API call made




#####################
App load → timeline[0..29] all defaults, userEdited: false, rerunFromYear = 1

User edits year 3 → timeline[2].overrides = {...}, userEdited: true
                    rerunFromYear = min(1, 3) = 1

User edits year 7 → timeline[6].overrides = {...}, userEdited: true
                    rerunFromYear = min(1, 7) = 1

Play (first run) → runs years 1-30
  start_cash = 0
  events = all userEdited entries (years 3 and 7)
  results merged into timeline years 1-30
  rerunFromYear = null

User edits year 10 → rerunFromYear = min(null→10, 10) = 10
User edits year 15 → rerunFromYear = min(10, 15) = 10

Play (second run) → keeps years 1-9, runs 10-30
  start_cash = timeline[8].cash_on_hand
  events = userEdited entries where year >= 10
  rerunFromYear = null


year 5 edit:  net_income=90000, income_growth=0.05
year 10 edit: net_income=120000

year 6-9:   net_income=90000, income_growth=0.05  (from year 5)
year 10:    net_income=120000, income_growth=0.05  (net_income overridden, growth inherited)
year 11-30: net_income=120000, income_growth=0.05  (year 10's net_income, year 5's growth)

year 13 edit: expenses=70000

year 14-30: net_income=120000, income_growth=0.05, expenses=70000

year 5:  net_income=90000 → userEditedFields={net_income}
year 10: net_income=120000 → userEditedFields={net_income}

year 5 edited again: income_growth=0.05
  propagatingFields = {income_growth}
  years 6-9: income_growth propagates ✅
  year 10: has net_income in userEditedFields but NOT income_growth
           → income_growth continues propagating ✅
  years 11-30: income_growth=0.05 ✅