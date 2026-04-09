import { ALL_MISTAKES } from "./constants";
import { partitionMistakesByStage } from "./stage-mistakes";
import type {
  DatabaseTradeRow,
  Freshness,
  HTFAlignment,
  ImbalanceQuality,
  LocationQuality,
  Mistake,
  Trade,
  TradeStatus,
} from "./types";

const MISTAKE_SET = new Set<string>(ALL_MISTAKES);

export function isMistake(value: string): value is Mistake {
  return MISTAKE_SET.has(value);
}

function parseNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  throw new Error("Expected finite number");
}

function parseNumNullable(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return parseNum(value);
}

function parseTradeId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (!Number.isSafeInteger(value)) {
      throw new Error("Trade id is not a safe integer");
    }
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isSafeInteger(n)) return n;
  }
  throw new Error("Invalid trade id");
}

export function mapDatabaseTradeToTrade(
  row: DatabaseTradeRow,
  mistakes: Mistake[]
): Trade {
  const safeMistakes = Array.isArray(mistakes) ? mistakes : [];
  const { setup, management } = partitionMistakesByStage(safeMistakes);
  const target2 = parseNumNullable(row.target2);
  const t1 = parseNumNullable(row.target1_allocation_pct);
  const t2 = parseNumNullable(row.target2_allocation_pct);
  const rMultiple = parseNumNullable(row.r_multiple);
  const executionScore = parseNumNullable(row.execution_score);
  const totalScore = parseNumNullable(row.total_score);
  const exitPrice = parseNumNullable(row.exit_price);

  return {
    id: parseTradeId(row.id),
    symbol: row.symbol,
    entry: parseNum(row.entry),
    stop: parseNum(row.stop),
    target: parseNum(row.target),
    ...(target2 !== null && target2 !== undefined ? { target2 } : {}),
    ...(t1 !== null && t1 !== undefined ? { target1AllocationPct: t1 } : {}),
    ...(t2 !== null && t2 !== undefined ? { target2AllocationPct: t2 } : {}),
    size: parseNum(row.size),
    side: row.side === "Long" || row.side === "Short" ? row.side : "Long",
    status: row.status as TradeStatus,
    imbalanceQuality: row.imbalance_quality as ImbalanceQuality,
    freshness: row.freshness as Freshness,
    htfAlignment: row.htf_alignment as HTFAlignment,
    locationQuality: row.location_quality as LocationQuality,
    setupScore: parseNum(row.setup_score),
    setupGrade: row.setup_grade,
    rewardRisk: parseNum(row.reward_risk),
    ...(rMultiple !== null && rMultiple !== undefined ? { rMultiple } : {}),
    ...(executionScore !== null && executionScore !== undefined
      ? { executionScore }
      : {}),
    ...(totalScore !== null && totalScore !== undefined ? { totalScore } : {}),
    ...(row.final_grade ? { finalGrade: row.final_grade } : {}),
    mistakes: safeMistakes,
    setupMistakes: setup,
    managementMistakes: management,
    ...(row.review_completed != null
      ? { reviewCompleted: Boolean(row.review_completed) }
      : {}),
    createdAt:
      typeof row.created_at === "string" && row.created_at.length > 0
        ? row.created_at
        : new Date(0).toISOString(),
    ...(exitPrice !== null && exitPrice !== undefined ? { exitPrice } : {}),
  };
}

/** Insert payload for `public.trades` (snake_case). Omits `id` / timestamps. */
export function mapTradeToInsertPayload(userId: string, trade: Trade) {
  return {
    user_id: userId,
    symbol: trade.symbol,
    entry: trade.entry,
    stop: trade.stop,
    target: trade.target,
    target2: trade.target2 ?? null,
    target1_allocation_pct: trade.target1AllocationPct ?? null,
    target2_allocation_pct: trade.target2AllocationPct ?? null,
    size: trade.size,
    side: trade.side,
    status: trade.status,
    imbalance_quality: trade.imbalanceQuality,
    freshness: trade.freshness,
    htf_alignment: trade.htfAlignment,
    location_quality: trade.locationQuality,
    setup_score: trade.setupScore,
    setup_grade: trade.setupGrade,
    reward_risk: trade.rewardRisk,
    r_multiple: trade.rMultiple ?? null,
    execution_score: trade.executionScore ?? null,
    total_score: trade.totalScore ?? null,
    final_grade: trade.finalGrade ?? null,
    exit_price: trade.exitPrice ?? null,
    review_completed: trade.reviewCompleted ?? false,
  };
}

/** Full mutable fields for `public.trades` updates (snake_case). */
export function mapTradeToUpdatePayload(trade: Trade) {
  return {
    symbol: trade.symbol,
    entry: trade.entry,
    stop: trade.stop,
    target: trade.target,
    target2: trade.target2 ?? null,
    target1_allocation_pct: trade.target1AllocationPct ?? null,
    target2_allocation_pct: trade.target2AllocationPct ?? null,
    size: trade.size,
    side: trade.side,
    status: trade.status,
    imbalance_quality: trade.imbalanceQuality,
    freshness: trade.freshness,
    htf_alignment: trade.htfAlignment,
    location_quality: trade.locationQuality,
    setup_score: trade.setupScore,
    setup_grade: trade.setupGrade,
    reward_risk: trade.rewardRisk,
    r_multiple: trade.rMultiple ?? null,
    execution_score: trade.executionScore ?? null,
    total_score: trade.totalScore ?? null,
    final_grade: trade.finalGrade ?? null,
    exit_price: trade.exitPrice ?? null,
    review_completed: trade.reviewCompleted ?? false,
  };
}

export function mapTradeMistakesToInsertPayload(tradeId: number, mistakes: Mistake[]) {
  return mistakes.map((mistake) => ({
    trade_id: tradeId,
    mistake,
  }));
}
