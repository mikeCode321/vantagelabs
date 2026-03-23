
import { CASH_ON_HAND_DEFAULTS } from "@/app/dashboard/constants";
import { SIM_MAX } from "@/app/dashboard/constants";
import type { SimEvent, YearSnapshot } from "./useSimulation";

export function diffInputs<T extends object>(original: T, edited: T): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(edited) as (keyof T)[]) {
    if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
      (changes as Record<keyof T, unknown>)[key] = edited[key];
    }
  }
  return changes;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

// function resolveParamsAtYear(events: SimEvent[], beforeYear: number) {
//   const base = { ...CASH_ON_HAND_DEFAULTS };
//   for (const ev of events.filter((e) => e.year < beforeYear)) {
//     if (ev.net_income !== undefined) base.net_income = ev.net_income;
//     if (ev.income_growth !== undefined) base.income_growth = ev.income_growth;
//     if (ev.expenses !== undefined) base.expenses = ev.expenses;
//     if (ev.expense_growth !== undefined) base.expense_growth = ev.expense_growth;
//     if (ev.tiers !== undefined) base.tiers = ev.tiers;
//   }
//   return base;
// }

// This is called twice per render — once for resolvedBase in currentInputs, 
// and once inside buildPayload when play is hit. 
// Not a performance concern now, but worth noting if the events array grows large
export function getSimParamsAsOf(events: SimEvent[], beforeYear: number) {
  const base = { ...CASH_ON_HAND_DEFAULTS };
  for (const ev of events.filter((e) => e.year < beforeYear)) {
    for (const key of Object.keys(ev) as (keyof SimEvent)[]) {
      if (key !== "year" && ev[key] !== undefined) {
        (base as Record<string, unknown>)[key] = ev[key];
      }
    }
  }
  return base;
}

export function buildPayload(events: SimEvent[], results: YearSnapshot[], fromYear: number) {
  const prevResult = [...results].reverse().find((r) => r.year === fromYear - 1);
  return {
    ...getSimParamsAsOf(events, fromYear),
    start_cash: prevResult?.cash_on_hand ?? CASH_ON_HAND_DEFAULTS.start_cash,
    start_year: fromYear,
    end_year: SIM_MAX,
    events: events.filter((e) => e.year >= fromYear),
  };
}



