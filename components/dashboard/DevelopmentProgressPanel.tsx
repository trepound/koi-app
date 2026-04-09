"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  getDevelopmentProgress,
  TRADES_PER_ROUND,
  ROUND_COUNT,
} from "@/lib/koi/development-progress";
import type { Trade } from "@/lib/koi/types";

export function DevelopmentProgressPanel({ trades }: { trades: Trade[] }) {
  const model = useMemo(() => getDevelopmentProgress(trades), [trades]);
  /** Collapsed by default — expand manually for breakdown / milestone. */
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fillWidth = `${model.currentRoundProgressPercent}%`;

  return (
    <section style={styles.devProgressCard}>
      <div style={styles.devProgressTop}>
        <div>
          <h2 style={styles.devProgressRoundTitle}>
            Round {model.currentRound} of {ROUND_COUNT}
            <span style={{ fontWeight: 600, color: "#475467" }}>
              {" "}
              — {model.currentRoundTheme}
            </span>
          </h2>
          <p style={styles.devProgressSub}>
            Only closed trades with review completed count toward Rounds.
          </p>
          <div
            style={styles.devProgressBarTrack}
            title={`${model.tradesInCurrentRound} / ${TRADES_PER_ROUND} trades in this Round`}
          >
            <div
              style={{
                ...(styles.devProgressBarFill as CSSProperties),
                width: fillWidth,
              }}
            />
          </div>
          <p style={{ ...styles.devProgressSub, marginTop: "10px" }}>
            <strong style={{ color: "#0d1b3d" }}>
              {model.tradesInCurrentRound} / {TRADES_PER_ROUND}
            </strong>{" "}
            trades this Round
            {model.isProgramComplete ? (
              <span style={{ color: "#067647" }}> · Program Rounds complete</span>
            ) : null}
          </p>
        </div>

        <div style={styles.devProgressMetrics}>
          <div
            title="Trader level from average total score (0–100) on reviewed closes that have a score."
            style={{ cursor: "help" }}
          >
            <div style={styles.devProgressMetricLabel}>Trader level</div>
            <div style={styles.devProgressMetricValue}>
              {model.traderLevelLabel}
            </div>
            <div style={styles.devProgressMetricHint}>
              {model.professionalReadinessScore !== null
                ? `Level score ${model.professionalReadinessScore.toFixed(0)} / 100`
                : "Level score —"}
            </div>
          </div>

          <div title={model.maxAllowedRiskDetail}>
            <div style={styles.devProgressMetricLabel}>Max allowed risk</div>
            <div style={styles.devProgressMetricValue}>
              {model.professionalReadinessScore !== null &&
              model.professionalReadinessScore >= 90
                ? "1% baseline"
                : "1%"}
            </div>
            <div style={styles.devProgressMetricHint}>
              {model.maxAllowedRiskHeadline}
            </div>
          </div>
        </div>
      </div>

      <details
        style={styles.devProgressDetails}
        open={detailsOpen}
        onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
      >
        <summary
          style={styles.devProgressSummary}
          title="Round breakdown, level detail, next milestone."
        >
          Details: rounds, level, milestone
        </summary>

        <div style={styles.devProgressDetailBlock}>
          <div style={styles.devProgressDetailHeading}>Round breakdown</div>
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            {model.roundBreakdown.map((row) => (
              <li key={row.roundNumber} style={{ marginBottom: "6px" }}>
                <strong>
                  Round {row.roundNumber}: {row.theme}
                </strong>{" "}
                ({row.rangeLabel}) — {row.reviewedInRound} / {TRADES_PER_ROUND}{" "}
                reviewed
                {row.reviewedInRound >= TRADES_PER_ROUND ? (
                  <span style={{ color: "#067647" }}> · Round complete</span>
                ) : null}
              </li>
            ))}
          </ul>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#667085" }}>
            {model.completedRounds} of {ROUND_COUNT} Rounds fully complete (
            {model.completedRounds * TRADES_PER_ROUND} reviewed trades in finished
            Rounds).
          </p>
        </div>

        <div style={{ ...styles.devProgressDetailBlock, marginTop: "10px" }}>
          <div style={styles.devProgressDetailHeading}>Trader level detail</div>
          <p style={{ margin: 0 }}>
            Reviewed closed trades (counted for Rounds):{" "}
            <strong>{model.readiness.totalReviewedClosed}</strong>
          </p>
          <p style={{ margin: "8px 0 0" }}>
            Trades with a total score in that set:{" "}
            <strong>{model.readiness.tradeCountWithScore}</strong>
            {model.readiness.tradeCountWithScore === 0 ? (
              <span style={{ color: "#667085" }}>
                {" "}
                — close trades and save scores to set level.
              </span>
            ) : (
              <>
                {" "}
                · Average level score:{" "}
                <strong>
                  {model.readiness.averageTotalScore !== null
                    ? model.readiness.averageTotalScore.toFixed(1)
                    : "—"}
                </strong>
              </>
            )}
          </p>
          <p style={{ margin: "8px 0 0" }}>
            Levels: 90+ Pro Level · 80–89 Consistent · 70–79 Developing · below
            70 Foundation.
          </p>
        </div>

        <div style={{ ...styles.devProgressDetailBlock, marginTop: "10px" }}>
          <div style={styles.devProgressDetailHeading}>Next milestone</div>
          <p style={{ margin: 0 }}>{model.nextMilestoneMessage}</p>
          <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#667085" }}>
            {model.maxAllowedRiskDetail}
          </p>
        </div>
      </details>
    </section>
  );
}
