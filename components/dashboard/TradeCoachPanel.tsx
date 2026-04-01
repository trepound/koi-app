"use client";

import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";

/**
 * Placeholder for AI trade coach (Phase 3+).
 */
export function TradeCoachPanel() {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>Trade Coach</h2>
      <p style={{ ...styles.small, margin: 0 }}>
        AI feedback and coaching section. This will later include what the trader
        did well, what needs improvement, and one clear focus action.
      </p>
    </div>
  );
}
