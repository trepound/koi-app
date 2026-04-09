import {
  getTraderLevelLabel,
  PROGRAM_REVIEWED_CAP,
} from "./development-progress";
import { getCoachingForMistake } from "./mistake-coaching";
import {
  aggregateReviewedSliceStats,
  getFirstNReviewedClosedTrades,
  rankMistakesAcrossTrades,
  THIRTY_TRADE_REPORT_COUNT,
  type ThirtyTradeReportMistakeRow,
} from "./thirty-trade-report";
import type { Trade } from "./types";

export const NINETY_TRADE_REPORT_COUNT = PROGRAM_REVIEWED_CAP;

export type DisciplineVerdict =
  | "Approved for Pro Level"
  | "Not Ready — Continue Development";

export type ConsistencyJudgment =
  | "Consistent"
  | "Improving"
  | "Inconsistent"
  | "Unstable";

export type NinetyTradeReportMistakeRow = ThirtyTradeReportMistakeRow;

export type NinetyTradeReportModel = {
  traderLevel: string;
  disciplineVerdict: DisciplineVerdict;
  avgTotalScore: number | null;
  avgSetupScore: number;
  avgExecutionScore: number | null;
  disciplineScorePct: number;
  avgR: number | null;
  winRatePct: number | null;
  rSampleCount: number;
  winCount: number;
  consistencyJudgment: ConsistencyJudgment;
  riskEligibilityHeadline: string;
  riskEligibilityDetail: string;
  topMistakes: NinetyTradeReportMistakeRow[];
  topDisciplineLeak: string;
  recommendedAction: string;
  summaryParagraph: string;
};

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdevPopulation(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const m = mean(nums);
  if (m === null) return null;
  const v =
    nums.reduce((s, x) => s + (x - m) * (x - m), 0) / nums.length;
  return Math.sqrt(v);
}

function deriveConsistencyJudgment(
  all90: Trade[],
  w1: Trade[],
  w2: Trade[],
  w3: Trade[],
  topMistakeCount: number
): ConsistencyJudgment {
  const scores = all90
    .map((t) => t.totalScore)
    .filter((x): x is number => x != null && Number.isFinite(x));
  const sd = stdevPopulation(scores);

  const s1 = aggregateReviewedSliceStats(w1);
  const s2 = aggregateReviewedSliceStats(w2);
  const s3 = aggregateReviewedSliceStats(w3);

  const dSpread =
    Math.max(
      s1.disciplineScorePct,
      s2.disciplineScorePct,
      s3.disciplineScorePct
    ) -
    Math.min(
      s1.disciplineScorePct,
      s2.disciplineScorePct,
      s3.disciplineScorePct
    );

  const topRate = topMistakeCount / NINETY_TRADE_REPORT_COUNT;

  if (
    (sd !== null && sd > 16) ||
    dSpread > 32 ||
    topRate >= 0.44
  ) {
    return "Unstable";
  }

  const t1 = s1.avgTotalScore;
  const t2 = s2.avgTotalScore;
  const t3 = s3.avgTotalScore;

  if (t1 !== null && t2 !== null && t3 !== null) {
    if (t3 >= t2 + 1.5 && t2 >= t1 - 1) return "Improving";
    if (t3 <= t1 - 2 && (t3 <= t2 - 1 || t2 <= t1 - 1)) {
      return "Inconsistent";
    }
  }

  return "Consistent";
}

function deriveDisciplineVerdict(p: {
  avgTotalScore: number | null;
  disciplineScorePct: number;
  consistencyJudgment: ConsistencyJudgment;
}): DisciplineVerdict {
  const { avgTotalScore, disciplineScorePct, consistencyJudgment } = p;

  if (
    avgTotalScore !== null &&
    avgTotalScore >= 90 &&
    disciplineScorePct >= 40 &&
    (consistencyJudgment === "Consistent" || consistencyJudgment === "Improving")
  ) {
    return "Approved for Pro Level";
  }

  return "Not Ready — Continue Development";
}

