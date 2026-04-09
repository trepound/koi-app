"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import { normalizeStageMistakes } from "@/lib/koi/stage-mistakes";
import type { Trade, TradeStatus } from "@/lib/koi/types";
import { MistakeSummary } from "./MistakeSummary";

const subLabelStyle: CSSProperties = {
  fontSize: 11,
  opacity: 0.88,
  marginBottom: 4,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

export function TradeLifecycleTable({
  trades,
  exitInputs,
  setExitInputs,
  updateTradeStatus,
  finalizeTrade,
}: {
  trades: Trade[];
  exitInputs: Record<number, string>;
  setExitInputs: Dispatch<SetStateAction<Record<number, string>>>;
  updateTradeStatus: (id: number, status: TradeStatus) => void;
  finalizeTrade: (id: number) => void;
}) {
  const [expandedByTradeId, setExpandedByTradeId] = useState<
    Record<number, boolean>
  >({});
  const [filledPriceByTradeId, setFilledPriceByTradeId] = useState<
    Record<number, string>
  >({});

  function toggleExpanded(tradeId: number) {
    setExpandedByTradeId((prev) => ({ ...prev, [tradeId]: !prev[tradeId] }));
  }

  if (!trades.length) {
    return <div>No trades logged yet.</div>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Symbol</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Side</th>
            <th style={styles.th}>Position Size</th>
            <th style={styles.th}>Entry</th>
            <th style={styles.th}>Stop</th>
            <th style={styles.th}>Target 1</th>
            <th style={styles.th}>Target 2</th>
            <th style={styles.th}>T1 %</th>
            <th style={styles.th}>T2 %</th>
            <th style={styles.th}>Wtd R:R</th>
            <th style={styles.th}>Setup Score</th>
            <th style={styles.th}>Setup Grade</th>
            <th style={styles.th}>Imbalance</th>
            <th style={styles.th}>Fresh</th>
            <th style={styles.th}>HTF</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Exit</th>
            <th style={styles.th}>R</th>
            <th style={styles.th}>Execution</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Trade Grade</th>
            <th style={styles.th}>Mistakes</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const isReviewing = trade.status === "CLOSED" && expandedByTradeId[trade.id];

            return (
              <tr key={trade.id}>
                <td style={styles.td}>{trade.symbol}</td>
                <td style={{ ...styles.td, verticalAlign: "middle" }}>
                  <div style={styles.rowActions}>
                    {trade.status === "PLANNED" ? (
                      <button
                        style={styles.buttonPrimary}
                        onClick={() => updateTradeStatus(trade.id, "PENDING")}
                      >
                        Place Order
                      </button>
                    ) : null}
                    {trade.status === "PENDING" ? (
                      <>
                        <input
                          style={{ ...styles.input, width: "130px" }}
                          placeholder="Filled / Entry Price"
                          value={filledPriceByTradeId[trade.id] ?? ""}
                          onChange={(e) =>
                            setFilledPriceByTradeId((prev) => ({
                              ...prev,
                              [trade.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          style={styles.buttonPrimary}
                          onClick={() => updateTradeStatus(trade.id, "ACTIVE")}
                        >
                          Mark as Filled
                        </button>
                      </>
                    ) : null}
                    {trade.status === "ACTIVE" ? (
                      <>
                        <input
                          style={{ ...styles.input, width: "120px" }}
                          placeholder="Exit"
                          value={exitInputs[trade.id] ?? ""}
                          onChange={(e) =>
                            setExitInputs((prev) => ({
                              ...prev,
                              [trade.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          style={styles.buttonWarn}
                          onClick={() => finalizeTrade(trade.id)}
                        >
                          Close
                        </button>
                      </>
                    ) : null}
                    {trade.status === "CLOSED" ? (
                      <button
                        style={styles.buttonGhost}
                        type="button"
                        onClick={() => toggleExpanded(trade.id)}
                      >
                        {isReviewing ? "Close Review" : "Review"}
                      </button>
                    ) : null}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge}>
                    {trade.status === "PLANNED" ? "WAITING" : trade.status}
                  </span>
                </td>
                <td style={styles.td}>{trade.side}</td>
                <td style={styles.td}>
                  {typeof trade.size === "number" && Number.isFinite(trade.size)
                    ? trade.size
                    : "-"}
                </td>
                <td style={styles.td}>{trade.entry}</td>
                <td style={styles.td}>{trade.stop}</td>
                <td style={styles.td}>{trade.target}</td>
                <td style={styles.td}>{trade.target2 ?? "-"}</td>
                <td style={styles.td}>
                  {typeof trade.target1AllocationPct === "number"
                    ? `${trade.target1AllocationPct}%`
                    : "—"}
                </td>
                <td style={styles.td}>
                  {typeof trade.target2AllocationPct === "number"
                    ? `${trade.target2AllocationPct}%`
                    : "—"}
                </td>
                <td style={styles.td}>
                  {typeof trade.rewardRisk === "number"
                    ? `${trade.rewardRisk.toFixed(2)}:1`
                    : "-"}
                </td>
                <td style={styles.td}>{trade.setupScore}</td>
                <td style={styles.td}>{trade.setupGrade}</td>
                <td style={styles.td}>{trade.imbalanceQuality}</td>
                <td style={styles.td}>{trade.freshness}</td>
                <td style={styles.td}>{trade.htfAlignment}</td>
                <td style={styles.td}>{trade.locationQuality}</td>
                <td style={styles.td}>{trade.exitPrice ?? "-"}</td>
                <td style={styles.td}>
                  {trade.rMultiple !== undefined
                    ? `${trade.rMultiple.toFixed(2)}R`
                    : "-"}
                </td>
                <td style={styles.td}>
                  {trade.executionScore !== undefined
                    ? trade.executionScore
                    : "-"}
                </td>
                <td style={styles.td}>
                  {trade.totalScore !== undefined ? trade.totalScore : "-"}
                </td>
                <td style={styles.td}>{trade.finalGrade ?? "-"}</td>
                <td style={styles.td}>
                  <MistakeSummary
                    setupMistakes={trade.setupMistakes}
                    managementMistakes={trade.managementMistakes}
                    mistakes={trade.mistakes}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
