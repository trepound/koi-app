"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  DISCIPLINE_ENGINE_RECENT_REVIEWED,
  evaluateDisciplineEngine,
  type TradingState,
} from "@/lib/koi/discipline-engine";
import type { Trade } from "@/lib/koi/types";

function stateValueStyle(state: TradingState): CSSProperties {
  const base = styles.focusForTodayValue as CSSProperties;
  const tint =
    state === "Locked In"
      ? styles.focusForTodayStateLocked
      : state === "On Track"
        ? styles.focusForTodayStateOn
        : state === "Off Track"
          ? styles.focusForTodayStateOff
          : styles.focusForTodayStateBasics;
  return { ...base, ...(tint as CSSProperties) };
}

export function FocusForTodayPanel({ trades }: { trades: Trade[] }) {
  const out = useMemo(() => evaluateDisciplineEngine(trades), [trades]);

  return (
    <section style={styles.focusForTodayCard}>
      <h2 style={styles.focusForTodayTitle}>Focus for Today</h2>
      <p style={{ ...styles.small, margin: "0 0 14px" }}>
        Last {DISCIPLINE_ENGINE_RECENT_REVIEWED} reviewed closes.
      </p>

      <div style={styles.focusForTodayRow}>
        <div style={styles.focusForTodayLabel}>Trading State</div>
        <div style={stateValueStyle(out.tradingState)}>{out.tradingState}</div>
      </div>

      <div style={styles.focusForTodayRow}>
        <div style={styles.focusForTodayLabel}>Top Discipline Leak</div>
        <div style={styles.focusForTodayValue}>
          {out.topDisciplineLeak ?? "None flagged"}
        </div>
      </div>

      <div style={styles.focusForTodayRowLast}>
        <div style={styles.focusForTodayLabel}>Recommended Action</div>
        <div style={styles.focusForTodayValue}>{out.recommendedAction}</div>
      </div>

      <details style={styles.focusForTodayDetails}>
        <summary style={styles.focusForTodaySummary}>
          Why this state · recent pattern
        </summary>
        <p style={styles.focusForTodayMuted}>{out.stateExplanation}</p>
        {out.repeatedIssueSummary ? (
          <p style={styles.focusForTodayMuted}>{out.repeatedIssueSummary}</p>
        ) : null}
        <p style={{ ...styles.focusForTodayMuted, marginTop: 10 }}>
          <strong style={{ color: "#344054" }}>Trader level</strong> —{" "}
          {out.traderLevel}
        </p>
      </details>
    </section>
  );
}
