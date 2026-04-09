import type { Mistake } from "./types";

export const STORAGE_KEY = "koi-trades-v3";

export const ALL_MISTAKES: Mistake[] = [
  "Early Entry",
  "Chased Price",
  "Oversized",
  "Undersized Position",
  "Emotional",
  "Ignored Zone",
  "Countertrend Force",
  "Moved Stop",
  "Cut Early",
];

/** Backward-compatible alias used by runtime parsing/selectors. */
export const ALL_KNOWN_MISTAKE_TAGS: Mistake[] = [...ALL_MISTAKES];

export const KOI_FIELD_HELP = {
  entryZone: "Is this a demand (buy) or supply (sell) zone?",
  zoneLocation:
    "Where price is on the curve: wholesale (low), retail (high), or middle",
  trend: "Direction of price movement: uptrend, downtrend, or sideways",
  patternStage:
    "Current behavior at the zone (confirmation, falling knife, or fading rally)",
  imbalance: "Strength of the move away from the zone (strong, medium, weak)",
  timeAtZone: "How long price stayed at the zone before moving",
  entryPrice: "Your intended entry price for the opportunity",
  stopPrice: "Exit price where the opportunity is invalidated",
  target1: "First profit target used to reduce risk",
  target2: "Final target used to evaluate full trade potential",
} as const;

export const koiControlRightPad = 34;
/** Extra room for native select chevron + help icon */
export const koiSelectRightPad = 46;
