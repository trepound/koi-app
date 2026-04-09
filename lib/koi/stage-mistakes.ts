import type { Mistake, Trade } from "./types";

/** Setup stage — before / at entry (Trade Setup + Planned / Pending). */
export const SETUP_STAGE_MISTAKES = [
  "Early Entry",
  "Chased Price",
  "Ignored Zone",
  "Countertrend Force",
] as const satisfies readonly Mistake[];

/** Active stage — while trade is live. */
export const MANAGEMENT_STAGE_MISTAKES = [
  "Moved Stop",
  "Cut Early",
  "Oversized",
  "Undersized Position",
  "Emotional",
] as const satisfies readonly Mistake[];

const SETUP_SET = new Set<string>(SETUP_STAGE_MISTAKES);
const MGMT_SET = new Set<string>(MANAGEMENT_STAGE_MISTAKES);

export function isSetupStageMistake(m: Mistake): boolean {
  return SETUP_SET.has(m);
}

export function isManagementStageMistake(m: Mistake): boolean {
  return MGMT_SET.has(m);
}

function dedupeMistakes(list: Mistake[]): Mistake[] {
  return [...new Set(list)];
}

/** Split a flat list using KOI stage labels (legacy `mistakes` only). */
export function partitionMistakesByStage(mistakes: Mistake[]): {
  setup: Mistake[];
  management: Mistake[];
} {
  const setup: Mistake[] = [];
  const management: Mistake[] = [];
  for (const m of mistakes) {
    if (SETUP_SET.has(m)) setup.push(m);
    else if (MGMT_SET.has(m)) management.push(m);
  }
  return { setup, management };
}

/**
 * Resolve setup + management arrays. Uses explicit `setupMistakes` /
 * `managementMistakes` when either is provided; otherwise partitions
 * `mistakes` for backward compatibility.
 */
export function normalizeStageMistakes(trade: Trade): {
  setup: Mistake[];
  management: Mistake[];
} {
  const hasExplicit =
    trade.setupMistakes !== undefined || trade.managementMistakes !== undefined;

  if (hasExplicit) {
    return {
      setup: dedupeMistakes(trade.setupMistakes ?? []),
      management: dedupeMistakes(trade.managementMistakes ?? []),
    };
  }

  return partitionMistakesByStage(Array.isArray(trade.mistakes) ? trade.mistakes : []);
}

/** Aggregate stored in DB `trade_mistakes` and `trade.mistakes`. */
export function aggregateMistakesForPersistence(
  setup: Mistake[],
  management: Mistake[]
): Mistake[] {
  return dedupeMistakes([...setup, ...management]);
}
