/**
 * Opportunity Decision Engine — scoring, gates, trade decision copy.
 * Phase 3+: opportunity vault / server validation can call evaluateKoiSetup.
 */

import {
  getKoiGradeFromFinalOpportunityScore,
  getKoiRecommendedAction,
  getKoiSetupQuality,
} from "./grading";
import {
  getAverageRewardRiskScorePoints,
  getKoiFreshnessPoints,
  getKoiImbalancePoints,
  getKoiTimeAtZonePoints,
  getKoiTrendPoints,
} from "./scoring";
import { parsePositivePriceField } from "./risk";
import type {
  KoiEvalParts,
  KoiEvalResult,
  KoiGrade,
  KoiHTFLocation,
  KoiImbalance,
  KoiPatternStage,
  KoiTimeAtZone,
  KoiTrend,
  KoiTrendRelation,
  KoiZoneSide,
  Freshness,
} from "./types";

type KoiTrendValue = Exclude<KoiTrend, "">;
type KoiLocationValue = Exclude<KoiHTFLocation, "">;
type KoiZoneValue = Exclude<KoiZoneSide, "">;
type KoiPatternValue = Exclude<KoiPatternStage, "">;
type KoiImbalanceValue = Exclude<KoiImbalance, "">;
type KoiTimeValue = Exclude<KoiTimeAtZone, "">;

// Map ITF trend + zone side to "with trend / countertrend / sideways"
export function getKoiTrendRelation(
  trend: KoiTrendValue,
  zoneSide: KoiZoneValue
): KoiTrendRelation {
  if (trend === "Sideways") return "Sideways";
  if (zoneSide === "Demand") {
    return trend === "Uptrend" ? "With Trend" : "Against Trend";
  }
  return trend === "Downtrend" ? "With Trend" : "Against Trend";
}

export function getKoiTradeDecision(args: {
  isComplete: boolean;
  tradeAllowed: boolean;
  zoneSide: KoiZoneSide;
  grade: KoiGrade | undefined;
}) {
  if (!args.isComplete) {
    return { text: "Complete inputs", color: "#9ca3af" };
  }
  if (!args.tradeAllowed || !args.grade || args.grade === "D/F") {
    return { text: "No Trade", color: "#9ca3af" };
  }

  const side = args.zoneSide === "Demand" ? "Long" : "Short";
  const color = side === "Long" ? "#36d399" : "#fb7185";
  const action =
    args.grade === "A+" || args.grade === "A"
      ? "Entry"
      : "Confirmation Preferred";

  return action === "Entry"
    ? { text: `${side} Entry`, color }
    : { text: `${side} — ${action}`, color };
}

