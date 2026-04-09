"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  buildSixtyTradeReport,
  SIXTY_TRADE_REPORT_COUNT,
  type MetricTrend,
} from "@/lib/koi/sixty-trade-report";
import type { Trade } from "@/lib/koi/types";

function stat(label: string, value: string) {
  return (
    <div style={styles.thirtyReportStat as CSSProperties}>
      <div style={styles.thirtyReportStatLabel as CSSProperties}>{label}</div>
      <div style={styles.thirtyReportStatValue as CSSProperties}>{value}</div>
    </div>
  );
}

function trendLabel(t: MetricTrend): { symbol: string; title: string } {
  if (t === "up") return { symbol: "↑", title: "Up vs first 30" };
  if (t === "down") return { symbol: "↓", title: "Down vs first 30" };
  return { symbol: "→", title: "Flat vs first 30" };
}

export function SixtyTradeReportPanel({ trades }: { trades: Trade[] }) {
  const model = useMemo(() => buildSixtyTradeReport(trades), [trades]);
  const [open, setOpen] = useState(false);

  if (!model) return null;

  const trendNote =
    model.topMistakeFrequencyTrend === "decreasing"
      ? "decreasing"
      : model.topMistakeFrequencyTrend === "increasing"
        ? "increasing"
        : model.topMistakeFrequencyTrend === "unchanged"
          ? "unchanged"
          : null;

  return (
    <section
      style={styles.thirtyReportCard}
      aria-label="60 trade consistency report"
    >
      <h2 style={styles.thirtyReportTitle}>60 Trade Consistency Report</h2>
      <p style={styles.thirtyReportSub}>
        First {SIXTY_TRADE_REPORT_COUNT} reviewed closed trades, oldest first —
        stable milestone, not a rolling window.
      </p>

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
        {stat("Consistency signal", model.consistencySignal)}
      </div>

      <div style={styles.thirtyReportSectionTitle as CSSProperties}>
        First 30 vs second 30
      </div>
      <table style={styles.sixtyReportCompareTable as CSSProperties}>
        <thead>
          <tr>
            <th style={styles.sixtyReportCompareTh as CSSProperties}>Metric</th>
            <th style={styles.sixtyReportCompareTh as CSSProperties}>
              First 30
            </th>
            <th style={styles.sixtyReportCompareTh as CSSProperties}>
              Second 30
            </th>
            <th style={styles.sixtyReportCompareTh as CSSProperties}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {model.comparisonRows.map((row) => {
            const { symbol, title } = trendLabel(row.trend);
            return (
              <tr key={row.label}>
                <td style={styles.sixtyReportCompareTd as CSSProperties}>
                  {row.label}
                </td>
                <td style={styles.sixtyReportCompareTd as CSSProperties}>
                  {row.first30Display}
                </td>
                <td style={styles.sixtyReportCompareTd as CSSProperties}>
                  {row.second30Display}
                </td>
                <td
                  style={styles.sixtyReportCompareTd as CSSProperties}
                  title={title}
                >
                  {symbol}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={styles.thirtyReportSectionTitle as CSSProperties}>
        Mistake analysis
      </div>
      {model.topMistakes.length ? (
        <>
          <ul style={styles.thirtyReportList as CSSProperties}>
            {model.topMistakes.map((row) => (
              <li key={row.mistake}>
                <strong>{row.mistake}</strong> — {row.count}× across 60
              </li>
            ))}
          </ul>
          {trendNote ? (
            <p style={{ ...styles.small, margin: "8px 0 0" }}>
              Top repeated tag vs first 30: frequency is{" "}
              <strong>{trendNote}</strong> in the second 30.
            </p>
          ) : null}
        </>
      ) : (
        <p style={{ ...styles.small, margin: 0 }}>
          No mistake tags in these {SIXTY_TRADE_REPORT_COUNT} reviews.
        </p>
      )}

      <details
        style={styles.thirtyReportDetails as CSSProperties}
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary style={styles.thirtyReportSummary as CSSProperties}>
          Coaching — Top Discipline Leak, Recommended Action, summary
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
