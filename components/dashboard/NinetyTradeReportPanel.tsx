"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  buildNinetyTradeReport,
  NINETY_TRADE_REPORT_COUNT,
} from "@/lib/koi/ninety-trade-report";
import type { Trade } from "@/lib/koi/types";

function stat(label: string, value: string) {
  return (
    <div style={styles.thirtyReportStat as CSSProperties}>
      <div style={styles.thirtyReportStatLabel as CSSProperties}>{label}</div>
      <div style={styles.thirtyReportStatValue as CSSProperties}>{value}</div>
    </div>
  );
}

export function NinetyTradeReportPanel({ trades }: { trades: Trade[] }) {
  const model = useMemo(() => buildNinetyTradeReport(trades), [trades]);

  if (!model) return null;

  return (
    <section
      style={styles.thirtyReportCard}
      aria-label="90 trade evaluation report"
    >
      <h2 style={styles.thirtyReportTitle}>90 Trade Evaluation</h2>
      <p style={styles.thirtyReportSub}>
        First {NINETY_TRADE_REPORT_COUNT} reviewed closed trades, oldest first
        — stable milestone.
      </p>

      <div
        style={{
          ...(styles.thirtyReportCoachBlock as CSSProperties),
          marginBottom: 14,
        }}
      >
        <div style={styles.thirtyReportStatLabel as CSSProperties}>
          Discipline Verdict
        </div>
        <p style={{ margin: "8px 0 0", fontWeight: 800, fontSize: 16 }}>
          {model.disciplineVerdict}
        </p>
      </div>

      <div style={styles.thirtyReportGrid as CSSProperties}>
        {stat("Trader level", model.traderLevel)}
        {stat(
          "Avg total score",
          model.avgTotalScore !== null
            ? `${model.avgTotalScore.toFixed(1)} / 100`
            : "—"
        )}
        {stat("Avg setup score", `${model.avgSetupScore.toFixed(1)} / 50`)}
        {stat(
          "Avg execution",
          model.avgExecutionScore !== null
            ? `${model.avgExecutionScore.toFixed(1)} / 50`
            : "—"
        )}
        {stat("Discipline score", `${model.disciplineScorePct.toFixed(0)}%`)}
        {stat("Avg R", model.avgR !== null ? `${model.avgR.toFixed(2)}R` : "—")}
        {stat(
          "Win rate (R)",
          model.winRatePct !== null
            ? `${model.winRatePct.toFixed(0)}% (${model.winCount}/${model.rSampleCount})`
            : "—"
        )}
        {stat("Consistency judgment", model.consistencyJudgment)}
      </div>

      <div style={styles.thirtyReportSectionTitle as CSSProperties}>
        Risk eligibility
      </div>
      <p style={{ margin: 0, fontWeight: 700, color: "#0d1b3d" }}>
        {model.riskEligibilityHeadline}
      </p>
      <p style={{ ...styles.small, margin: "6px 0 0" }}>
        {model.riskEligibilityDetail}
      </p>

      <div style={styles.thirtyReportSectionTitle as CSSProperties}>
        Mistake analysis
      </div>
      {model.topMistakes.length ? (
        <ul style={styles.thirtyReportList as CSSProperties}>
          {model.topMistakes.map((row, i) => (
            <li key={row.mistake}>
              <strong>{row.mistake}</strong> — {row.count}× across 90
              {i === 0 ? (
                <span style={{ color: "#667085" }}> (primary leak)</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...styles.small, margin: 0 }}>
          No mistake tags in these {NINETY_TRADE_REPORT_COUNT} reviews.
        </p>
      )}

      <details style={styles.thirtyReportDetails as CSSProperties}>
        <summary style={styles.thirtyReportSummary as CSSProperties}>
          Final coaching — Top Discipline Leak, Recommended Action, summary
        </summary>

        <div style={styles.thirtyReportCoachBlock as CSSProperties}>
          <div style={styles.thirtyReportStatLabel as CSSProperties}>
            Top Discipline Leak
          </div>
          <p style={{ margin: "6px 0 12px", fontWeight: 700 }}>
            {model.topDisciplineLeak}
          </p>
          <div style={styles.thirtyReportStatLabel as CSSProperties}>
            Recommended Action
          </div>
          <p style={{ margin: "6px 0 12px", fontWeight: 700 }}>
            {model.recommendedAction}
          </p>
          <div style={styles.thirtyReportStatLabel as CSSProperties}>Summary</div>
          <p style={{ margin: "6px 0 0" }}>{model.summaryParagraph}</p>
        </div>
      </details>
    </section>
  );
}
