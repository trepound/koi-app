import {
  getDevelopmentProgress,
  getReviewedClosedTrades,
} from "./development-progress";
import { MISTAKE_BUCKETS } from "./mistake-penalties";
import { SETUP_MISTAKE_PENALTY_POINTS } from "./setup-mistake-penalties";
import type { Mistake, Trade } from "./types";

export const DISCIPLINE_ENGINE_RECENT_REVIEWED = 5;

export type TradingState =
  | "Locked In"
  | "On Track"
  | "Off Track"
  | "Back to Basics";

export type DisciplineEngineOutput = {
  traderLevel: string;
  tradingState: TradingState;
  topDisciplineLeak: string | null;
  recommendedAction: string;
  /** Short reason for the assigned state (expanded view). */
  stateExplanation: string;
  /** e.g. repeated mistake across recent reviews, or null. */
  repeatedIssueSummary: string | null;
};

const RECOMMENDED_ACTION: Record<TradingState, string> = {
  "Locked In": "Stay disciplined and execute",
  "On Track": "Stay on track and keep building",
  "Off Track": "Refocus and tighten execution",
  "Back to Basics": "Go back to the basics",
};

function mistakeSeverity(m: Mistake): number {
  const ex = MISTAKE_BUCKETS[m]?.penalty ?? 0;
  const su = SETUP_MISTAKE_PENALTY_POINTS[m] ?? 0;
  return Math.max(ex, su);
}

/** Most recent reviewed closes first. */
export function getRecentReviewedClosedTrades(
  trades: Trade[],
  limit: number
): Trade[] {
  return getReviewedClosedTrades(trades)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

function countMistakesInRecent(
  recent: Trade[]
): Map<Mistake, number> {
  const map = new Map<Mistake, number>();
  for (const t of recent) {
    for (const m of t.mistakes) {
      map.set(m, (map.get(m) ?? 0) + 1);
    }
  }
  return map;
}

function pickTopDisciplineLeak(
  counts: Map<Mistake, number>
): Mistake | null {
  let best: Mistake | null = null;
  let bestCount = 0;
  let bestSev = 0;
  for (const [m, c] of counts) {
    const sev = mistakeSeverity(m);
    if (
      c > bestCount ||
      (c === bestCount && sev > bestSev)
    ) {
      best = m;
      bestCount = c;
      bestSev = sev;
    }
  }
  return bestCount > 0 ? best : null;
}

function deriveTradingState(recent: Trade[]): {
  tradingState: TradingState;
  stateExplanation: string;
  topLeak: Mistake | null;
  repeatedIssueSummary: string | null;
} {
  if (recent.length === 0) {
    return {
      tradingState: "On Track",
      stateExplanation:
        "No reviewed closes yet — state is neutral until you complete reviews.",
      topLeak: null,
      repeatedIssueSummary: null,
    };
  }

  const counts = countMistakesInRecent(recent);
  const topLeak = pickTopDisciplineLeak(counts);
  const topCount = topLeak ? counts.get(topLeak) ?? 0 : 0;

  const withMistakes = recent.filter((t) => t.mistakes.length > 0).length;
  const mistakeTradeRate = withMistakes / recent.length;

  const last3 = recent.slice(0, Math.min(3, recent.length));
  const last3AllClean =
    last3.length >= 3 && last3.every((t) => t.mistakes.length === 0);

  const repeatedIssueSummary =
    topLeak && topCount >= 2
      ? `${topLeak} on ${topCount} of your last ${recent.length} reviewed ${recent.length === 1 ? "trade" : "trades"}.`
      : topLeak && topCount === 1
        ? `${topLeak} flagged once in this window.`
        : null;

  if (last3AllClean) {
    return {
      tradingState: "Locked In",
      stateExplanation:
        "Your last three reviewed trades had no tagged mistakes.",
      topLeak: null,
      repeatedIssueSummary: null,
    };
  }

  if (recent.length < 3 && recent.every((t) => t.mistakes.length === 0)) {
    return {
      tradingState: "On Track",
      stateExplanation:
        "Recent reviews are clean; add more reviewed trades to confirm a sustained streak.",
      topLeak: null,
      repeatedIssueSummary: null,
    };
  }

  const last2 = recent.slice(0, 2);
  const last2Heavy =
    last2.length >= 2 &&
    last2.every((t) => t.mistakes.length >= 2);

  if (mistakeTradeRate >= 0.6 || last2Heavy || topCount >= 3) {
    return {
      tradingState: "Back to Basics",
      stateExplanation:
        "Recent reviews show heavy mistake load, stacked issues, or the same leak repeating often.",
      topLeak,
      repeatedIssueSummary,
    };
  }

  if (mistakeTradeRate >= 0.4 || topCount >= 2) {
    return {
      tradingState: "Off Track",
      stateExplanation:
        "Several recent reviews show gaps or a repeating discipline leak.",
      topLeak,
      repeatedIssueSummary,
    };
  }

  return {
    tradingState: "On Track",
    stateExplanation:
      "Mistakes show up but stay light in this window — keep process tight.",
    topLeak,
    repeatedIssueSummary,
  };
}

function deriveTraderLevel(trades: Trade[]): string {
  const dev = getDevelopmentProgress(trades);
  if (
    dev.professionalReadinessScore !== null &&
    Number.isFinite(dev.professionalReadinessScore)
  ) {
    return dev.traderLevelLabel;
  }
  return `Round ${dev.currentRound} · ${dev.currentRoundTheme}`;
}

/**
 * KOI Discipline Engine — drives Focus for Today.
 * Trading state uses the last {DISCIPLINE_ENGINE_RECENT_REVIEWED} reviewed closes only.
 */
export function evaluateDisciplineEngine(trades: Trade[]): DisciplineEngineOutput {
  const recent = getRecentReviewedClosedTrades(
    trades,
    DISCIPLINE_ENGINE_RECENT_REVIEWED
  );
  const traderLevel = deriveTraderLevel(trades);
  const {
    tradingState,
    stateExplanation,
    topLeak,
    repeatedIssueSummary,
  } = deriveTradingState(recent);

  const topDisciplineLeak = topLeak;
  const recommendedAction = RECOMMENDED_ACTION[tradingState];

  return {
    traderLevel,
    tradingState,
    topDisciplineLeak,
    recommendedAction,
    stateExplanation,
    repeatedIssueSummary,
  };
}
