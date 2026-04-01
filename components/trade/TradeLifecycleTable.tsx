"use client";

import type { Dispatch, SetStateAction } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import type { Trade, TradeStatus } from "@/lib/koi/types";

export function TradeLifecycleTable({
  trades,
  exitInputs,
  setExitInputs,
  updateTradeStatus,
  finalizeTrade,
  applyMistakesToTrade,
}: {
  trades: Trade[];
  exitInputs: Record<number, string>;
  setExitInputs: Dispatch<SetStateAction<Record<number, string>>>;
  updateTradeStatus: (id: number, status: TradeStatus) => void;
  finalizeTrade: (id: number) => void;
  applyMistakesToTrade: (id: number) => void;
}) {
  if (!trades.length) {
    return <div>No trades logged yet.</div>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Symbol</th>
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
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td style={styles.td}>{trade.symbol}</td>
              <td style={styles.td}>
                <span style={styles.badge}>{trade.status}</span>
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
                {trade.executionScore !== undefined ? trade.executionScore : "-"}
              </td>
              <td style={styles.td}>
                {trade.totalScore !== undefined ? trade.totalScore : "-"}
              </td>
              <td style={styles.td}>{trade.finalGrade ?? "-"}</td>
              <td style={styles.td}>
                {trade.mistakes.length ? trade.mistakes.join(", ") : "None"}
              </td>
              <td style={styles.td}>
                <div style={styles.rowActions}>
                  {trade.status === "PLANNED" && (
                    <>
                      <button
                        style={styles.buttonPrimary}
                        onClick={() => updateTradeStatus(trade.id, "PENDING")}
                      >
                        Place Order
                      </button>
                      <button
                        style={styles.buttonDanger}
                        onClick={() => updateTradeStatus(trade.id, "MISSED")}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {trade.status === "PENDING" && (
                    <>
                      <button
                        style={styles.buttonPrimary}
                        onClick={() => updateTradeStatus(trade.id, "ACTIVE")}
                      >
                        Mark Filled
                      </button>
                      <button
                        style={styles.buttonDanger}
                        onClick={() => updateTradeStatus(trade.id, "MISSED")}
                      >
                        Not Filled
                      </button>
                    </>
                  )}

                  {trade.status === "ACTIVE" && (
                    <>
                      <button
                        style={styles.buttonGhost}
                        onClick={() => applyMistakesToTrade(trade.id)}
                      >
                        Apply Selected Mistakes
                      </button>
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
                        Close Trade
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
