/** Domain + UI types for KOI dashboard. Phase 3+: sync with API / DB schemas. */

export type Mistake =
  | "Early Entry"
  | "Chased Price"
  | "Oversized"
  | "Emotional"
  | "Ignored Zone"
  | "Countertrend Force"
  | "Moved Stop"
  | "Cut Early";

export type TradeStatus = "PLANNED" | "PENDING" | "ACTIVE" | "CLOSED" | "MISSED";

export type ImbalanceQuality = "Strong" | "Medium" | "Weak";
export type Freshness = "Fresh" | "Tested Once" | "Tested Multiple";
export type HTFAlignment = "Fully Aligned" | "Partial" | "Countertrend";
export type LocationQuality = "Excellent" | "Good" | "Average" | "Poor";

export type KoiTrend = "" | "Uptrend" | "Downtrend" | "Sideways";
export type KoiHTFLocation = "" | "Wholesale" | "Retail" | "Middle";
export type KoiZoneSide = "" | "Demand" | "Supply";
export type KoiPatternStage = "" | "Confirmation" | "Falling Knife" | "Fading Rally";
export type KoiImbalance = "" | "Strong" | "Medium" | "Weak";
export type KoiTimeAtZone = "" | "1-3 candles" | "4-6 candles" | "6+ candles";
export type KoiGrade = "A+" | "A" | "B+" | "B" | "C" | "D/F";

export type KoiTrendRelation = "With Trend" | "Sideways" | "Against Trend";

export type Trade = {
  id: number;
  symbol: string;
  entry: number;
  stop: number;
  target: number;
  target2?: number;
  target1AllocationPct?: number;
  target2AllocationPct?: number;
  size: number;
  side: "Long" | "Short";
  status: TradeStatus;

  imbalanceQuality: ImbalanceQuality;
  freshness: Freshness;
  htfAlignment: HTFAlignment;
  locationQuality: LocationQuality;

  setupScore: number;
  setupGrade: string;

  rewardRisk: number;
  rMultiple?: number;

  executionScore?: number;
  totalScore?: number;
  finalGrade?: string;

  mistakes: Mistake[];

  createdAt: string;
  exitPrice?: number;
};

/** ODE breakdown row: null = not yet applicable (progressive scoring). */
export type KoiEvalParts = {
  trend: number | null;
  htfLocation: number | null;
  patternStage: number | null;
  imbalance: number | null;
  timeAtZone: number | null;
  rewardRisk: number | null;
  rewardRiskPts: number | null;
};

export type KoiEvalResult = {
  isComplete: boolean;
  step0Pass: boolean;
  tradeAllowed: boolean;
  step0Reason: string;
  step0Checks: {
    middleSidewaysFail: boolean;
    middleDirectionalAllowed: boolean;
    edgeLocationsAllowed: boolean;
  };
  recommendedAction: string;
  averageRewardRisk: number | undefined;
  setupScore: number;
  rewardRiskPoints: number | undefined;
  totalScore: number;
  grade: KoiGrade | undefined;
  setupQuality: string | undefined;
  parts: KoiEvalParts;
};

export type KoiTradeDecisionDisplay = {
  text: string;
  color: string;
};

export type KoiDisplayModel = {
  totalScore: number | string;
  grade: string;
  setupQuality: string;
  tradeDecision: KoiTradeDecisionDisplay;
  scorePartialHint: boolean;
};

export type GradeVisualStyle = {
  color: string;
  fontWeight: number;
  opacity: number;
  boxShadow: string;
  borderColor: string;
};
