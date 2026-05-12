/* -------------------- Number Formatting Utilities -------------------- */

/**
 * Format a number string with commas every 3 digits (display only)
 */
function formatNumberWithCommas(value: string): string {
  if (!value) return "";

  const isNegative = value.startsWith("-");
  const numStr = isNegative ? value.slice(1) : value;
  const [integerPart, decimalPart] = numStr.split(".");

  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = decimalPart ? `${withCommas}.${decimalPart}` : withCommas;

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Handle number input - keeps raw value in state, displays formatted
 */
function handleNumberInput(e, setState) {
  let value = e.target.value;

  value = value.replace(/,/g, "");

  value = value.replace(/[^\d.\-]/g, "");

  const parts = value.split(".");
  if (parts.length > 2) return;

  setState(value);
}

function handleTierThresholdInput(e, index, tiers, setTiers) {
  let value = e.target.value;
  value = value.replace(/,/g, "");
  value = value.replace(/[^\d.\-]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) return;

  const updated = [...tiers];
  updated[index].threshold = Number(value) || 0;
  setTiers(updated);
}