function riskEligibility(verdict: DisciplineVerdict): {
  headline: string;
  detail: string;
} {
  if (verdict === "Approved for Pro Level") {
    return {
      headline: "Eligible for controlled risk increase",
      detail:
        "Only if your written rules allow it — raise size in small steps and keep a hard cap.",
    };
  }
  return {
    headline: "Maintain 1% risk",
    detail: "Focus on discipline consistency before adding size.",
  };
}

function buildNinetySummaryParagraph(p: {
  disciplineVerdict: DisciplineVerdict;
  traderLevel: string;
  consistencyJudgment: ConsistencyJudgment;
  avgTotalScore: number | null;
  topMistake: NinetyTradeReportMistakeRow | undefined;
}): string {
  const { disciplineVerdict, traderLevel, consistencyJudgment, topMistake } = p;
  const totalStr =
    p.avgTotalScore !== null ? p.avgTotalScore.toFixed(1) : "—";

  let body = `Ninety reviewed closes average ${totalStr} on level score (${traderLevel}). Consistency read: ${consistencyJudgment}. `;

  if (topMistake) {
    body += `The dominant tag is ${topMistake.mistake} (${topMistake.count}×) — that is the primary leak to address in the next phase. `;
  } else {
    body += `No mistake tags appear across this window; keep logging when behavior slips. `;
  }

  if (disciplineVerdict === "Approved for Pro Level") {
    body +=
      "Verdict: approved for Pro Level execution under your rules — execution quality and discipline met the bar in this sample.";
  } else {
    body +=
      "Verdict: not ready for Pro Level sizing yet — level score, discipline share, or consistency still need work before risk goes up.";
  }

  return body.trim();
}

/**
 * First 90 reviewed closed trades (stable program milestone).
 */
export function buildNinetyTradeReport(trades: Trade[]): NinetyTradeReportModel | null {
  const all90 = getFirstNReviewedClosedTrades(trades, NINETY_TRADE_REPORT_COUNT);
  if (all90.length < NINETY_TRADE_REPORT_COUNT) return null;

  const w1 = all90.slice(0, THIRTY_TRADE_REPORT_COUNT);
  const w2 = all90.slice(THIRTY_TRADE_REPORT_COUNT, THIRTY_TRADE_REPORT_COUNT * 2);
  const w3 = all90.slice(THIRTY_TRADE_REPORT_COUNT * 2, NINETY_TRADE_REPORT_COUNT);

  const stats90 = aggregateReviewedSliceStats(all90);
  const {
    avgTotalScore,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    avgR,
    winRatePct,
    rSampleCount,
    winCount,
  } = stats90;

  const traderLevel = getTraderLevelLabel(avgTotalScore);
  const topMistakes = rankMistakesAcrossTrades(all90);
  const top = topMistakes[0];
  const topMistakeCount = top?.count ?? 0;

  const consistencyJudgment = deriveConsistencyJudgment(
    all90,
    w1,
    w2,
    w3,
    topMistakeCount
  );

  const disciplineVerdict = deriveDisciplineVerdict({
    avgTotalScore,
    disciplineScorePct,
    consistencyJudgment,
  });

  const { headline: riskEligibilityHeadline, detail: riskEligibilityDetail } =
    riskEligibility(disciplineVerdict);

  const topDisciplineLeak = top
    ? `${top.mistake} (${top.count}× across 90)`
    : "None standing out — no mistake tags in these 90 reviews.";

  const recommendedAction = top
    ? getCoachingForMistake(top.mistake).action
    : "Stay on track and keep building";

  const summaryParagraph = buildNinetySummaryParagraph({
    disciplineVerdict,
    traderLevel,
    consistencyJudgment,
    avgTotalScore,
    topMistake: top,
  });

  return {
    traderLevel,
    disciplineVerdict,
    avgTotalScore,
    avgSetupScore,
    avgExecutionScore,
    disciplineScorePct,
    avgR,
    winRatePct,
    rSampleCount,
    winCount,
    consistencyJudgment,
    riskEligibilityHeadline,
    riskEligibilityDetail,
    topMistakes,
    topDisciplineLeak,
    recommendedAction,
    summaryParagraph,
  };
}
