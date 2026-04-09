/** Domain + UI types for KOI dashboard. Phase 3+: sync with API / DB schemas. */

export type Mistake =
  | "Early Entry"
  | "Chased Price"
  | "Oversized"
  | "Undersized Position"
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

/** Stored on `profiles.role` — extend for coach/admin dashboards in a later phase. */
export type UserRole = "student" | "coach" | "admin";

/** Row shape from `public.profiles` (snake_case). */
export type DatabaseProfileRow = {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
};

/** Row shape from `public.trades` (snake_case). */
export type DatabaseTradeRow = {
  id: number | string;
  user_id: string;
  symbol: string;
  entry: number | string;
  stop: number | string;
  target: number | string;
  target2: number | string | null;
  target1_allocation_pct: number | string | null;
  target2_allocation_pct: number | string | null;
  size: number | string;
  side: string;
  status: string;
  imbalance_quality: string;
  freshness: string;
  htf_alignment: string;
  location_quality: string;
  setup_score: number | string;
  setup_grade: string;
  reward_risk: number | string;
  r_multiple: number | string | null;
  execution_score: number | string | null;
  total_score: number | string | null;
  final_grade: string | null;
  exit_price: number | string | null;
  /** Run `supabase/schema.sql` migration if column missing. */
  review_completed?: boolean | null;
  created_at: string;
  updated_at: string;
};

/** Row shape from `public.trade_mistakes` (snake_case). */
export type DatabaseTradeMistakeRow = {
  id: number | string;
  trade_id: number | string;
  mistake: string;
  created_at: string;
};

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

  /**
   * Aggregate mistakes (still what `trade_mistakes` in the DB round-trips today).
   * When `setupMistakes` / `managementMistakes` are populated, callers may derive
   * execution scoring from their union until persistence is split.
   */
  mistakes: Mistake[];
  /** Setup-phase mistakes (before / at entry). Optional until UI + DB support. */
  setupMistakes?: Mistake[];
  /** Management-phase mistakes (while trade is live). Optional until UI + DB support. */
  managementMistakes?: Mistake[];
  /** User completed structured trade review (lifecycle “Review” stage). */
  reviewCompleted?: boolean;

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
