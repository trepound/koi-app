import { getSetupGrade, getTradeGrade } from "./grading";
import { calculateExecutionScore, calculateSetupScore } from "./scoring";
import { calculateRMultiple, calculateWeightedRewardRiskFromPrices } from "./risk";
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
  const setupScore = calculateSetupScore(
    params.imbalanceQuality,
    params.freshness,
    params.htfAlignment,
    params.locationQuality
  );
  const setupGrade = getSetupGrade(setupScore);

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
    mistakes: [],
    createdAt: new Date().toISOString(),
  };
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

  const safeRewardRisk =
    typeof trade.rewardRisk === "number" ? trade.rewardRisk : 0;
  const safeSize = typeof trade.size === "number" ? trade.size : 0;
  const safeMistakes = Array.isArray(trade.mistakes) ? trade.mistakes : [];
  const safeSetupScore =
    typeof trade.setupScore === "number" ? trade.setupScore : 0;

  const executionScore = calculateExecutionScore(
    safeRewardRisk,
    safeSize,
    safeMistakes
  );

  const totalScore = safeSetupScore + executionScore;
  const finalGrade = getTradeGrade(totalScore);

  return {
    ...trade,
    status: "CLOSED" as TradeStatus,
    exitPrice: exitValue,
    rMultiple,
    executionScore,
    totalScore,
    finalGrade,
  };
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
  return trades.map((t) => (t.id === id ? { ...t, mistakes } : t));
}
