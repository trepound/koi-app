import { getTraderLevelLabel } from "./development-progress";
import { getCoachingForMistake } from "./mistake-coaching";
import {
  aggregateReviewedSliceStats,
  getFirstNReviewedClosedTrades,
  rankMistakesAcrossTrades,
  THIRTY_TRADE_REPORT_COUNT,
  type ReviewedSliceStats,
  type ThirtyTradeReportMistakeRow,
} from "./thirty-trade-report";
import type { Mistake, Trade } from "./types";

export const SIXTY_TRADE_REPORT_COUNT = THIRTY_TRADE_REPORT_COUNT * 2;

export type ConsistencySignal = "Improving" | "Flat" | "Slipping";

export type MetricTrend = "up" | "flat" | "down";

export type SixtyTradeComparisonRow = {
  label: string;
  first30Display: string;
  second30Display: string;
  trend: MetricTrend;
};

export type TopMistakeFrequencyTrend = "decreasing" | "unchanged" | "increasing";

export type SixtyTradeReportMistakeRow = ThirtyTradeReportMistakeRow;

export type SixtyTradeReportModel = {
  traderLevel: string;
  avgTotalScore: number | null;
  avgSetupScore: number;
  avgExecutionScore: number | null;
  disciplineScorePct: number;
  avgR: number | null;
  winRatePct: number | null;
  rSampleCount: number;
  winCount: number;
  consistencySignal: ConsistencySignal;
  comparisonRows: SixtyTradeComparisonRow[];
  topMistakes: SixtyTradeReportMistakeRow[];
  topMistakeFrequencyTrend: TopMistakeFrequencyTrend | null;
  topDisciplineLeak: string;
  recommendedAction: string;
  summaryParagraph: string;
};

function countMistakeOccurrences(slice: Trade[], m: Mistake): number {
  let n = 0;
  for (const t of slice) {
    for (const x of t.mistakes) {
      if (x === m) n++;
    }
  }
  return n;
}

function deltaVote(delta: number, threshold: number): number {
  if (delta > threshold) return 1;
  if (delta < -threshold) return -1;
  return 0;
}

function deriveConsistencySignal(
  first: ReviewedSliceStats,
  second: ReviewedSliceStats
): ConsistencySignal {
  const votes: number[] = [];

  if (first.avgTotalScore !== null && second.avgTotalScore !== null) {
    votes.push(deltaVote(second.avgTotalScore - first.avgTotalScore, 2));
  }
  votes.push(deltaVote(second.avgSetupScore - first.avgSetupScore, 1));
  if (first.avgExecutionScore !== null && second.avgExecutionScore !== null) {
    votes.push(deltaVote(second.avgExecutionScore - first.avgExecutionScore, 1));
  }
  votes.push(deltaVote(second.disciplineScorePct - first.disciplineScorePct, 5));
  if (first.avgR !== null && second.avgR !== null) {
    votes.push(deltaVote(second.avgR - first.avgR, 0.15));
  }

  const sum = votes.reduce((a, b) => a + b, 0);
  if (sum >= 2) return "Improving";
  if (sum <= -2) return "Slipping";
  return "Flat";
}

function fmtTotal(s: ReviewedSliceStats): string {
  return s.avgTotalScore !== null ? s.avgTotalScore.toFixed(1) : "—";
}

function fmtSetup(s: ReviewedSliceStats): string {
  return s.avgSetupScore.toFixed(1);
}

function fmtExec(s: ReviewedSliceStats): string {
  return s.avgExecutionScore !== null ? s.avgExecutionScore.toFixed(1) : "—";
}

function fmtDisc(s: ReviewedSliceStats): string {
  return `${s.disciplineScorePct.toFixed(0)}%`;
}

function fmtR(s: ReviewedSliceStats): string {
  return s.avgR !== null ? s.avgR.toFixed(2) : "—";
}

function rowTrend(
  label: string,
  first: ReviewedSliceStats,
  second: ReviewedSliceStats,
  kind: "total" | "setup" | "exec" | "disc" | "r"
): SixtyTradeComparisonRow {
  let trend: MetricTrend = "flat";
  if (kind === "total") {
    if (first.avgTotalScore === null || second.avgTotalScore === null) {
      return {
        label,
        first30Display: fmtTotal(first),
        second30Display: fmtTotal(second),
        trend: "flat",
      };
    }
    const d = second.avgTotalScore - first.avgTotalScore;
    trend = d > 2 ? "up" : d < -2 ? "down" : "flat";
  } else if (kind === "setup") {
    const d = second.avgSetupScore - first.avgSetupScore;
    trend = d > 1 ? "up" : d < -1 ? "down" : "flat";
  } else if (kind === "exec") {
    if (first.avgExecutionScore === null || second.avgExecutionScore === null) {
      return {
        label,
        first30Display: fmtExec(first),
        second30Display: fmtExec(second),
        trend: "flat",
      };
    }
    const d = second.avgExecutionScore - first.avgExecutionScore;
    trend = d > 1 ? "up" : d < -1 ? "down" : "flat";
  } else if (kind === "disc") {
    const d = second.disciplineScorePct - first.disciplineScorePct;
    trend = d > 5 ? "up" : d < -5 ? "down" : "flat";
  } else {
    if (first.avgR === null || second.avgR === null) {
      return {
        label,
        first30Display: fmtR(first),
        second30Display: fmtR(second),
        trend: "flat",
      };
    }
    const d = second.avgR - first.avgR;
    trend = d > 0.15 ? "up" : d < -0.15 ? "down" : "flat";
  }

  return {
    label,
    first30Display:
      kind === "total"
        ? fmtTotal(first)
        : kind === "setup"
          ? fmtSetup(first)
          : kind === "exec"
            ? fmtExec(first)
            : kind === "disc"
              ? fmtDisc(first)
              : fmtR(first),
    second30Display:
      kind === "total"
        ? fmtTotal(second)
        : kind === "setup"
          ? fmtSetup(second)
          : kind === "exec"
            ? fmtExec(second)
            : kind === "disc"
              ? fmtDisc(second)
              : fmtR(second),
    trend,
  };
}

