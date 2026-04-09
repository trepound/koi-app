import { MISTAKE_BUCKETS } from "./mistake-penalties";
import { getCoachingForMistake } from "./mistake-coaching";
import { SETUP_MISTAKE_PENALTY_POINTS } from "./setup-mistake-penalties";
import { normalizeStageMistakes } from "./stage-mistakes";
import type { Mistake, Trade } from "./types";

export const REVIEW_TOP_MISTAKE_MAX = 3;

export type RankedMistakeForReview = {
  mistake: Mistake;
  /** Severity for ordering: setup pillar penalties vs execution bucket penalties. */
  impactScore: number;
  source: "setup" | "management" | "both";
};

export type TradeReviewSummaryModel = {
  hasMistakes: boolean;
  /** Top 2–3 by impact. */
  topMistakes: RankedMistakeForReview[];
  /** Highest-impact mistake’s coaching (Focus for Next Trade). */
  focusMistake: Mistake | null;
  focusPrimaryLine: string;
  focusKoiReflection: string;
  focusAction: string;
  positiveMessage: string;
};

const POSITIVE_MESSAGE =
  "Clean review — no mistakes tagged. Keep executing the process you planned.";

function setupImpact(m: Mistake): number {
  return SETUP_MISTAKE_PENALTY_POINTS[m] ?? 2;
}

function managementImpact(m: Mistake): number {
  return MISTAKE_BUCKETS[m]?.penalty ?? 2;
}

/**
 * Rank mistakes from setup + management by impact; dedupe with max score.
 * Works with stage arrays or legacy data via the same lists `normalizeStageMistakes` produces.
 */
export function rankMistakesForReview(
  setupMistakes: Mistake[],
  managementMistakes: Mistake[]
): RankedMistakeForReview[] {
  const map = new Map<
    Mistake,
    { setupScore: number; mgmtScore: number }
  >();

  for (const m of setupMistakes) {
    const cur = map.get(m) ?? { setupScore: 0, mgmtScore: 0 };
    cur.setupScore = Math.max(cur.setupScore, setupImpact(m));
    map.set(m, cur);
  }
  for (const m of managementMistakes) {
    const cur = map.get(m) ?? { setupScore: 0, mgmtScore: 0 };
    cur.mgmtScore = Math.max(cur.mgmtScore, managementImpact(m));
    map.set(m, cur);
  }

  const rows: RankedMistakeForReview[] = [];
  for (const [mistake, s] of map) {
    const impactScore = Math.max(s.setupScore, s.mgmtScore);
    const source: RankedMistakeForReview["source"] =
      s.setupScore > 0 && s.mgmtScore > 0
        ? "both"
        : s.setupScore > 0
          ? "setup"
          : "management";
    rows.push({ mistake, impactScore, source });
  }

  return rows.sort((a, b) => b.impactScore - a.impactScore);
}

export function rankMistakesForTrade(trade: Trade): RankedMistakeForReview[] {
  const { setup, management } = normalizeStageMistakes(trade);
  return rankMistakesForReview(setup, management);
}

/**
 * Build review summary + focus coaching from stage mistakes (use live drafts in UI).
 */
export function getTradeReviewSummaryFromStages(
  setupMistakes: Mistake[],
  managementMistakes: Mistake[]
): TradeReviewSummaryModel {
  const ranked = rankMistakesForReview(setupMistakes, managementMistakes);
  const hasMistakes = ranked.length > 0;
  const topMistakes = ranked.slice(
    0,
    Math.min(REVIEW_TOP_MISTAKE_MAX, ranked.length)
  );

  if (!hasMistakes) {
    return {
      hasMistakes: false,
      topMistakes: [],
      focusMistake: null,
      focusPrimaryLine: "",
      focusKoiReflection: "",
      focusAction: "",
      positiveMessage: POSITIVE_MESSAGE,
    };
  }

  const focusMistake = ranked[0]!.mistake;
  const coaching = getCoachingForMistake(focusMistake);

  return {
    hasMistakes: true,
    topMistakes,
    focusMistake,
    focusPrimaryLine: coaching.primaryLine,
    focusKoiReflection: coaching.koiReflection,
    focusAction: coaching.action,
    positiveMessage: POSITIVE_MESSAGE,
  };
}

export function getTradeReviewSummary(trade: Trade): TradeReviewSummaryModel {
  const { setup, management } = normalizeStageMistakes(trade);
  return getTradeReviewSummaryFromStages(setup, management);
}
