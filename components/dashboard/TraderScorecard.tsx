"use client";

import type { CSSProperties } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";

export type TraderScorecardProps = {
  avgR: number;
  avgRewardRisk: number;
  avgSetupScore: number;
  avgExecutionScore: number;
  avgTotalScore: number;
  disciplineScore: number;
  plannedCount: number;
  pendingCount: number;
  activeCount: number;
  closedCount: number;
  missedCount: number;
};

export function TraderScorecard({
  avgR,
  avgRewardRisk,
  avgSetupScore,
  avgExecutionScore,
  avgTotalScore,
  disciplineScore,
  plannedCount,
  pendingCount,
  activeCount,
  closedCount,
  missedCount,
}: TraderScorecardProps) {
  const card = styles.card as CSSProperties;
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>Trader Scorecard</h2>
      <p style={{ ...styles.small, margin: "0 0 12px" }}>
        Top performance metrics across setup quality, execution, discipline, and
        trade counts.
      </p>
      <div style={styles.kpiGrid}>
        <div style={card}>
          <div style={styles.kpiLabel}>Avg R</div>
          <div style={styles.kpiValue}>{avgR.toFixed(2)}R</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Avg Weighted R:R</div>
          <div style={styles.kpiValue}>{avgRewardRisk.toFixed(2)}:1</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Avg Setup Score</div>
          <div style={styles.kpiValue}>{avgSetupScore.toFixed(0)} / 45</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Avg Execution Score</div>
          <div style={styles.kpiValue}>{avgExecutionScore.toFixed(0)} / 55</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Avg Total Score</div>
          <div style={styles.kpiValue}>{avgTotalScore.toFixed(0)} / 100</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Discipline Score</div>
          <div style={styles.kpiValue}>{disciplineScore.toFixed(0)}%</div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Planned / Pending / Active</div>
          <div style={styles.kpiValue}>
            {plannedCount}/{pendingCount}/{activeCount}
          </div>
        </div>
        <div style={card}>
          <div style={styles.kpiLabel}>Closed / Missed</div>
          <div style={styles.kpiValue}>
            {closedCount}/{missedCount}
          </div>
        </div>
      </div>
    </div>
  );
}