function topMistakeTrend(
  m: Mistake,
  first30: Trade[],
  second30: Trade[]
): TopMistakeFrequencyTrend {
  const c1 = countMistakeOccurrences(first30, m);
  const c2 = countMistakeOccurrences(second30, m);
  if (c2 < c1) return "decreasing";
  if (c2 > c1) return "increasing";
  return "unchanged";
}

function buildSixtySummaryParagraph(p: {
  consistencySignal: ConsistencySignal;
  topMistake: Mistake | null;
  topMistakeTrend: TopMistakeFrequencyTrend | null;
  traderLevel: string;
  avgTotalScore: number | null;
}): string {
  const { consistencySignal, topMistake, topMistakeTrend } = p;
  let body = `Across 60 reviewed closes, the consistency read is ${consistencySignal} when comparing your second 30 trades to the first 30 on score, execution, discipline, and R. `;

  body += `Overall level score for all 60 averages ${p.avgTotalScore !== null ? p.avgTotalScore.toFixed(1) : "—"} (${p.traderLevel}). `;

  if (topMistake && topMistakeTrend) {
    body += `Your most repeated tag is still ${topMistake}; frequency is ${topMistakeTrend} from the first block of 30 to the second — that matters more than the headline number. `;
  } else if (!topMistake) {
    body += `Mistake tags are absent in this 60-trade window; keep logging when reality differs. `;
  }

  if (consistencySignal === "Improving") {
    body += `The second half is stronger on several markers — treat that as evidence the process is sticking, not as permission to loosen rules.`;
  } else if (consistencySignal === "Slipping") {
    body += `The second half is weaker on several markers — narrow focus to one execution rule and one setup rule before adding size or frequency.`;
  } else {
    body += `Movement between halves is mixed or small — you are roughly flat; the next stretch is about picking one leak and proving it down over the next batch.`;
  }

  return body.trim();
}

/**
 * First 60 reviewed closed trades, oldest first — stable milestone.
 */
export function buildSixtyTradeReport(trades: Trade[]): SixtyTradeReportModel | null {
  const all60 = getFirstNReviewedClosedTrades(trades, SIXTY_TRADE_REPORT_COUNT);
  if (all60.length < SIXTY_TRADE_REPORT_COUNT) return null;

  const first30 = all60.slice(0, THIRTY_TRADE_REPORT_COUNT);
  const second30 = all60.slice(THIRTY_TRADE_REPORT_COUNT, SIXTY_TRADE_REPORT_COUNT);

  const stats60 = aggregateReviewedSliceStats(all60);
  const stats1 = aggregateReviewedSliceStats(first30);
  const stats2 = aggregateReviewedSliceStats(second30);

  const traderLevel = getTraderLevelLabel(stats60.avgTotalScore);
  const consistencySignal = deriveConsistencySignal(stats1, stats2);

  const comparisonRows: SixtyTradeComparisonRow[] = [
    rowTrend("Avg total score", stats1, stats2, "total"),
    rowTrend("Avg setup score", stats1, stats2, "setup"),
    rowTrend("Avg execution score", stats1, stats2, "exec"),
    rowTrend("Discipline score", stats1, stats2, "disc"),
    rowTrend("Avg R", stats1, stats2, "r"),
  ];

  const topMistakes = rankMistakesAcrossTrades(all60);
  const top = topMistakes[0]?.mistake ?? null;
  const topMistakeFrequencyTrend = top
    ? topMistakeTrend(top, first30, second30)
    : null;

  const topDisciplineLeak = top
    ? `${top} (${topMistakes[0]!.count}× across 60)`
    : "None standing out — no mistake tags in these 60 reviews.";

  const recommendedAction = top
    ? getCoachingForMistake(top).action
    : "Stay on track and keep building";

  const summaryParagraph = buildSixtySummaryParagraph({
    consistencySignal,
    topMistake: top,
    topMistakeTrend: topMistakeFrequencyTrend,
    traderLevel,
    avgTotalScore: stats60.avgTotalScore,
  });

  return {
    traderLevel,
    avgTotalScore: stats60.avgTotalScore,
    avgSetupScore: stats60.avgSetupScore,
    avgExecutionScore: stats60.avgExecutionScore,
    disciplineScorePct: stats60.disciplineScorePct,
    avgR: stats60.avgR,
    winRatePct: stats60.winRatePct,
    rSampleCount: stats60.rSampleCount,
    winCount: stats60.winCount,
    consistencySignal,
    comparisonRows,
    topMistakes,
    topMistakeFrequencyTrend,
    topDisciplineLeak,
    recommendedAction,
    summaryParagraph,
  };
}
