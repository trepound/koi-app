import type { Trade } from "./types";

export const TRADES_PER_ROUND = 30;
export const ROUND_COUNT = 3;
export const PROGRAM_REVIEWED_CAP = TRADES_PER_ROUND * ROUND_COUNT;

/** Round themes — exact KOI wording. */
export const ROUND_THEMES: Record<1 | 2 | 3, string> = {
  1: "Protection",
  2: "Consistency",
  3: "Readiness",
};

export function isReviewedClosedTrade(trade: Trade): boolean {
  return trade.status === "CLOSED" && trade.reviewCompleted === true;
}

export function getReviewedClosedTrades(trades: Trade[]): Trade[] {
  return trades.filter(isReviewedClosedTrade);
}

export type RoundBreakdownRow = {
  roundNumber: 1 | 2 | 3;
  theme: string;
  reviewedInRound: number;
  /** Trades 1–30, 31–60, 61–90 in the program sequence. */
  rangeLabel: string;
};

export type ReadinessBreakdown = {
  /** Average total score (0–100) over reviewed closed trades with a numeric totalScore. */
  averageTotalScore: number | null;
  tradeCountWithScore: number;
  totalReviewedClosed: number;
};

export type DevelopmentProgressModel = {
  totalReviewed: number;
  /** Display round 1–3; stays 3 after 90+ reviewed. */
  currentRound: 1 | 2 | 3;
  currentRoundTheme: string;
  /** Full Rounds finished (each 30 reviewed trades). */
  completedRounds: 0 | 1 | 2 | 3;
  /** Count toward the current Round’s 30 (1–30, resets each Round). */
  tradesInCurrentRound: number;
  /** 0–100 within the active Round. */
  currentRoundProgressPercent: number;
  /** All 90 program reviews done. */
  isProgramComplete: boolean;
  roundBreakdown: RoundBreakdownRow[];
  readiness: ReadinessBreakdown;
  /** Average total score (0–100) on reviewed closes with scores — drives trader level. */
  professionalReadinessScore: number | null;
  /** Foundation | Developing | Consistent | Pro Level */
  traderLevelLabel: string;
  maxAllowedRiskHeadline: string;
  maxAllowedRiskDetail: string;
  nextMilestoneMessage: string;
};

/** Maps level score (avg total 0–100) to unified KOI trader level labels. */
export function getTraderLevelLabel(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "Foundation";
  if (score >= 90) return "Pro Level";
  if (score >= 80) return "Consistent";
  if (score >= 70) return "Developing";
  return "Foundation";
}

/**
 * Max risk from level score (avg total on reviewed closes).
 * Below Pro Level (90+) → 1% cap guidance.
 */
export function getMaxAllowedRiskGuidance(levelScore: number | null): {
  headline: string;
  detail: string;
} {
  if (levelScore === null || !Number.isFinite(levelScore) || levelScore < 90) {
    return {
      headline: "Max allowed risk: 1%",
      detail:
        "Until you reach Pro Level (90+ score), keep risk at 1% of account per trade or less.",
    };
  }
  return {
    headline: "Max allowed risk: 1% baseline",
    detail:
      "At Pro Level you may size up only when your written rules allow — default stays 1% unless you choose otherwise.",
  };
}

function countReviewedInRound(totalReviewed: number, roundNumber: 1 | 2 | 3): number {
  const n = Math.min(totalReviewed, PROGRAM_REVIEWED_CAP);
  const start = (roundNumber - 1) * TRADES_PER_ROUND;
  const end = roundNumber * TRADES_PER_ROUND;
  return Math.max(0, Math.min(n, end) - start);
}

