/**
 * Price parsing, position sizing, R-multiple, weighted R:R.
 * Phase 3+: portfolio-level risk can compose these helpers.
 */

export function parsePositivePriceField(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** String for auto-calculated position size from risk sizing inputs (floored). */
export function formatAutoPositionSize(units: number): string {
  if (!Number.isFinite(units) || units <= 0) return "";
  const floored = Math.floor(units * 1e6) / 1e6;
  if (floored <= 0) return "";
  return String(floored);
}

/**
 * Risk-based position size: (Account × Risk%) ÷ |Entry − Stop|, floored.
 * Returns "" when inputs are invalid (same behavior as previous useEffect).
 */
export function calculateAutoPositionSize(
  accountSizeStr: string,
  riskPercentStr: string,
  entryStr: string,
  stopStr: string
): string {
  const acc = Number(accountSizeStr.trim());
  const rp = Number(riskPercentStr.trim());
  const e = Number(entryStr.trim());
  const s = Number(stopStr.trim());
  if (
    !Number.isFinite(acc) ||
    acc <= 0 ||
    !Number.isFinite(rp) ||
    rp < 0 ||
    !Number.isFinite(e) ||
    !Number.isFinite(s)
  ) {
    return "";
  }
  const riskDist = Math.abs(e - s);
  if (!riskDist) return "";
  const riskAmt = acc * (rp / 100);
  const units = riskAmt / riskDist;
  if (!Number.isFinite(units) || units <= 0) return "";
  return formatAutoPositionSize(units);
}

/** Execution / trade planning: weighted reward from both targets. */
export function calculateWeightedRewardRiskFromPrices(
  entryNum: number,
  stopNum: number,
  target1: number,
  target2: number,
  target1AllocationPct: number,
  target2AllocationPct: number
) {
  const risk = Math.abs(entryNum - stopNum);
  if (!risk) return 0;
  const r1 = Math.abs(target1 - entryNum);
  const r2 = Math.abs(target2 - entryNum);
  const weightedReward =
    (target1AllocationPct / 100) * r1 + (target2AllocationPct / 100) * r2;
  return weightedReward / risk;
}

export function calculateRMultiple(
  entryNum: number,
  stopNum: number,
  exitPriceNum: number,
  selectedSide: "Long" | "Short"
) {
  const riskPerUnit = Math.abs(entryNum - stopNum);
  if (!riskPerUnit) return 0;

  const resultPerUnit =
    selectedSide === "Long"
      ? exitPriceNum - entryNum
      : entryNum - exitPriceNum;

  return resultPerUnit / riskPerUnit;
}
