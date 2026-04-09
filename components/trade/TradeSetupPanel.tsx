"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import { TradeBiasDisplay } from "./TradeBiasDisplay";

export type TradeSetupPanelProps = {
  engineTradeBias: "Long" | "Short" | null;
  symbol: string;
  setSymbol: (v: string) => void;
  entry: string;
  stop: string;
  target: string;
  target2: string;
  setTarget2: (v: string) => void;
  hasSecondTarget: boolean;
  setHasSecondTarget: (v: boolean) => void;
  target1Allocation: number;
  setTarget1Allocation: (v: number) => void;
  target2Allocation: number;
  setTarget2Allocation: (v: number) => void;
  tradeSetupAllocationValid: boolean;
  accountSize: string;
  setAccountSize: (v: string) => void;
  riskPercent: string;
  setRiskPercent: (v: string) => void;
  setSize: (v: string) => void;
  tradeSetupDerived: {
    weightedRR: number | null;
    riskAmount: number | null;
    riskDist: number | null;
  };
  onCreateSetup: () => void;
  onClearTrades: () => void;
};

const odeReviewBox: CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #e4e7ec",
  borderRadius: "10px",
  fontSize: "14px",
  background: "#f8fafc",
  color: "#344054",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
};

export function TradeSetupPanel({
  engineTradeBias,
  symbol,
  setSymbol,
  entry,
  stop,
  target,
  target2,
  setTarget2,
  hasSecondTarget,
  setHasSecondTarget,
  target1Allocation,
  setTarget1Allocation,
  target2Allocation,
  setTarget2Allocation,
  tradeSetupAllocationValid,
  accountSize,
  setAccountSize,
  riskPercent,
  setRiskPercent,
  setSize,
  tradeSetupDerived,
  onCreateSetup,
  onClearTrades,
}: TradeSetupPanelProps) {
  const [positionSize, setPositionSize] = useState(0);
  const [isManualSize, setIsManualSize] = useState(false);

  const accountNum = Number(accountSize.trim());
  const riskPctNum = Number(riskPercent.trim());
  const entryNum = Number(entry.trim());
  const stopNum = Number(stop.trim());

  const riskAmount = useMemo(() => {
    if (
      !Number.isFinite(accountNum) ||
      accountNum <= 0 ||
      !Number.isFinite(riskPctNum) ||
      riskPctNum < 0
    ) {
      return 0;
    }
    return accountNum * (riskPctNum / 100);
  }, [accountNum, riskPctNum]);

  const riskPerUnit = useMemo(() => {
    if (
      !Number.isFinite(entryNum) ||
      !Number.isFinite(stopNum) ||
      Math.abs(entryNum - stopNum) <= 0
    ) {
      return 0;
    }
    return Math.abs(entryNum - stopNum);
  }, [entryNum, stopNum]);

  const autoPositionSize =
    riskPerUnit > 0 ? Math.floor(riskAmount / riskPerUnit) : 0;

  const finalPositionSize = isManualSize ? positionSize : autoPositionSize;

  useEffect(() => {
    if (!isManualSize) {
      setPositionSize(autoPositionSize);
    }
  }, [autoPositionSize, isManualSize]);

  useEffect(() => {
    setSize(String(finalPositionSize));
  }, [finalPositionSize, setSize]);

  const capitalRequired = useMemo(() => {
    if (
      !Number.isFinite(entryNum) ||
      entryNum <= 0 ||
      !Number.isFinite(finalPositionSize) ||
      finalPositionSize <= 0
    ) {
      return null;
    }
    return entryNum * finalPositionSize;
  }, [entryNum, finalPositionSize]);

  function handleAddTarget2() {
    setHasSecondTarget(true);
    if (target1Allocation === 100 && target2Allocation === 0) {
      setTarget1Allocation(50);
      setTarget2Allocation(50);
    }
  }

  function handleRemoveTarget2() {
    setHasSecondTarget(false);
    setTarget2("");
    setTarget1Allocation(100);
    setTarget2Allocation(0);
  }

  function displayPrice(raw: string) {
    const t = raw.trim();
    return t === "" ? "—" : t;
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>Trade Setup</h2>
      <div style={{ display: "grid", gap: "22px" }}>
        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
            1. Trade Direction
          </h3>
          <p style={{ ...styles.small, margin: "0 0 10px" }}>
            Your bias comes from a valid opportunity in the Opportunity Decision
            Engine.
          </p>
          <TradeBiasDisplay engineTradeBias={engineTradeBias} />
        </section>

        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
            2. Risk Plan
          </h3>
          <p style={{ ...styles.small, margin: "0 0 10px" }}>
            How much of your account you are willing to risk if the stop is hit.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <label style={{ margin: 0 }}>
              <span style={styles.tradeSetupFieldLabel}>Account Size</span>
              <input
                style={styles.input}
                placeholder="Account Size"
                inputMode="decimal"
                value={accountSize}
                onChange={(e) => {
                  setIsManualSize(false);
                  setAccountSize(e.target.value);
                }}
              />
            </label>
            <label style={{ margin: 0 }}>
              <span style={styles.tradeSetupFieldLabel}>Risk %</span>
              <input
                style={styles.input}
                placeholder="Risk %"
                inputMode="decimal"
                value={riskPercent}
                onChange={(e) => {
                  setIsManualSize(false);
                  setRiskPercent(e.target.value);
                }}
              />
            </label>
          </div>
        </section>

        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
            3. Position Sizing
          </h3>
          <p style={{ ...styles.small, margin: "0 0 10px" }}>
            Size updates from your risk plan and prices; you can override the
            share count if needed.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={styles.tradeSetupCompactItem}
              title="Account Size × (Risk % ÷ 100)"
            >
              <div style={styles.tradeSetupCompactItemLabel}>Risk Amount</div>
              <div style={styles.tradeSetupCompactItemValue}>
                {tradeSetupDerived.riskAmount !== null
                  ? `$${tradeSetupDerived.riskAmount.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  : "—"}
              </div>
            </div>
            <label style={{ margin: 0 }} title="Risk Amount ÷ |Entry − Stop|">
              <span style={styles.tradeSetupFieldLabel}>
                Position Size (shares / contracts)
              </span>
              <input
                style={styles.input}
                type="number"
                min={0}
                inputMode="numeric"
                value={finalPositionSize}
                onChange={(e) => {
                  setIsManualSize(true);
                  setPositionSize(Number(e.target.value));
                }}
              />
            </label>
            <div style={styles.tradeSetupCompactItem} title="Entry × Position Size">
              <div style={styles.tradeSetupCompactItemLabel}>
                Capital Required
              </div>
              <div style={styles.tradeSetupCompactItemValue}>
                {capitalRequired !== null
                  ? `$${capitalRequired.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  : "—"}
              </div>
            </div>
            <div
              style={styles.tradeSetupCompactItem}
              title="Weighted reward distance ÷ risk (see targets below when using two targets)"
            >
              <div style={styles.tradeSetupCompactItemLabel}>Weighted R:R</div>
              <div style={styles.tradeSetupCompactItemValue}>
                {tradeSetupDerived.weightedRR !== null
                  ? `${tradeSetupDerived.weightedRR.toFixed(2)}:1`
                  : "—"}
              </div>
            </div>
          </div>
          {isManualSize && (
            <p style={{ ...styles.small, margin: "8px 0 0", color: "#475467" }}>
              Manual size is on. Change Account Size, Risk %, Entry, or Stop in
              the engine to snap back to the auto size, or type a new size here.
            </p>
          )}
        </section>

        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
            4. Setup Prices (from ODE)
          </h3>
          <p style={{ ...styles.small, margin: "0 0 10px" }}>
            Entry, stop, and Target 1 reflect what you set in the Opportunity
            Decision Engine. Edit them there if something looks off.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <label style={{ margin: 0 }}>
              <span style={styles.tradeSetupFieldLabel}>Symbol</span>
              <input
                style={styles.input}
                placeholder="e.g. AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </label>
            <div>
              <span style={styles.tradeSetupFieldLabel}>Entry</span>
              <div style={odeReviewBox}>{displayPrice(entry)}</div>
            </div>
            <div>
              <span style={styles.tradeSetupFieldLabel}>Stop</span>
              <div style={odeReviewBox}>{displayPrice(stop)}</div>
            </div>
            <div>
              <span style={styles.tradeSetupFieldLabel}>Target 1</span>
              <div style={odeReviewBox}>{displayPrice(target)}</div>
            </div>
            {hasSecondTarget && (
              <label style={{ margin: 0 }}>
                <span style={styles.tradeSetupFieldLabel}>Target 2</span>
                <input
                  style={styles.input}
                  placeholder="Target 2 price"
                  inputMode="decimal"
                  value={target2}
                  onChange={(e) => setTarget2(e.target.value)}
                />
              </label>
            )}
          </div>
          <div style={{ marginTop: "12px" }}>
            {!hasSecondTarget ? (
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={handleAddTarget2}
              >
                + Add Target 2
              </button>
            ) : (
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={handleRemoveTarget2}
              >
                Remove Target 2
              </button>
            )}
          </div>

          {hasSecondTarget && (
            <div style={{ marginTop: "16px" }}>
              <p
                style={{
                  ...styles.small,
                  margin: "0 0 10px",
                  fontWeight: 600,
                  color: "#344054",
                }}
              >
                Trade allocation
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                <label style={{ margin: 0 }}>
                  <span style={styles.tradeSetupFieldLabel}>
                    Target 1 Allocation %
                  </span>
                  <input
                    style={{
                      ...styles.input,
                      ...(!tradeSetupAllocationValid
                        ? { borderColor: "#f04438", borderWidth: "2px" }
                        : {}),
                    }}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={target1Allocation}
                    onChange={(e) => {
                      const val = Math.max(
                        0,
                        Math.min(100, Number(e.target.value))
                      );
                      setTarget1Allocation(val);
                      setTarget2Allocation(100 - val);
                    }}
                  />
                </label>
                <label style={{ margin: 0 }}>
                  <span style={styles.tradeSetupFieldLabel}>
                    Target 2 Allocation %
                  </span>
                  <input
                    style={{
                      ...styles.input,
                      ...(!tradeSetupAllocationValid
                        ? { borderColor: "#f04438", borderWidth: "2px" }
                        : {}),
                    }}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={target2Allocation}
                    onChange={(e) => {
                      const val = Math.max(
                        0,
                        Math.min(100, Number(e.target.value))
                      );
                      setTarget2Allocation(val);
                      setTarget1Allocation(100 - val);
                    }}
                  />
                </label>
              </div>
              <div
                style={{
                  ...styles.small,
                  marginTop: "10px",
                  color: "#475467",
                }}
              >
                <div>
                  Target 1:{" "}
                  {Math.round(
                    (finalPositionSize * target1Allocation) / 100
                  )}{" "}
                  shares
                </div>
                <div>
                  Target 2:{" "}
                  {Math.round(
                    (finalPositionSize * target2Allocation) / 100
                  )}{" "}
                  shares
                </div>
              </div>
              {!tradeSetupAllocationValid && (
                <p style={{ ...styles.tradeSetupErrorBanner, marginTop: "8px" }}>
                  Allocations must total exactly 100%.
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
            5. Create Setup
          </h3>
          <p style={{ ...styles.small, margin: "0 0 10px" }}>
            Save the plan to your trade lifecycle when you are ready.
          </p>
          <div style={styles.tradeSetupActions}>
            <button style={styles.buttonPrimary} onClick={onCreateSetup}>
              Create Setup
            </button>
            <button style={styles.buttonDanger} onClick={onClearTrades}>
              Clear Trades
            </button>
          </div>
        </section>
      </div>

      <div style={{ ...styles.small, marginTop: "12px" }}>
        Setup Grade is assigned by score, not by opinion.
      </div>
    </div>
  );
}
