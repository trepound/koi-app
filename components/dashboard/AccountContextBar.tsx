"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ACCOUNT_CONTEXT_DEFAULTS,
  loadAccountContextFromStorage,
  saveAccountContextToStorage,
} from "@/lib/koi/account-context";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";
import { evaluateDisciplineEngine } from "@/lib/koi/discipline-engine";
import {
  getDevelopmentProgress,
  ROUND_COUNT,
} from "@/lib/koi/development-progress";
import type { Trade } from "@/lib/koi/types";

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AccountContextBar({ trades }: { trades: Trade[] }) {
  const [accountSize, setAccountSize] = useState(
    String(ACCOUNT_CONTEXT_DEFAULTS.accountSize)
  );
  const [riskPct, setRiskPct] = useState(
    String(ACCOUNT_CONTEXT_DEFAULTS.riskPerTradePct)
  );
  const [maxExpPct, setMaxExpPct] = useState(
    String(ACCOUNT_CONTEXT_DEFAULTS.maxExposurePct)
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadAccountContextFromStorage();
    setAccountSize(String(s.accountSize));
    setRiskPct(String(s.riskPerTradePct));
    setMaxExpPct(String(s.maxExposurePct));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const a = Number(accountSize.replace(/,/g, ""));
    const r = Number(riskPct);
    const m = Number(maxExpPct);
    saveAccountContextToStorage({
      accountSize:
        Number.isFinite(a) && a > 0 ? a : ACCOUNT_CONTEXT_DEFAULTS.accountSize,
      riskPerTradePct:
        Number.isFinite(r) && r >= 0
          ? Math.min(100, r)
          : ACCOUNT_CONTEXT_DEFAULTS.riskPerTradePct,
      maxExposurePct:
        Number.isFinite(m) && m >= 0
          ? Math.min(100, m)
          : ACCOUNT_CONTEXT_DEFAULTS.maxExposurePct,
    });
  }, [hydrated, accountSize, riskPct, maxExpPct]);

  const { roundLine, traderLevel } = useMemo(() => {
    const dev = getDevelopmentProgress(trades);
    const disc = evaluateDisciplineEngine(trades);
    return {
      roundLine: `Round ${dev.currentRound} of ${ROUND_COUNT} · ${dev.currentRoundTheme}`,
      traderLevel: disc.traderLevel,
    };
  }, [trades]);

  const item = styles.accountContextItem as CSSProperties;
  const label = styles.accountContextLabel as CSSProperties;

  return (
    <section
      style={styles.accountContextBar}
      aria-label="Account and risk context"
    >
      <div style={{ ...item, minWidth: 148 }}>
        <span style={label}>Account size</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          style={styles.accountContextInputWide as CSSProperties}
          value={accountSize}
          onChange={(e) => setAccountSize(e.target.value)}
          aria-label="Account size in dollars"
        />
        <span style={styles.accountContextReadonlySub}>
          {(() => {
            const n = Number(String(accountSize).replace(/,/g, ""));
            return Number.isFinite(n) && n > 0 ? formatUsd(n) : "—";
          })()}
        </span>
      </div>

      <div style={item}>
        <span style={label}>Risk / trade</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          style={styles.accountContextInput as CSSProperties}
          value={riskPct}
          onChange={(e) => setRiskPct(e.target.value)}
          aria-label="Risk per trade percent"
        />
        <span style={styles.accountContextReadonlySub}>% of account</span>
      </div>

      <div style={item}>
        <span style={label}>Max exposure</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          style={styles.accountContextInput as CSSProperties}
          value={maxExpPct}
          onChange={(e) => setMaxExpPct(e.target.value)}
          aria-label="Max exposure percent"
        />
        <span style={styles.accountContextReadonlySub}>% of account</span>
      </div>

      <div style={styles.accountContextItemGrow as CSSProperties}>
        <span style={label}>Round</span>
        <span style={styles.accountContextReadonly}>{roundLine}</span>
      </div>

      <div style={styles.accountContextItemGrow as CSSProperties}>
        <span style={label}>Trader level</span>
        <span style={styles.accountContextReadonly}>{traderLevel}</span>
      </div>
    </section>
  );
}
