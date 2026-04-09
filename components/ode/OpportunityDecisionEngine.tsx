"use client";

import type { CSSProperties } from "react";
import {
  KOI_FIELD_HELP,
  koiControlRightPad,
  koiSelectRightPad,
} from "@/lib/koi/constants";
import { dashboardStyles } from "@/lib/koi/dashboard-styles";
import { odeStyles as koiStyles } from "@/lib/koi/dashboard-styles";
import type {
  Freshness,
  GradeVisualStyle,
  ImbalanceQuality,
  KoiDisplayModel,
  KoiEvalResult,
  KoiHTFLocation,
  KoiImbalance,
  KoiPatternStage,
  KoiTimeAtZone,
  KoiTrend,
  KoiZoneSide,
} from "@/lib/koi/types";
import { KoiInputHelp } from "./KoiInputHelp";

export type OpportunityDecisionEngineProps = {
  koiEval: KoiEvalResult;
  koiDisplay: KoiDisplayModel;
  gradeVisual: GradeVisualStyle;
  koiTrend: KoiTrend;
  setKoiTrend: (v: KoiTrend) => void;
  koiHTFLocation: KoiHTFLocation;
  setKoiHTFLocation: (v: KoiHTFLocation) => void;
  koiZoneSide: KoiZoneSide;
  setKoiZoneSide: (v: KoiZoneSide) => void;
  koiPatternStage: KoiPatternStage;
  setKoiPatternStage: (v: KoiPatternStage) => void;
  koiImbalance: KoiImbalance;
  setKoiImbalance: (v: KoiImbalance) => void;
  setImbalanceQuality: (v: ImbalanceQuality) => void;
  freshness: "" | Freshness;
  setFreshness: (v: "" | Freshness) => void;
  koiTimeAtZone: KoiTimeAtZone;
  setKoiTimeAtZone: (v: KoiTimeAtZone) => void;
  entry: string;
  setEntry: (v: string) => void;
  stop: string;
  setStop: (v: string) => void;
  target: string;
  setTarget: (v: string) => void;
  target2: string;
  setTarget2: (v: string) => void;
};

const badgeStyle = dashboardStyles.badge as CSSProperties;
const ODE_SCORE_COLORS = {
  strong: "#6ee7b7",
  developing: "#f5d26a",
  weak: "#f39a9a",
  neutral: "#e7f0ff",
} as const;

