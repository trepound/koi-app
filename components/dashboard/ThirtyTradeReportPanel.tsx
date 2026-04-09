"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  buildThirtyTradeReport,
  THIRTY_TRADE_REPORT_COUNT,
} from "@/lib/koi/thirty-trade-report";
import type { Trade } from "@/lib/koi/types";

function stat(label: string, value: string) {
  return (
    <div style={styles.thirtyReportStat as CSSProperties}>
      <div style={styles.thirtyReportStatLabel as CSSProperties}>{label}</div>
      <div style={styles.thirtyReportStatValue as CSSProperties}>{value}</div>
    </div>
  );
}

export function ThirtyTradeReportPanel({ trades }: { trades: Trade[] }) {
  const model = useMemo(() => buildThirtyTradeReport(trades), [trades]);
  const [open, setOpen] = useState(false);

  if (!model) return null;

  return (
    <section style={styles.thirtyReportCard} aria-label="30 trade milestone report">
      <h2 style={styles.thirtyReportTitle}>30 Trade Report Card</h2>
      <p style={styles.thirtyReportSub}>
        First {THIRTY_TRADE_REPORT_COUNT} reviewed closed trades, oldest first.
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
        {stat(
          "Discipline score",
          `${model.disciplineScorePct.toFixed(0)}%`
        )}
        {stat(
          "Avg R",
          model.avgR !== null ? `${model.avgR.toFixed(2)}R` : "—"
        )}
        {stat(
          "Win rate (R)",
          model.winRatePct !== null
            ? `${model.winRatePct.toFixed(0)}% (${model.winCount}/${model.rSampleCount})`
            : "—"
        )}
      </div>

      <div style={styles.thirtyReportSectionTitle as CSSProperties}>
        Mistake analysis
      </div>
      {model.topMistakes.length ? (
        <ul style={styles.thirtyReportList as CSSProperties}>
          {model.topMistakes.map((row) => (
            <li key={row.mistake}>
              <strong>{row.mistake}</strong> — {row.count}× in this window
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...styles.small, margin: 0 }}>
          No mistake tags in these {THIRTY_TRADE_REPORT_COUNT} reviews.
        </p>
      )}

      <details
        style={styles.thirtyReportDetails as CSSProperties}
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary style={styles.thirtyReportSummary as CSSProperties}>
          Coaching — leak, action, written summary
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
          <div style={styles.thirtyReportStatLabel as CSSProperties}>
            Summary
          </div>
          <p style={{ margin: "6px 0 0" }}>{model.summaryParagraph}</p>
        </div>
      </details>
    </section>
  );
}
