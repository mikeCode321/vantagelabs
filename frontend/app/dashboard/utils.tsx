import { CASH_ON_HAND_DEFAULTS, SIM_MAX } from "@/app/dashboard/constants";
import type { YearData, CashFlowInputs } from "./useSimulation";

// export function diffInputs<T extends object>(original: T, edited: T): Partial<T> {
//   const changes: Partial<T> = {};
//   for (const key of Object.keys(edited) as (keyof T)[]) {
//     if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
//       (changes as Record<keyof T, unknown>)[key] = edited[key];
//     }
//   }
//   return changes;
// }

// Update the edited year and propagate changed fields forward.
// Each field propagates independently — it stops at any year that
// already owns that specific field via its own user edit.
export function propagateInputs(timeline: YearData[], editedYear: number, newInputs: CashFlowInputs): YearData[] {
  // 1. Find the edited year entry
  const editedEntry = timeline.find((y) => y.year === editedYear);
  if (!editedEntry) throw new Error(`Year ${editedYear} not found in timeline`);

  // 2. Figure out which fields the user actually changed
  const changedKeys = (Object.keys(newInputs) as (keyof CashFlowInputs)[]).filter(
    (key) => JSON.stringify(newInputs[key]) !== JSON.stringify(editedEntry.inputs[key])
  );

  // 3. Track which fields are still propagating as we walk forward.
  //    A field stops propagating when we hit a year that owns it.
  const propagatingFields = new Set(changedKeys);

  const updatedTimeline: YearData[] = [];

  for (const yearEntry of timeline) {

    // CASE A: Before the edited year — unchanged
    if (yearEntry.year < editedYear) {
      updatedTimeline.push(yearEntry);
      continue;
    }

    // CASE B: The edited year itself
    if (yearEntry.year === editedYear) {
      // merge new edited fields into existing userEditedFields
      const updatedEditedFields = new Set(yearEntry.userEditedFields);
      for (const key of changedKeys) updatedEditedFields.add(key);

      updatedTimeline.push({
        ...yearEntry,
        inputs: newInputs,
        userEditedFields: updatedEditedFields,
        result: undefined, 
      });
      continue;
    }

    // CASE C: After the edited year — propagate fields that are still active
    if (propagatingFields.size === 0) {
      // nothing left to propagate, keep rest unchanged
      updatedTimeline.push(yearEntry);
      continue;
    }

    // Apply propagating fields, skipping any this year owns
    const updatedInputs = { ...yearEntry.inputs };
    let didChange = false;

    for (const key of propagatingFields) {
      if (yearEntry.userEditedFields.has(key)) {
        // this year owns this field — stop propagating it
        propagatingFields.delete(key);
        continue;
      }
      (updatedInputs as Record<keyof CashFlowInputs, unknown>)[key] = newInputs[key];
      didChange = true;
    }

    if (!didChange) {
      updatedTimeline.push(yearEntry);
      continue;
    }

    updatedTimeline.push({
      ...yearEntry,
      inputs: updatedInputs,
      result: undefined,
    });
  }

  return updatedTimeline;
}

export function buildPayload(timeline: YearData[], fromYear: number) {
  // start cash is the end of year prior to rerun point
  const prevYear = timeline.find((y) => y.year === fromYear - 1);
  const start_cash = prevYear?.result?.cash_on_hand ?? CASH_ON_HAND_DEFAULTS.start_cash;

  // base params are the resolved inputs of the year just before fromYear
  const base = prevYear?.inputs ?? { ...CASH_ON_HAND_DEFAULTS };

  // events are all user-edited years from fromYear onwards
  const events = timeline
    .filter((y) => y.userEditedFields.size > 0 && y.year >= fromYear)
    .map((y) => ({ year: y.year, ...y.inputs }));

  return {
    net_income: base.net_income,
    income_growth: base.income_growth,
    expenses: base.expenses,
    expense_growth: base.expense_growth,
    tiers: base.tiers,
    start_cash,
    start_year: fromYear,
    end_year: SIM_MAX,
    events,
  };
}