function buildNextMilestoneMessage(
  totalReviewed: number,
  currentRound: 1 | 2 | 3,
  tradesInCurrentRound: number,
  readiness: number | null
): string {
  if (totalReviewed === 0) {
    return "Close a trade, complete review, and check “Review completed” — your first reviewed trade starts Round 1 (Protection).";
  }
  if (totalReviewed < PROGRAM_REVIEWED_CAP) {
    const remainingThisRound = TRADES_PER_ROUND - tradesInCurrentRound;
    const theme = ROUND_THEMES[currentRound];
    if (remainingThisRound > 0) {
      return `Round ${currentRound} (${theme}): add ${remainingThisRound} more reviewed ${remainingThisRound === 1 ? "trade" : "trades"} to finish this Round.`;
    }
    const nextRound = Math.min(3, currentRound + 1) as 1 | 2 | 3;
    return `Round ${currentRound} complete. Next: Round ${nextRound} (${ROUND_THEMES[nextRound]}) — your next reviewed trade opens it.`;
  }
  if (readiness !== null && readiness < 90) {
    return "All three Rounds are complete. Next: push level score to 90+ for Pro Level while keeping risk tight.";
  }
  if (readiness !== null && readiness >= 90) {
    return "All Rounds complete — you’re at Pro Level. Keep the process; size up only when your rules say so.";
  }
  return "All three Rounds are complete. Add reviewed trades with scores to set trader level.";
}

/**
 * Derives round position, trader level, risk copy, and milestone copy from live trades.
 */
export function getDevelopmentProgress(trades: Trade[]): DevelopmentProgressModel {
  const reviewed = getReviewedClosedTrades(trades);
  const totalReviewed = reviewed.length;

  const withTotal = reviewed.filter(
    (t) => t.totalScore != null && Number.isFinite(t.totalScore)
  );
  const professionalReadinessScore =
    withTotal.length > 0
      ? withTotal.reduce((s, t) => s + (t.totalScore as number), 0) /
        withTotal.length
      : null;

  const traderLevelLabel = getTraderLevelLabel(professionalReadinessScore);
  const { headline: maxAllowedRiskHeadline, detail: maxAllowedRiskDetail } =
    getMaxAllowedRiskGuidance(professionalReadinessScore);

  const isProgramComplete = totalReviewed >= PROGRAM_REVIEWED_CAP;

  /** Position in the 90-trade program (extra reviewed trades do not advance Round UI). */
  const nProgram = Math.min(totalReviewed, PROGRAM_REVIEWED_CAP);

  const currentRound: 1 | 2 | 3 =
    nProgram === 0
      ? 1
      : (Math.min(3, Math.ceil(nProgram / TRADES_PER_ROUND)) as 1 | 2 | 3);

  const tradesInCurrentRound =
    nProgram === 0 ? 0 : ((nProgram - 1) % TRADES_PER_ROUND) + 1;

  const currentRoundProgressPercent = Math.min(
    100,
    (tradesInCurrentRound / TRADES_PER_ROUND) * 100
  );

  const completedRounds = Math.min(
    3,
    Math.floor(nProgram / TRADES_PER_ROUND)
  ) as 0 | 1 | 2 | 3;

  const roundBreakdown: RoundBreakdownRow[] = [1, 2, 3].map((n) => {
    const roundNumber = n as 1 | 2 | 3;
    const start = (roundNumber - 1) * TRADES_PER_ROUND + 1;
    const end = roundNumber * TRADES_PER_ROUND;
    return {
      roundNumber,
      theme: ROUND_THEMES[roundNumber],
      reviewedInRound: countReviewedInRound(totalReviewed, roundNumber),
      rangeLabel: `Trades ${start}–${end}`,
    };
  });

  const nextMilestoneMessage = buildNextMilestoneMessage(
    totalReviewed,
    currentRound,
    tradesInCurrentRound,
    professionalReadinessScore
  );

  return {
    totalReviewed,
    currentRound,
    currentRoundTheme: ROUND_THEMES[currentRound],
    completedRounds,
    tradesInCurrentRound,
    currentRoundProgressPercent,
    isProgramComplete,
    roundBreakdown,
    readiness: {
      averageTotalScore: professionalReadinessScore,
      tradeCountWithScore: withTotal.length,
      totalReviewedClosed: totalReviewed,
    },
    professionalReadinessScore,
    traderLevelLabel,
    maxAllowedRiskHeadline,
    maxAllowedRiskDetail,
    nextMilestoneMessage,
  };
}
