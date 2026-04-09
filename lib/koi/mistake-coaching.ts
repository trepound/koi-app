import type { Mistake } from "./types";

/** KOI coaching copy per mistake — Primary / Reflection / Action. */
export type MistakeCoachingBlock = {
  primaryLine: string;
  koiReflection: string;
  action: string;
};

/**
 * Approved-style KOI coaching messages. Oversized covers explicit risk violation;
 * Emotional covers overtrading / impulse patterns called out in curriculum.
 */
export const MISTAKE_COACHING: Record<Mistake, MistakeCoachingBlock> = {
  "Moved Stop": {
    primaryLine: "Stop integrity broke — the plan was overridden in motion.",
    koiReflection:
      "KOI treats the stop as the contract with risk. Moving it to avoid pain usually converts a defined loss into undefined damage and erodes the edge you sized the trade for.",
    action:
      "Next trade: define invalidation before entry, write it down, and commit to one adjustment rule (or none) before you click — no reactive moves.",
  },
  Emotional: {
    primaryLine: "Emotional capital drove decisions more than the setup.",
    koiReflection:
      "This pattern overlaps with overtrading: urgency, revenge, or euphoria replace the checklist. KOI scores emotional control because consistency lives in process, not mood.",
    action:
      "Next trade: use a pre-flight pause (60 seconds) and a hard rule — no new entries for 15 minutes after a closed trade unless the ODE is fully green.",
  },
  "Countertrend Force": {
    primaryLine: "The trade fought the higher-timeframe story.",
    koiReflection:
      "Countertrend entries demand a narrower edge. Forcing them when location or timing is weak stacks structural risk KOI flags as a setup failure, not bad luck.",
    action:
      "Next trade: if bias is countertrend, require one extra confluence (freshness + location) before size — otherwise skip.",
  },
  Oversized: {
    primaryLine: "Size exceeded what the plan and account could absorb.",
    koiReflection:
      "This is a direct risk violation: even a good setup becomes toxic when loss exceeds the 1% (or your written) cap. KOI penalizes sizing heavily because survival beats brilliance.",
    action:
      "Next trade: calculate risk in dollars before entry; if above your max allowed risk, reduce size until it fits — no exceptions.",
  },
  "Chased Price": {
    primaryLine: "Entry chased the move instead of waiting for the zone.",
    koiReflection:
      "Chasing widens risk and weakens reward-to-risk. KOI scores this as discipline at the door: you paid a premium for immediacy.",
    action:
      "Next trade: set a max slip from your planned entry; if price blows through, stand down and wait for a new valid retest.",
  },
  "Ignored Zone": {
    primaryLine: "The valid zone was skipped or diluted.",
    koiReflection:
      "Ignoring the zone usually means narrative over structure. KOI weights location quality — trading away from the wholesale/retail logic you marked reduces statistical edge.",
    action:
      "Next trade: mark the zone first; no order without price interacting with that box on your chart.",
  },
  "Early Entry": {
    primaryLine: "Entry came before confirmation aligned with the plan.",
    koiReflection:
      "Early entries are often fear of missing out in disguise. KOI deducts setup quality when patience breaks before your rules say go.",
    action:
      "Next trade: list one non-negotiable trigger (e.g., pattern stage + imbalance) and only enter after it prints.",
  },
  "Cut Early": {
    primaryLine: "Profit or loss was taken before the plan’s exit logic.",
    koiReflection:
      "Cutting early can feel safe but it trains inconsistency: targets and stops exist so results are comparable trade to trade.",
    action:
      "Next trade: split targets if needed, but hold the remainder to plan unless a new invalidation appears — document that rule first.",
  },
  "Undersized Position": {
    primaryLine: "Size was too small to respect the setup’s edge.",
    koiReflection:
      "Undersizing often reflects fear after a loss. KOI still penalizes it because it avoids the real work: either the setup is valid at proper risk or it isn’t.",
    action:
      "Next trade: if the ODE allows the trade, size to your standard risk; if you can’t, pass and journal why.",
  },
};

export function getCoachingForMistake(mistake: Mistake): MistakeCoachingBlock {
  return MISTAKE_COACHING[mistake];
}
