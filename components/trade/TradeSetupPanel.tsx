"use client";

import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import type { Mistake } from "@/lib/koi/types";
import { MistakesSelector } from "./MistakesSelector";
import { TradeBiasDisplay } from "./TradeBiasDisplay";

export type TradeSetupPanelProps = {
  engineTradeBias: "Long" | "Short" | null;
  symbol: string;
  setSymbol: (v: string) => void;
  entry: string;
  setEntry: (v: string) => void;
  stop: string;
  setStop: (v: string) => void;
  target: string;
  setTarget: (v: string) => void;
  target2: string;
  setTarget2: (v: string) => void;
  target1AllocPct: string;
  target2AllocPct: string;
  onTarget1AllocChange: (raw: string) => void;
  onTarget2AllocChange: (raw: string) => void;
  tradeSetupAllocationValid: boolean;
  accountSize: string;
  setAccountSize: (v: string) => void;
  riskPercent: string;
  setRiskPercent: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  setPositionSizeManual: (v: boolean) => void;
  positionSizeManual: boolean;
  tradeSetupDerived: {
    weightedRR: number | null;
    riskAmount: number | null;
    riskDist: number | null;
  };
  onCreateSetup: () => void;
  onClearTrades: () => void;
  selectedMistakes: Mistake[];
  onToggleMistake: (m: Mistake) => void;
};