export function evaluateKoiSetup(args: {
  trend: KoiTrend;
  htfLocation: KoiHTFLocation;
  zoneSide: KoiZoneSide;
  patternStage: KoiPatternStage;
  imbalance: KoiImbalance;
  freshness: "" | Freshness;
  timeAtZone: KoiTimeAtZone;
  entryPrice: string;
  stopPrice: string;
  target1Price: string;
  target2Price: string;
}): KoiEvalResult {
  const entryNum = parsePositivePriceField(args.entryPrice);
  const stopNum = parsePositivePriceField(args.stopPrice);
  const t1 = parsePositivePriceField(args.target1Price);
  const t2 = parsePositivePriceField(args.target2Price);

  const isComplete =
    args.trend !== "" &&
    args.htfLocation !== "" &&
    args.zoneSide !== "" &&
    args.imbalance !== "" &&
    args.freshness !== "" &&
    args.timeAtZone !== "" &&
    entryNum !== null &&
    stopNum !== null &&
    t1 !== null &&
    t2 !== null;

  const trendPtsProg =
    args.trend !== "" && args.zoneSide !== ""
      ? getKoiTrendPoints(args.trend as KoiTrendValue)
      : null;
  const htfPtsProg =
    args.zoneSide !== "" && args.htfLocation !== ""
      ? (() => {
          const htfLoc = args.htfLocation as KoiLocationValue;
          const zone = args.zoneSide as KoiZoneValue;
          if (htfLoc === "Middle") return 5;
          if (zone === "Demand") {
            return htfLoc === "Wholesale" ? 10 : 4;
          }
          return htfLoc === "Retail" ? 10 : 4;
        })()
      : null;
  const imbalancePtsProg =
    args.imbalance !== ""
      ? getKoiImbalancePoints(args.imbalance as KoiImbalanceValue)
      : null;
  const freshnessPtsProg =
    args.freshness !== ""
      ? getKoiFreshnessPoints(args.freshness as Freshness)
      : null;
  const timePtsProg =
    args.timeAtZone !== ""
      ? getKoiTimeAtZonePoints(args.timeAtZone as KoiTimeValue)
      : null;

  const setupScorePartial =
    (imbalancePtsProg ?? 0) + (timePtsProg ?? 0) + (freshnessPtsProg ?? 0);

  const contextScorePartial = (trendPtsProg ?? 0) + (htfPtsProg ?? 0);

  let averageRewardRiskProg: number | undefined;
  let rewardRiskPtsProg: number | undefined;
  if (entryNum !== null && stopNum !== null && t2 !== null) {
    const risk = Math.abs(entryNum - stopNum);
    if (risk > 0) {
      const reward2 = Math.abs(t2 - entryNum);
      averageRewardRiskProg = reward2 / risk;
      rewardRiskPtsProg =
        averageRewardRiskProg >= 1.5
          ? getAverageRewardRiskScorePoints(averageRewardRiskProg)
          : 0;
    } else {
      averageRewardRiskProg = 0;
      rewardRiskPtsProg = 0;
    }
  }

  const progressiveTotal = Math.min(
    setupScorePartial + contextScorePartial + (rewardRiskPtsProg ?? 0),
    100
  );
  const progressiveGrade =
    setupScorePartial > 0 || (rewardRiskPtsProg ?? 0) > 0
      ? getKoiGradeFromFinalOpportunityScore(progressiveTotal)
      : undefined;

  const partsProgressive: KoiEvalParts = {
    trend: trendPtsProg,
    htfLocation: htfPtsProg,
    patternStage: null,
    imbalance: imbalancePtsProg,
    freshness: freshnessPtsProg,
    timeAtZone: timePtsProg,
    rewardRisk:
      averageRewardRiskProg === undefined ? null : averageRewardRiskProg,
    rewardRiskPts:
      rewardRiskPtsProg === undefined ? null : rewardRiskPtsProg,
  };

  if (!isComplete) {
    return {
      isComplete: false,
      step0Pass: false,
      tradeAllowed: false,
      step0Reason: "Waiting for input.",
      step0Checks: {
        middleSidewaysFail: false,
        middleDirectionalAllowed: false,
        edgeLocationsAllowed: false,
      },
      recommendedAction: "Complete inputs",
      averageRewardRisk: averageRewardRiskProg,
      setupScore: setupScorePartial,
      rewardRiskPoints: rewardRiskPtsProg,
      totalScore: progressiveTotal,
      grade: progressiveGrade,
      setupQuality: progressiveGrade
        ? getKoiSetupQuality(progressiveGrade)
        : "Add inputs to see quality",
      parts: partsProgressive,
    };
  }

  const trend = args.trend as KoiTrendValue;
  const htfLocation = args.htfLocation as KoiLocationValue;
  const zoneSide = args.zoneSide as KoiZoneValue;
  const imbalance = args.imbalance as KoiImbalanceValue;
  const freshness = args.freshness as Freshness;
  const timeAtZone = args.timeAtZone as KoiTimeValue;

  const isMiddle = htfLocation === "Middle";
  const isSideways = trend === "Sideways";
  const step0Pass = !(isMiddle && isSideways);

  const risk = Math.abs(entryNum! - stopNum!);
  const reward2 = Math.abs(t2! - entryNum!);
  const opportunityRewardRisk = risk > 0 ? reward2 / risk : 0;
  const priceThresholdPass = opportunityRewardRisk >= 1.5;

  const trendPts = getKoiTrendPoints(trend);
  const htfPts =
    htfLocation === "Middle"
      ? 5
      : zoneSide === "Demand"
        ? htfLocation === "Wholesale"
          ? 10
          : 4
        : htfLocation === "Retail"
          ? 10
          : 4;
  const imbalancePts = getKoiImbalancePoints(imbalance);
  const freshnessPts = getKoiFreshnessPoints(freshness);
  const timePts = getKoiTimeAtZonePoints(timeAtZone);
  const structureScore = imbalancePts + timePts + freshnessPts;
  const contextScore = trendPts + htfPts;
  const rewardRiskPts = priceThresholdPass
    ? getAverageRewardRiskScorePoints(opportunityRewardRisk)
    : 0;
  const finalOpportunityScore = Math.min(
    structureScore + contextScore + rewardRiskPts,
    100
  );
  const scoreThresholdPass = finalOpportunityScore >= 50;
  const tradeAllowed = step0Pass && priceThresholdPass && scoreThresholdPass;
  const grade = tradeAllowed
    ? getKoiGradeFromFinalOpportunityScore(finalOpportunityScore)
    : ("D/F" as KoiGrade);

  const partsNumeric: KoiEvalParts = {
    trend: trendPts,
    htfLocation: htfPts,
    patternStage: null,
    imbalance: imbalancePts,
    freshness: freshnessPts,
    timeAtZone: timePts,
    rewardRisk: opportunityRewardRisk,
    rewardRiskPts,
  };

  if (!step0Pass) {
    return {
      isComplete,
      step0Pass,
      tradeAllowed: false,
      step0Reason: "Middle + Sideways = No Trade.",
      step0Checks: {
        middleSidewaysFail: isMiddle && isSideways,
        middleDirectionalAllowed: isMiddle && !isSideways,
        edgeLocationsAllowed: false,
      },
      recommendedAction: "No trade",
      averageRewardRisk: opportunityRewardRisk,
      setupScore: structureScore + contextScore,
      rewardRiskPoints: rewardRiskPts,
      totalScore: finalOpportunityScore,
      grade,
      setupQuality: getKoiSetupQuality(grade),
      parts: partsNumeric,
    };
  }

  if (risk <= 0) {
    return {
      isComplete,
      step0Pass,
      tradeAllowed: false,
      step0Reason: "Entry and stop must differ (risk cannot be zero).",
      step0Checks: {
        middleSidewaysFail: false,
        middleDirectionalAllowed: isMiddle && !isSideways,
        edgeLocationsAllowed: htfLocation === "Wholesale" || htfLocation === "Retail",
      },
      recommendedAction: "No trade",
      averageRewardRisk: 0,
      setupScore: structureScore + contextScore,
      rewardRiskPoints: 0,
      totalScore: Math.min(structureScore + contextScore, 100),
      grade: "D/F" as KoiGrade,
      setupQuality: getKoiSetupQuality("D/F"),
      parts: {
        ...partsNumeric,
        rewardRisk: 0,
        rewardRiskPts: 0,
      },
    };
  }

  if (!priceThresholdPass) {
    return {
      isComplete,
      step0Pass,
      tradeAllowed: false,
      step0Reason: "Reward:Risk (Target 2) is below 1.5:1.",
      step0Checks: {
        middleSidewaysFail: false,
        middleDirectionalAllowed: isMiddle && !isSideways,
        edgeLocationsAllowed: htfLocation === "Wholesale" || htfLocation === "Retail",
      },
      recommendedAction: "No trade",
      averageRewardRisk: opportunityRewardRisk,
      setupScore: structureScore + contextScore,
      rewardRiskPoints: rewardRiskPts,
      totalScore: finalOpportunityScore,
      grade,
      setupQuality: getKoiSetupQuality(grade),
      parts: partsNumeric,
    };
  }

  if (!scoreThresholdPass) {
    return {
      isComplete,
      step0Pass,
      tradeAllowed: false,
      step0Reason: "Opportunity score is below 30.",
      step0Checks: {
        middleSidewaysFail: false,
        middleDirectionalAllowed: isMiddle && !isSideways,
        edgeLocationsAllowed: htfLocation === "Wholesale" || htfLocation === "Retail",
      },
      recommendedAction: "No trade",
      averageRewardRisk: opportunityRewardRisk,
      setupScore: structureScore + contextScore,
      rewardRiskPoints: rewardRiskPts,
      totalScore: finalOpportunityScore,
      grade,
      setupQuality: getKoiSetupQuality(grade),
      parts: partsNumeric,
    };
  }

  return {
    isComplete,
    step0Pass: true,
    tradeAllowed: true,
    step0Reason: "Trade allowed.",
    step0Checks: {
      middleSidewaysFail: false,
      middleDirectionalAllowed: isMiddle && !isSideways,
      edgeLocationsAllowed: htfLocation === "Wholesale" || htfLocation === "Retail",
    },
    recommendedAction: getKoiRecommendedAction(grade),
    averageRewardRisk: opportunityRewardRisk,
    setupScore: structureScore + contextScore,
    rewardRiskPoints: rewardRiskPts,
    totalScore: finalOpportunityScore,
    grade,
    setupQuality: getKoiSetupQuality(grade),
    parts: partsNumeric,
  };
}
