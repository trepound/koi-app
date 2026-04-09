"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import {
  calculateExecutionBreakdown,
  EXECUTION_BUCKET_MAX,
} from "@/lib/koi/mistake-penalties";
import {
  MANAGEMENT_STAGE_MISTAKES,
  normalizeStageMistakes,
  SETUP_STAGE_MISTAKES,
} from "@/lib/koi/stage-mistakes";
import type { Mistake, Trade, TradeStatus } from "@/lib/koi/types";
import { MistakesSelector } from "./MistakesSelector";
import { TradeFinalReviewCoaching } from "./TradeFinalReviewCoaching";

const SETUP_OPTIONS = [...SETUP_STAGE_MISTAKES] as Mistake[];
const MGMT_OPTIONS = [...MANAGEMENT_STAGE_MISTAKES] as Mistake[];

const subLabelStyle: CSSProperties = {
  fontSize: 11,
  opacity: 0.88,
  marginBottom: 4,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const panelStyle: CSSProperties = {
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 6,
  padding: "8px 10px",
  background: "rgba(15,23,42,0.35)",
  fontSize: 12,
  lineHeight: 1.35,
};

export function TradeLifecycleTable({
  trades,
  exitInputs,
  setExitInputs,
  updateTradeStatus,
  finalizeTrade,
  persistStageMistakesForTrade,
  setReviewCompleted,
}: {
  trades: Trade[];
  exitInputs: Record<number, string>;
  setExitInputs: Dispatch<SetStateAction<Record<number, string>>>;
  updateTradeStatus: (id: number, status: TradeStatus) => void;
  finalizeTrade: (id: number) => void;
  persistStageMistakesForTrade: (
    id: number,
    partial: { setup?: Mistake[]; management?: Mistake[] }
  ) => Promise<void>;
  setReviewCompleted: (id: number, completed: boolean) => Promise<void>;
}) {
  const [setupDraft, setSetupDraft] = useState<Record<number, Mistake[]>>({});
  const [mgmtDraft, setMgmtDraft] = useState<Record<number, Mistake[]>>({});

  function getSetup(trade: Trade): Mistake[] {
    return setupDraft[trade.id] ?? normalizeStageMistakes(trade).setup;
  }

  function getMgmt(trade: Trade): Mistake[] {
    return mgmtDraft[trade.id] ?? normalizeStageMistakes(trade).management;
  }

  function toggleSetup(trade: Trade, m: Mistake) {
    setSetupDraft((prev) => {
      const cur = prev[trade.id] ?? normalizeStageMistakes(trade).setup;
      const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      return { ...prev, [trade.id]: next };
    });
  }

  function toggleMgmt(trade: Trade, m: Mistake) {
    setMgmtDraft((prev) => {
      const cur = prev[trade.id] ?? normalizeStageMistakes(trade).management;
      const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      return { ...prev, [trade.id]: next };
    });
  }

  async function handleApplySetup(trade: Trade) {
    try {
      await persistStageMistakesForTrade(trade.id, { setup: getSetup(trade) });
      setSetupDraft((prev) => {
        const n = { ...prev };
        delete n[trade.id];
        return n;
      });
    } catch {
      /* parent alerts */
    }
  }

  async function handleApplyMgmt(trade: Trade) {
    try {
      await persistStageMistakesForTrade(trade.id, {
        management: getMgmt(trade),
      });
      setMgmtDraft((prev) => {
        const n = { ...prev };
        delete n[trade.id];
        return n;
      });
    } catch {
      /* parent alerts */
    }
  }

  async function handleApplyReview(trade: Trade) {
    try {
      await persistStageMistakesForTrade(trade.id, {
        setup: getSetup(trade),
        management: getMgmt(trade),
      });
      setSetupDraft((prev) => {
        const n = { ...prev };
        delete n[trade.id];
        return n;
      });
      setMgmtDraft((prev) => {
        const n = { ...prev };
        delete n[trade.id];
        return n;
      });
    } catch {
      /* parent alerts */
    }
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
          {trades.map((trade) => {
            const managementForExec = getMgmt(trade);
            const breakdown = calculateExecutionBreakdown(managementForExec);
            const disciplineDamaged =
              breakdown.discipline < EXECUTION_BUCKET_MAX.discipline;
            const sizingDamaged = breakdown.sizing < EXECUTION_BUCKET_MAX.sizing;
            const emotionalDamaged =
              breakdown.emotional < EXECUTION_BUCKET_MAX.emotional;

            const showExecutionBreakdown =
              trade.status === "ACTIVE" || trade.status === "CLOSED";

            const setupBeforeFill =
              trade.status === "PLANNED" ||
              trade.status === "PENDING" ||
              trade.status === "MISSED";

            return (
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
                  {trade.executionScore !== undefined
                    ? trade.executionScore
                    : "-"}
                </td>
                <td style={styles.td}>
                  {trade.totalScore !== undefined ? trade.totalScore : "-"}
                </td>
                <td style={styles.td}>{trade.finalGrade ?? "-"}</td>
                <td style={styles.td}>
                  <div style={{ display: "grid", gap: 8, minWidth: 220 }}>
                    {setupBeforeFill ? (
                      <>
                        <div style={subLabelStyle}>Setup (before trade)</div>
                        <MistakesSelector
                          mistakes={SETUP_OPTIONS}
                          selectedMistakes={getSetup(trade)}
                          onToggleMistake={(m) => toggleSetup(trade, m)}
                        />
                        <button
                          type="button"
                          style={styles.buttonGhost}
                          onClick={() => void handleApplySetup(trade)}
                        >
                          Apply setup mistakes
                        </button>
                      </>
                    ) : null}

                    {trade.status === "ACTIVE" ? (
                      <>
                        <div style={subLabelStyle}>Setup recorded</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                          {getSetup(trade).length
                            ? getSetup(trade).join(", ")
                            : "None"}
                        </div>
                        <div style={subLabelStyle}>Management (active trade)</div>
                        <MistakesSelector
                          mistakes={MGMT_OPTIONS}
                          selectedMistakes={getMgmt(trade)}
                          onToggleMistake={(m) => toggleMgmt(trade, m)}
                        />
                        <button
                          type="button"
                          style={styles.buttonGhost}
                          onClick={() => void handleApplyMgmt(trade)}
                        >
                          Apply management mistakes
                        </button>
                      </>
                    ) : null}

                    {trade.status === "CLOSED" ? (
                      <>
                        <div style={subLabelStyle}>Review — setup</div>
                        <MistakesSelector
                          mistakes={SETUP_OPTIONS}
                          selectedMistakes={getSetup(trade)}
                          onToggleMistake={(m) => toggleSetup(trade, m)}
                        />
                        <div style={subLabelStyle}>Review — management</div>
                        <MistakesSelector
                          mistakes={MGMT_OPTIONS}
                          selectedMistakes={getMgmt(trade)}
                          onToggleMistake={(m) => toggleMgmt(trade, m)}
                        />
                        <button
                          type="button"
                          style={styles.buttonPrimary}
                          onClick={() => void handleApplyReview(trade)}
                        >
                          Save review mistakes
                        </button>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={trade.reviewCompleted === true}
                            onChange={(e) =>
                              void setReviewCompleted(trade.id, e.target.checked)
                            }
                          />
                          Review completed
                        </label>
                        <TradeFinalReviewCoaching
                          setupMistakes={getSetup(trade)}
                          managementMistakes={getMgmt(trade)}
                        />
                      </>
                    ) : null}

                    {showExecutionBreakdown ? (
                      <div style={panelStyle}>
                        <div style={{ opacity: 0.95, marginBottom: 4 }}>
                          Execution breakdown (management only)
                        </div>
                        <div
                          style={{
                            color: disciplineDamaged ? "#f59e0b" : undefined,
                          }}
                        >
                          Discipline: {breakdown.discipline}/
                          {EXECUTION_BUCKET_MAX.discipline}
                        </div>
                        <div
                          style={{ color: sizingDamaged ? "#f59e0b" : undefined }}
                        >
                          Sizing / Risk: {breakdown.sizing}/
                          {EXECUTION_BUCKET_MAX.sizing}
                        </div>
                        <div
                          style={{
                            color: emotionalDamaged ? "#f59e0b" : undefined,
                          }}
                        >
                          Emotional Control: {breakdown.emotional}/
                          {EXECUTION_BUCKET_MAX.emotional}
                        </div>
                        <div style={{ marginTop: 2, fontWeight: 700 }}>
                          Execution score: {breakdown.executionScore}/50
                        </div>
                      </div>
                    ) : null}
                  </div>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
