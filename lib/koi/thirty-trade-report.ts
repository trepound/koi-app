import {
  getTraderLevelLabel,
  getReviewedClosedTrades,
  TRADES_PER_ROUND,
} from "./development-progress";
import { getCoachingForMistake } from "./mistake-coaching";
import { MISTAKE_BUCKETS } from "./mistake-penalties";
import { SETUP_MISTAKE_PENALTY_POINTS } from "./setup-mistake-penalties";
import type { Mistake, Trade } from "./types";

export const THIRTY_TRADE_REPORT_COUNT = TRADES_PER_ROUND;

export type ThirtyTradeReportMistakeRow = {
  mistake: Mistake;
  count: number;
  /** count × per-label severity (same weighting as elsewhere). */
  weightedImpact: number;
};

/** Shared aggregates for any reviewed-close slice (used by 30- and 60-trade reports). */
export type ReviewedSliceStats = {
  avgTotalScore: number | null;
  avgSetupScore: number;
  avgExecutionScore: number | null;
  disciplineScorePct: number;
  avgR: number | null;
  winRatePct: number | null;
  rSampleCount: number;
  winCount: number;
};

export type ThirtyTradeReportModel = {
  traderLevel: string;
  avgTotalScore: number | null;
  avgSetupScore: number;
  avgExecutionScore: number | null;
  disciplineScorePct: number;
  avgR: number | null;
  winRatePct: number | null;
  rSampleCount: number;
  winCount: number;
  topMistakes: ThirtyTradeReportMistakeRow[];
  topDisciplineLeak: string;
  recommendedAction: string;
  summaryParagraph: string;
};

function labelSeverity(m: Mistake): number {
  const ex = MISTAKE_BUCKETS[m]?.penalty ?? 0;
  const su = SETUP_MISTAKE_PENALTY_POINTS[m] ?? 0;
  return Math.max(ex, su);
}

/** Oldest reviewed closes first — “first 30” in time order. */
export function getFirstNReviewedClosedTrades(
  trades: Trade[],
  n: number
): Trade[] {
  return getReviewedClosedTrades(trades)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .slice(0, n);
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Averages and discipline % for a set of reviewed closed trades (any length).
 * Discipline = % of trades with zero mistake tags in this slice.
 */
export function aggregateReviewedSliceStats(slice: Trade[]): ReviewedSliceStats {
  const n = slice.length;
  if (n === 0) {
    return {
      avgTotalScore: null,
      avgSetupScore: 0,
      avgExecutionScore: null,
      disciplineScorePct: 0,
      avgR: null,
      winRatePct: null,
      rSampleCount: 0,
      winCount: 0,
    };
  }

  const totals = slice
    .map((t) => t.totalScore)
    .filter((x): x is number => x != null && Number.isFinite(x));
  const avgTotalScore = mean(totals);

  const setups = slice.map((t) => t.setupScore).filter((x) => Number.isFinite(x));
  const avgSetupScore = mean(setups) ?? 0;

  const execs = slice
    .map((t) => t.executionScore)
    .filter((x): x is number => x != null && Number.isFinite(x));
  const avgExecutionScore = mean(execs);

  const clean = slice.filter((t) => t.mistakes.length === 0).length;
  const disciplineScorePct = (clean / n) * 100;

  const rVals = slice
    .map((t) => t.rMultiple)
    .filter((x): x is number => x != null && Number.isFinite(x));
  const avgR = mean(rVals);
  const rSampleCount = rVals.length;
  const winCount = rVals.filter((r) => r > 0).length;
  const winRatePct =
    rSampleCount > 0 ? (winCount / rSampleCount) * 100 : null;

  return {
    avgTotalScore,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    avgR,
    winRatePct,
    rSampleCount,
    winCount,
  };
}

export function rankMistakesAcrossTrades(trades: Trade[]): ThirtyTradeReportMistakeRow[] {
  const counts = new Map<Mistake, number>();
  for (const t of trades) {
    for (const m of t.mistakes) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }
  const rows: ThirtyTradeReportMistakeRow[] = [];
  for (const [mistake, count] of counts) {
    const sev = labelSeverity(mistake);
    rows.push({
      mistake,
      count,
      weightedImpact: count * sev,
    });
  }
  return rows
    .sort((a, b) => {
      if (b.weightedImpact !== a.weightedImpact) {
        return b.weightedImpact - a.weightedImpact;
      }
      return b.count - a.count;
    })
    .slice(0, 3);
}

function buildSummaryParagraph(p: {
  avgTotalScore: number | null;
  traderLevel: string;
  avgSetupScore: number;
  avgExecutionScore: number | null;
  disciplineScorePct: number;
  topMistakes: ThirtyTradeReportMistakeRow[];
  avgR: number | null;
  winRatePct: number | null;
  rSampleCount: number;
}): string {
  const t = THIRTY_TRADE_REPORT_COUNT;
  const totalStr =
    p.avgTotalScore !== null
      ? `${p.avgTotalScore.toFixed(0)} / 100`
      : "not yet measurable";
  const execStr =
    p.avgExecutionScore !== null
      ? `${p.avgExecutionScore.toFixed(0)} / 50`
      : "—";

  let body = `Your first ${t} reviewed closes average ${totalStr} overall (${p.traderLevel}). Setup sits near ${p.avgSetupScore.toFixed(0)} / 50 and execution near ${execStr}. `;
  body += `You left ${p.disciplineScorePct.toFixed(0)}% of those trades with zero tagged mistakes — that number is only useful if tags stay honest. `;

  const top = p.topMistakes[0];
  if (top) {
    body += `The strongest signal in the tags is ${top.mistake} (${top.count}×); that is the pattern to interrupt before the next batch of trades. `;
  } else {
    body += `No mistakes were tagged in this window; if that matches reality, keep the standard — if not, log slips so KOI can coach accurately. `;
  }

  if (p.rSampleCount > 0 && p.avgR !== null) {
    body += `Average R is ${p.avgR.toFixed(2)}`;
    if (p.winRatePct !== null) {
      body += `, with ${p.winRatePct.toFixed(0)}% of those trades positive on R`;
    }
    body += ".";
  }

  return body.trim();
}

/**
 * Milestone report for the first 30 reviewed closed trades. `null` until that many exist.
 */
export function buildThirtyTradeReport(trades: Trade[]): ThirtyTradeReportModel | null {
  const slice = getFirstNReviewedClosedTrades(trades, THIRTY_TRADE_REPORT_COUNT);
  if (slice.length < THIRTY_TRADE_REPORT_COUNT) return null;

  const {
    avgTotalScore,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    avgR,
    winRatePct,
    rSampleCount,
    winCount,
  } = aggregateReviewedSliceStats(slice);

  const traderLevel = getTraderLevelLabel(avgTotalScore);

  const topMistakes = rankMistakesAcrossTrades(slice);
  const topMistake = topMistakes[0]?.mistake ?? null;

  const topDisciplineLeak = topMistake
    ? `${topMistake} (${topMistakes[0]!.count}× in this window)`
    : "None standing out — no mistake tags in these 30 reviews.";

  const recommendedAction = topMistake
    ? getCoachingForMistake(topMistake).action
    : "Stay on track and keep building";

  const summaryParagraph = buildSummaryParagraph({
    avgTotalScore,
    traderLevel,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    topMistakes,
    avgR,
    winRatePct,
    rSampleCount,
  });

  return {
    traderLevel,
    avgTotalScore,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    avgR,
    winRatePct,
    rSampleCount,
    winCount,
    topMistakes,
    topDisciplineLeak,
    recommendedAction,
    summaryParagraph,
  };
}
