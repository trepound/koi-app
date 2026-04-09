import {
  getSetupGradeScaled50,
  getTradeGrade,
} from "./grading";
import { calculateExecutionScore } from "./mistake-penalties";
import { calculateScaledSetupScore } from "./setup-mistake-penalties";
import { calculateSetupScore } from "./scoring";
import { calculateRMultiple, calculateWeightedRewardRiskFromPrices } from "./risk";
import {
  aggregateMistakesForPersistence,
  normalizeStageMistakes,
  partitionMistakesByStage,
} from "./stage-mistakes";
import type {
  Freshness,
  HTFAlignment,
  ImbalanceQuality,
  LocationQuality,
  Mistake,
  Trade,
  TradeStatus,
} from "./types";

export type BuildNewTradeParams = {
  symbol: string;
  entry: number;
  stop: number;
  target: number;
  target2: number;
  pct1: number;
  pct2: number;
  size: number;
  side: "Long" | "Short";
  imbalanceQuality: ImbalanceQuality;
  freshness: Freshness;
  htfAlignment: HTFAlignment;
  locationQuality: LocationQuality;
  setupMistakes?: Mistake[];
};

export function buildNewTrade(params: BuildNewTradeParams): Trade {
  const rewardRisk = calculateWeightedRewardRiskFromPrices(
    params.entry,
    params.stop,
    params.target,
    params.target2,
    params.pct1,
    params.pct2
  );
  const rawPillar = calculateSetupScore(
    params.imbalanceQuality,
    params.freshness,
    params.htfAlignment,
    params.locationQuality
  );
  const setupMistakes = params.setupMistakes ?? [];
  const setupScore = calculateScaledSetupScore(rawPillar, setupMistakes);
  const setupGrade = getSetupGradeScaled50(setupScore);

  const mistakes = aggregateMistakesForPersistence(setupMistakes, []);

  return {
    id: Date.now(),
    symbol: params.symbol.toUpperCase(),
    entry: params.entry,
    stop: params.stop,
    target: params.target,
    target2: params.target2,
    target1AllocationPct: params.pct1,
    target2AllocationPct: params.pct2,
    size: params.size,
    side: params.side,
    status: "PLANNED",
    imbalanceQuality: params.imbalanceQuality,
    freshness: params.freshness,
    htfAlignment: params.htfAlignment,
    locationQuality: params.locationQuality,
    setupScore,
    setupGrade,
    rewardRisk,
    mistakes,
    setupMistakes,
    managementMistakes: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Single source: pillar setup (minus setup-stage mistakes, scaled 0–50) +
 * execution from management-stage mistakes only. Total = setup + execution.
 */
export function recalculateTradeScores(trade: Trade): Trade {
  const { setup, management } = normalizeStageMistakes(trade);
  const rawPillar = calculateSetupScore(
    trade.imbalanceQuality,
    trade.freshness,
    trade.htfAlignment,
    trade.locationQuality
  );
  const setupScore = calculateScaledSetupScore(rawPillar, setup);
  const setupGrade = getSetupGradeScaled50(setupScore);
  const executionScore = calculateExecutionScore(management);
  const totalScore = setupScore + executionScore;
  const mistakes = aggregateMistakesForPersistence(setup, management);

  return {
    ...trade,
    setupMistakes: setup,
    managementMistakes: management,
    mistakes,
    setupScore,
    setupGrade,
    executionScore,
    totalScore,
    finalGrade: getTradeGrade(totalScore),
  };
}

/** Legacy: flat `mistakes` list only — partitions into stages then scores. */
export function recalculateTradeScoresForMistakes(
  trade: Trade,
  mistakes: Mistake[]
): Trade {
  const { setup, management } = partitionMistakesByStage(
    Array.isArray(mistakes) ? mistakes : []
  );
  return recalculateTradeScores({
    ...trade,
    setupMistakes: setup,
    managementMistakes: management,
    mistakes: aggregateMistakesForPersistence(setup, management),
  });
}

/** Returns updated trade when closing; caller merges into list. */
export function finalizeExistingTrade(
  trade: Trade,
  exitValue: number
): Trade {
  const rMultiple = calculateRMultiple(
    trade.entry,
    trade.stop,
    exitValue,
    trade.side
  );

  const closed: Trade = {
    ...trade,
    status: "CLOSED" as TradeStatus,
    exitPrice: exitValue,
    rMultiple,
  };

  return recalculateTradeScores(closed);
}

export function updateTradeStatusById(
  trades: Trade[],
  id: number,
  status: TradeStatus
): Trade[] {
  return trades.map((t) => (t.id === id ? { ...t, status } : t));
}

export function applyMistakesById(
  trades: Trade[],
  id: number,
  mistakes: Mistake[]
): Trade[] {
  return trades.map((t) =>
    t.id === id ? recalculateTradeScoresForMistakes(t, mistakes) : t
  );
}