export function TradeSetupPanel({
  engineTradeBias,
  symbol,
  setSymbol,
  entry,
  setEntry,
  stop,
  setStop,
  target,
  setTarget,
  target2,
  setTarget2,
  target1AllocPct,
  target2AllocPct,
  onTarget1AllocChange,
  onTarget2AllocChange,
  tradeSetupAllocationValid,
  accountSize,
  setAccountSize,
  riskPercent,
  setRiskPercent,
  size,
  setSize,
  setPositionSizeManual,
  positionSizeManual,
  tradeSetupDerived,
  onCreateSetup,
  onClearTrades,
  selectedMistakes,
  onToggleMistake,
}: TradeSetupPanelProps) {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>Trade Setup</h2>
      <p style={{ ...styles.small, margin: "0 0 12px" }}>
        Execution layer: prices, target allocations (default 0% T1 / 100% T2 for
        full exit at Target 2), risk-based sizing with floored position size, and
        weighted R:R. ODE mirrors prices; opportunity scoring still uses Target 2
        only for R:R points.
      </p>

      <TradeBiasDisplay engineTradeBias={engineTradeBias} />

      <div style={styles.formGrid}>
        <div style={styles.tradeSetupSymbolRow}>
          <label style={{ margin: 0 }}>
            <span style={styles.tradeSetupFieldLabel}>Symbol</span>
            <input
              style={styles.input}
              placeholder="e.g. AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button style={styles.buttonPrimary} onClick={onCreateSetup}>
              Create Setup
            </button>
            <button style={styles.buttonDanger} onClick={onClearTrades}>
              Clear Trades
            </button>
          </div>
        </div>

        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Entry Price</span>
          <input
            style={styles.input}
            placeholder="Entry Price"
            value={entry}
            onChange={(e) => {
              setPositionSizeManual(false);
              setEntry(e.target.value);
            }}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Stop Price</span>
          <input
            style={styles.input}
            placeholder="Stop Price"
            value={stop}
            onChange={(e) => {
              setPositionSizeManual(false);
              setStop(e.target.value);
            }}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Target Price 1</span>
          <input
            style={styles.input}
            placeholder="Target Price 1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Target Price 2</span>
          <input
            style={styles.input}
            placeholder="Target Price 2"
            value={target2}
            onChange={(e) => setTarget2(e.target.value)}
          />
        </label>

        <div style={styles.tradeSetupSubheading}>Target allocation %</div>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Target 1 Allocation %</span>
          <input
            style={{
              ...styles.input,
              ...(!tradeSetupAllocationValid &&
              target1AllocPct.trim() !== "" &&
              target2AllocPct.trim() !== ""
                ? { borderColor: "#f04438", borderWidth: "2px" }
                : {}),
            }}
            placeholder="0"
            inputMode="decimal"
            value={target1AllocPct}
            onChange={(e) => onTarget1AllocChange(e.target.value)}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Target 2 Allocation %</span>
          <input
            style={{
              ...styles.input,
              ...(!tradeSetupAllocationValid &&
              target1AllocPct.trim() !== "" &&
              target2AllocPct.trim() !== ""
                ? { borderColor: "#f04438", borderWidth: "2px" }
                : {}),
            }}
            placeholder="100"
            inputMode="decimal"
            value={target2AllocPct}
            onChange={(e) => onTarget2AllocChange(e.target.value)}
          />
        </label>

        {!tradeSetupAllocationValid &&
          target1AllocPct.trim() !== "" &&
          target2AllocPct.trim() !== "" && (
            <p style={styles.tradeSetupErrorBanner}>
              Allocations must total exactly 100%. (Used for weighted R:R and trade
              tracking only — not Opportunity Score.)
            </p>
          )}

        <p
          style={{
            ...styles.small,
            gridColumn: "1 / -1",
            margin: 0,
            color: "#667085",
          }}
        >
          Editing T1 updates T2 to 100 − T1 (and vice versa). At 0% T1, 100% exits
          at Target 2; with T1 above 0%, that share exits at Target 1 and the
          remainder at Target 2.
        </p>

        <div style={styles.tradeSetupSubheading}>Position sizing</div>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Account Size</span>
          <input
            style={styles.input}
            placeholder="Account Size"
            inputMode="decimal"
            value={accountSize}
            onChange={(e) => {
              setPositionSizeManual(false);
              setAccountSize(e.target.value);
            }}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span style={styles.tradeSetupFieldLabel}>Risk %</span>
          <input
            style={styles.input}
            placeholder="Risk % (e.g. 1 = 1%)"
            inputMode="decimal"
            value={riskPercent}
            onChange={(e) => {
              setPositionSizeManual(false);
              setRiskPercent(e.target.value);
            }}
          />
        </label>

        <div style={styles.tradeSetupExecGrid}>
          <div style={styles.tradeSetupExecCard}>
            <div style={styles.tradeSetupExecLabel}>Risk amount</div>
            <div style={styles.tradeSetupExecValue}>
              {tradeSetupDerived.riskAmount !== null
                ? tradeSetupDerived.riskAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </div>
            <div style={styles.tradeSetupExecHint}>Account Size × Risk %</div>
          </div>
          <div style={styles.tradeSetupExecCard}>
            <div style={styles.tradeSetupExecLabel}>Position size</div>
            <div style={styles.tradeSetupExecValue}>
              {size.trim() !== "" ? size : "—"}
            </div>
            <div style={styles.tradeSetupExecHint}>
              Risk amount ÷ |Entry − Stop|, floored (auto); edit below to override.
            </div>
            <input
              style={styles.tradeSetupPositionInput}
              placeholder="Position size (auto or manual)"
              inputMode="decimal"
              value={size}
              onChange={(e) => {
                setPositionSizeManual(true);
                setSize(e.target.value);
              }}
            />
          </div>
        </div>

        <div style={styles.tradeSetupMetricsRow}>
          <div style={styles.tradeSetupMetricTile}>
            <div style={styles.tradeSetupMetricLabel}>Weighted R:R</div>
            <div style={styles.tradeSetupMetricValue}>
              {tradeSetupDerived.weightedRR !== null
                ? `${tradeSetupDerived.weightedRR.toFixed(2)}:1`
                : "—"}
            </div>
            <div
              style={{
                ...styles.small,
                marginTop: "6px",
                color: "#9bb0d1",
                fontSize: "11px",
              }}
            >
              Alloc-weighted targets ÷ |Entry − Stop|
            </div>
          </div>
        </div>

        <p style={{ ...styles.small, gridColumn: "1 / -1", margin: 0 }}>
          Position size auto-fills from risk ÷ |Entry − Stop| when Account Size,
          Risk %, Entry, and Stop are valid. Override anytime; change Account, Risk
          %, Entry, or Stop to return to auto (floored) size.
        </p>
        {positionSizeManual && (
          <p
            style={{
              ...styles.small,
              gridColumn: "1 / -1",
              margin: 0,
              color: "#475467",
              fontWeight: 600,
            }}
          >
            Manual position size active — adjust Account Size, Risk %, Entry, or
            Stop to sync from the formula again.
          </p>
        )}
      </div>

      <MistakesSelector
        selectedMistakes={selectedMistakes}
        onToggleMistake={onToggleMistake}
      />

      <p style={{ ...styles.small, marginTop: "12px" }}>
        Setup Grade is assigned by score, not by opinion.
      </p>
    </div>
  );
}