function isFiniteScore(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatScoreFraction(
  value: number | null | undefined,
  max: number,
): string {
  if (!isFiniteScore(value)) return "—";
  return `${value} / ${max}`;
}

function scoreTextColor(value: number | null | undefined, max: number): string {
  if (!isFiniteScore(value) || max <= 0) return ODE_SCORE_COLORS.neutral;
  const ratio = value / max;
  if (ratio >= 0.9) return ODE_SCORE_COLORS.strong;
  if (ratio >= 0.7) return ODE_SCORE_COLORS.developing;
  return ODE_SCORE_COLORS.weak;
}

function normalizedTotalScore(value: number, isComplete: boolean): number | null {
  // Preserve existing UI behavior: keep total score blank until scoring has started.
  if (!isComplete && value === 0) return null;
  return value;
}

function getCoachGuidance(totalScore: number | null): string {
  if (!isFiniteScore(totalScore)) return "Complete inputs to get coaching guidance.";
  if (totalScore >= 90) {
    return "High-quality opportunity. Structure and context aligned.";
  }
  if (totalScore >= 80) {
    return "Strong setup. Acceptable conditions.";
  }
  if (totalScore >= 70) {
    return "Valid setup. Consider reduced risk.";
  }
  if (totalScore >= 60) {
    return "Moderate setup. Wait or reduce risk.";
  }
  return "Low-quality setup. Avoid trade.";
}

export function OpportunityDecisionEngine({
  koiEval,
  koiDisplay,
  gradeVisual,
  koiTrend,
  setKoiTrend,
  koiHTFLocation,
  setKoiHTFLocation,
  koiZoneSide,
  setKoiZoneSide,
  koiPatternStage,
  setKoiPatternStage,
  koiImbalance,
  setKoiImbalance,
  setImbalanceQuality,
  freshness,
  setFreshness,
  koiTimeAtZone,
  setKoiTimeAtZone,
  entry,
  setEntry,
  stop,
  setStop,
  target,
  setTarget,
  target2,
  setTarget2,
}: OpportunityDecisionEngineProps) {
  const totalScoreForDisplay = normalizedTotalScore(
    koiEval.totalScore,
    koiEval.isComplete,
  );
  const structureScoreForDisplay =
    (koiEval.parts.imbalance ?? 0) +
    (koiEval.parts.timeAtZone ?? 0) +
    (koiEval.parts.freshness ?? 0);
  const contextScoreForDisplay =
    (koiEval.parts.trend ?? 0) + (koiEval.parts.htfLocation ?? 0);
  const coachComponentScores = [
    { label: "Trend", value: koiEval.parts.trend, max: 20 },
    { label: "Location", value: koiEval.parts.htfLocation, max: 10 },
    { label: "Imbalance strength", value: koiEval.parts.imbalance, max: 20 },
    { label: "Time at Zone", value: koiEval.parts.timeAtZone, max: 10 },
    { label: "Freshness", value: koiEval.parts.freshness, max: 20 },
    { label: "Profit Margin", value: koiEval.rewardRiskPoints, max: 20 },
  ].filter((item) => isFiniteScore(item.value));
  const strengths = [...coachComponentScores]
    .sort((a, b) => (b.value as number) / b.max - (a.value as number) / a.max)
    .slice(0, 3);
  const weaknesses = [...coachComponentScores]
    .sort((a, b) => (a.value as number) / a.max - (b.value as number) / b.max)
    .slice(0, 3);
  const coachGuidance = getCoachGuidance(totalScoreForDisplay);

  return (
    <div style={koiStyles.card}>
      <div style={koiStyles.panelHeader}>
        <div>
          <div style={koiStyles.title}>Opportunity Decision Engine</div>
          <div style={koiStyles.subtitle}>
            KOI scoring inputs with live system output.
          </div>
        </div>
        <div>
          <span
            style={
              !koiEval.isComplete
                ? badgeStyle
                : koiEval.tradeAllowed
                  ? koiStyles.badgePass
                  : koiStyles.badgeFail
            }
          >
            {!koiEval.isComplete
              ? "Pending"
              : koiEval.tradeAllowed
                ? "PASS"
                : "No Trade"}
          </span>
        </div>
      </div>

      <div style={koiStyles.outputPanel}>
        <div style={koiStyles.outputLabel}>System Output</div>
        <div style={koiStyles.outputMeta}>
          <span style={koiStyles.liveDot} />
          Live status
        </div>
        <div style={koiStyles.resultGrid}>
          <div style={koiStyles.resultCard}>
            <div style={koiStyles.resultLabel}>Opportunity Score</div>
            <div
              style={{
                ...koiStyles.resultValue,
                color: scoreTextColor(totalScoreForDisplay, 100),
              }}
            >
              {formatScoreFraction(totalScoreForDisplay, 100)}
              {isFiniteScore(totalScoreForDisplay) ? (
                <span style={{ ...koiStyles.subtitle, display: "block", marginTop: "4px" }}>
                  max 100
                  {koiDisplay.scorePartialHint ? " · partial" : ""}
                </span>
              ) : null}
            </div>
          </div>
          <div style={koiStyles.resultCard}>
            <div style={koiStyles.resultLabel}>Reward:Risk (T2)</div>
            <div style={koiStyles.resultValue}>
              {koiEval.averageRewardRisk !== undefined &&
              koiEval.averageRewardRisk !== null ? (
                <>
                  {koiEval.averageRewardRisk.toFixed(2)}:1
                  <span
                    style={{
                      ...koiStyles.subtitle,
                      display: "block",
                      marginTop: "4px",
                      fontSize: "11px",
                    }}
                  >
                    |Entry − Stop| risk · |T2 − Entry| reward
                  </span>
                </>
              ) : (
                <span style={{ ...koiStyles.subtitle, fontSize: "18px" }}>—</span>
              )}
            </div>
          </div>
          <div
            style={{
              ...koiStyles.resultCard,
              borderColor: gradeVisual.borderColor,
              boxShadow: gradeVisual.boxShadow,
              opacity: gradeVisual.opacity,
            }}
          >
            <div style={koiStyles.resultLabel}>Opportunity Grade</div>
            <div
              style={{
                ...koiStyles.resultValue,
                color: gradeVisual.color,
                fontWeight: gradeVisual.fontWeight,
              }}
            >
              {koiDisplay.grade}
            </div>
          </div>
          <div style={koiStyles.resultCard}>
            <div style={koiStyles.resultLabel}>Opportunity Quality</div>
            <div style={{ ...koiStyles.resultValue, fontSize: "18px" }}>
              {koiDisplay.setupQuality}
            </div>
          </div>
          <div style={koiStyles.resultCard}>
            <div style={koiStyles.resultLabel}>Opportunity Decision</div>
            <div
              style={{
                ...koiStyles.actionValue,
                color: koiDisplay.tradeDecision.color,
              }}
            >
              {koiDisplay.tradeDecision.text}
            </div>
          </div>
        </div>
      </div>

      <div style={koiStyles.formGrid}>
        <label style={koiStyles.field}>
          <span style={koiStyles.label}>ENTRY ZONE</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.entryZone}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiZoneSide}
              onChange={(e) => setKoiZoneSide(e.target.value as KoiZoneSide)}
            >
              <option value="">Select</option>
              <option>Demand</option>
              <option>Supply</option>
            </select>
          </KoiInputHelp>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>ZONE LOCATION</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.zoneLocation}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiHTFLocation}
              onChange={(e) =>
                setKoiHTFLocation(e.target.value as KoiHTFLocation)
              }
            >
              <option value="">Select</option>
              <option>Wholesale</option>
              <option>Retail</option>
              <option>Middle</option>
            </select>
          </KoiInputHelp>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>WHAT IS THE TREND?</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.trend}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiTrend}
              onChange={(e) => setKoiTrend(e.target.value as KoiTrend)}
            >
              <option value="">Select</option>
              <option>Uptrend</option>
              <option>Downtrend</option>
              <option>Sideways</option>
            </select>
          </KoiInputHelp>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>PATTERN / STAGE</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.patternStage}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiPatternStage}
              onChange={(e) =>
                setKoiPatternStage(e.target.value as KoiPatternStage)
              }
            >
              <option value="">Select</option>
              <option>Confirmation</option>
              <option>Falling Knife</option>
              <option>Fading Rally</option>
            </select>
          </KoiInputHelp>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>IMBALANCE STRENGTH</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.imbalance}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiImbalance}
              onChange={(e) => {
                const value = e.target.value as KoiImbalance;
                setKoiImbalance(value);
                if (
                  value === "Strong" ||
                  value === "Medium" ||
                  value === "Weak"
                ) {
                  setImbalanceQuality(value as ImbalanceQuality);
                }
              }}
            >
              <option value="">Select</option>
              <option>Strong</option>
              <option>Medium</option>
              <option>Weak</option>
            </select>
          </KoiInputHelp>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>FRESH</span>
          <select
            style={koiStyles.select}
            value={freshness}
            onChange={(e) => {
              const v = e.target.value;
              setFreshness(v === "" ? "" : (v as Freshness));
            }}
          >
            <option value="">Select</option>
            <option value="Fresh">Fresh</option>
            <option>Tested Once</option>
            <option>Tested Multiple</option>
          </select>
        </label>

        <label style={koiStyles.field}>
          <span style={koiStyles.label}>TIME AT ZONE</span>
          <KoiInputHelp variant="select" helpText={KOI_FIELD_HELP.timeAtZone}>
            <select
              style={{
                ...koiStyles.select,
                width: "100%",
                boxSizing: "border-box",
                paddingRight: koiSelectRightPad,
              }}
              value={koiTimeAtZone}
              onChange={(e) =>
                setKoiTimeAtZone(e.target.value as KoiTimeAtZone)
              }
            >
              <option value="">Select</option>
              <option>1-3 candles</option>
              <option>4-6 candles</option>
              <option>6+ candles</option>
            </select>
          </KoiInputHelp>
        </label>
      </div>

      <div style={koiStyles.priceRow}>
        <label style={koiStyles.priceField}>
          <span style={koiStyles.label}>ENTRY PRICE</span>
          <KoiInputHelp helpText={KOI_FIELD_HELP.entryPrice}>
            <input
              style={{
                ...koiStyles.priceInput,
                paddingRight: koiControlRightPad,
              }}
              inputMode="decimal"
              placeholder="Select"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </KoiInputHelp>
        </label>
        <label style={koiStyles.priceField}>
          <span style={koiStyles.label}>STOP PRICE</span>
          <KoiInputHelp helpText={KOI_FIELD_HELP.stopPrice}>
            <input
              style={{
                ...koiStyles.priceInput,
                paddingRight: koiControlRightPad,
              }}
              inputMode="decimal"
              placeholder="Select"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
            />
          </KoiInputHelp>
        </label>
        <label style={koiStyles.priceField}>
          <span style={koiStyles.label}>TARGET PRICE 1</span>
          <KoiInputHelp helpText={KOI_FIELD_HELP.target1}>
            <input
              style={{
                ...koiStyles.priceInput,
                paddingRight: koiControlRightPad,
              }}
              inputMode="decimal"
              placeholder="Select"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </KoiInputHelp>
        </label>
        <label style={koiStyles.priceField}>
          <span style={koiStyles.label}>TARGET PRICE 2</span>
          <KoiInputHelp helpText={KOI_FIELD_HELP.target2}>
            <input
              style={{
                ...koiStyles.priceInput,
                paddingRight: koiControlRightPad,
              }}
              inputMode="decimal"
              placeholder="Select"
              value={target2}
              onChange={(e) => setTarget2(e.target.value)}
            />
          </KoiInputHelp>
        </label>
      </div>

      {koiEval.parts ? (
        <div>
          <div style={koiStyles.scoreBreakdown}>
            <div style={koiStyles.breakdownTitle}>Score breakdown</div>
            <div style={koiStyles.breakdownRow}>
              <span>Structure score</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(structureScoreForDisplay, 50),
                }}
              >
                {formatScoreFraction(structureScoreForDisplay, 50)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Trend</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.parts.trend, 20),
                }}
              >
                {formatScoreFraction(koiEval.parts.trend, 20)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Location</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.parts.htfLocation, 10),
                }}
              >
                {formatScoreFraction(koiEval.parts.htfLocation, 10)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Imbalance strength</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.parts.imbalance, 20),
                }}
              >
                {formatScoreFraction(koiEval.parts.imbalance, 20)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Time at Zone</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.parts.timeAtZone, 10),
                }}
              >
                {formatScoreFraction(koiEval.parts.timeAtZone, 10)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Freshness</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.parts.freshness, 20),
                }}
              >
                {formatScoreFraction(koiEval.parts.freshness, 20)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Context score</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(contextScoreForDisplay, 50),
                }}
              >
                {formatScoreFraction(contextScoreForDisplay, 50)}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>R:R (Target 2)</span>
              <span style={koiStyles.breakdownPts}>
                {koiEval.parts.rewardRisk === null ||
                koiEval.parts.rewardRisk === undefined
                  ? "—"
                  : `${koiEval.parts.rewardRisk.toFixed(2)}:1`}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Profit Margin score (max 20)</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(koiEval.rewardRiskPoints, 20),
                }}
              >
                {formatScoreFraction(koiEval.rewardRiskPoints, 20)}
              </span>
            </div>
            <div style={{ ...koiStyles.breakdownRow, ...koiStyles.breakdownRowLast }}>
              <span>Final opportunity (max 100)</span>
              <span
                style={{
                  ...koiStyles.breakdownPts,
                  color: scoreTextColor(totalScoreForDisplay, 100),
                }}
              >
                {formatScoreFraction(totalScoreForDisplay, 100)}
              </span>
            </div>
          </div>

          <div style={koiStyles.scoreBreakdown}>
            <div style={koiStyles.breakdownTitle}>Trade Coach</div>
            <div style={koiStyles.breakdownRow}>
              <span>Strengths</span>
              <span style={koiStyles.breakdownPts}>
                {strengths.length > 0
                  ? strengths.map((item) => item.label).join(", ")
                  : "—"}
              </span>
            </div>
            <div style={koiStyles.breakdownRow}>
              <span>Weaknesses</span>
              <span style={koiStyles.breakdownPts}>
                {weaknesses.length > 0
                  ? weaknesses.map((item) => item.label).join(", ")
                  : "—"}
              </span>
            </div>
            <div style={{ ...koiStyles.breakdownRow, ...koiStyles.breakdownRowLast }}>
              <span>Guidance</span>
              <span style={{ ...koiStyles.breakdownPts, maxWidth: "70%", textAlign: "right" }}>
                {coachGuidance}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {koiEval.isComplete && !koiEval.tradeAllowed && (
        <div style={koiStyles.noTradeBanner}>No Trade</div>
      )}
    </div>
  );
}
