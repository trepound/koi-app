"use client";

/**
 * KOI Elite Dashboard — authenticated cloud persistence (Phase 3).
 * Scoring and ODE logic remain in lib/koi; this file wires Supabase I/O only.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/components/auth/AuthGate";
import { UserMenu } from "@/components/auth/UserMenu";
import { AccountContextBar } from "@/components/dashboard/AccountContextBar";
import { DevelopmentProgressPanel } from "@/components/dashboard/DevelopmentProgressPanel";
import { NinetyTradeReportPanel } from "@/components/dashboard/NinetyTradeReportPanel";
import { SixtyTradeReportPanel } from "@/components/dashboard/SixtyTradeReportPanel";
import { ThirtyTradeReportPanel } from "@/components/dashboard/ThirtyTradeReportPanel";
import { FocusForTodayPanel } from "@/components/dashboard/FocusForTodayPanel";
import { TraderScorecard } from "@/components/TraderScorecard";
import { OpportunityDecisionEngine } from "@/components/ode/OpportunityDecisionEngine";
import { SystemChecksPanel } from "@/components/ode/SystemChecksPanel";
import { TradeLifecycleTable } from "@/components/trade/TradeLifecycleTable";
import { TradeSetupPanel } from "@/components/trade/TradeSetupPanel";
import { dashboardStyles } from "@/lib/koi/dashboard-styles";
import { evaluateKoiSetup, getKoiTradeDecision } from "@/lib/koi/ode";
import {
  calculateAutoPositionSize,
  calculateWeightedRewardRiskFromPrices,
} from "@/lib/koi/risk";
import { clearTradesStorage } from "@/lib/koi/storage";
import {
  aggregateMistakesForPersistence,
  normalizeStageMistakes,
} from "@/lib/koi/stage-mistakes";
import {
  buildNewTrade,
  finalizeExistingTrade,
  recalculateTradeScores,
} from "@/lib/koi/trade";
import { formatSupabaseOrUnknownError } from "@/lib/supabase/error-format";
import { createClient } from "@/lib/supabase/client";
import {
  createTradeForUser,
  deleteAllTradesForUser,
  fetchTradesForUser,
  finalizeTradeForUser,
  replaceTradeMistakesForTrade,
  updateTradeForUser,
  updateTradeReviewCompleted,
} from "@/lib/supabase/queries";
import type {
  Freshness,
  HTFAlignment,
  ImbalanceQuality,
  KoiDisplayModel,
  KoiHTFLocation,
  KoiImbalance,
  KoiPatternStage,
  KoiTimeAtZone,
  KoiTrend,
  KoiZoneSide,
  LocationQuality,
  Mistake,
  Trade,
  TradeStatus,
} from "@/lib/koi/types";

const styles = dashboardStyles;

export function DashboardContent() {
  const user = useAuthUser();

  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [target2, setTarget2] = useState("");
  const [target1AllocPct, setTarget1AllocPct] = useState("0");
  const [target2AllocPct, setTarget2AllocPct] = useState("100");
  const [accountSize, setAccountSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [size, setSize] = useState("");
  const [positionSizeManual, setPositionSizeManual] = useState(false);

  const [imbalanceQuality, setImbalanceQuality] =
    useState<ImbalanceQuality>("Strong");
  const [freshness, setFreshness] = useState<"" | Freshness>("");
  const [htfAlignment, setHTFAlignment] =
    useState<HTFAlignment>("Fully Aligned");
  const [locationQuality, setLocationQuality] =
    useState<LocationQuality>("Excellent");

  const [selectedSetupMistakes, setSelectedSetupMistakes] = useState<Mistake[]>(
    []
  );
  const [trades, setTrades] = useState<Trade[]>([]);
  const [exitInputs, setExitInputs] = useState<Record<number, string>>({});
  const [loadingTrades, setLoadingTrades] = useState(true);

  const [koiTrend, setKoiTrend] = useState<KoiTrend>("");
  const [koiHTFLocation, setKoiHTFLocation] = useState<KoiHTFLocation>("");
  const [koiZoneSide, setKoiZoneSide] = useState<KoiZoneSide>("");
  const [koiPatternStage, setKoiPatternStage] = useState<KoiPatternStage>("");
  const [koiImbalance, setKoiImbalance] = useState<KoiImbalance>("");
  const [koiTimeAtZone, setKoiTimeAtZone] = useState<KoiTimeAtZone>("");
  const [showSystemChecks, setShowSystemChecks] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dbg = (...args: unknown[]) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[KOI dashboard load]", ...args);
      }
    };

    void (async () => {
      setLoadingTrades(true);
      dbg("user/session resolved, user.id =", user.id);
      let supabase: ReturnType<typeof createClient>;
      try {
        supabase = createClient();
      } catch (bootErr) {
        console.error("Dashboard load failed:", bootErr);
        if (bootErr instanceof Error) {
          console.error("message:", bootErr.message);
          console.error("stack:", bootErr.stack);
        }
        if (!cancelled) {
          alert(
            `Could not load trades: ${formatSupabaseOrUnknownError(bootErr)}`
          );
          setTrades([]);
        }
        if (!cancelled) setLoadingTrades(false);
        return;
      }

      try {
        dbg("fetchTradesForUser called");
        const list = await fetchTradesForUser(supabase, user.id);
        dbg("fetchTradesForUser returned", list.length, "rows");
        dbg("mapping completed (inside fetchTradesForUser)");
        if (cancelled) return;
        dbg("setTrades about to run");
        setTrades(list);
        dbg("setTrades called");
        // Phase 4: optional one-time localStorage import when list.length === 0
      } catch (e) {
        console.error("Dashboard load failed:", e);
        if (e instanceof Error) {
          console.error("message:", e.message);
          console.error("stack:", e.stack);
        }
        if (e !== null && typeof e === "object") {
          try {
            console.error(
              "serialized:",
              JSON.stringify(e, Object.getOwnPropertyNames(e as object), 2)
            );
          } catch {
            console.error("could not JSON.stringify error object");
          }
        }
        const detail = formatSupabaseOrUnknownError(e);
        if (!cancelled) {
          alert(`Could not load trades: ${detail}`);
          setTrades([]);
        }
      } finally {
        if (!cancelled) setLoadingTrades(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    if (positionSizeManual) return;
    setSize(calculateAutoPositionSize(accountSize, riskPercent, entry, stop));
  }, [entry, stop, accountSize, riskPercent, positionSizeManual]);

  function handleSetupMistakeToggle(mistake: Mistake) {
    setSelectedSetupMistakes((prev) =>
      prev.includes(mistake)
        ? prev.filter((m) => m !== mistake)
        : [...prev, mistake]
    );
  }

  function handleTarget1AllocChange(raw: string) {
    setTarget1AllocPct(raw);
    const t = raw.trim();
    if (t === "") {
      setTarget2AllocPct("100");
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) return;
    const c = Math.max(0, Math.min(100, n));
    setTarget1AllocPct(String(c));
    setTarget2AllocPct(String(100 - c));
  }

  function handleTarget2AllocChange(raw: string) {
    setTarget2AllocPct(raw);
    const t = raw.trim();
    if (t === "") {
      setTarget1AllocPct("0");
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) return;
    const c = Math.max(0, Math.min(100, n));
    setTarget2AllocPct(String(c));
    setTarget1AllocPct(String(100 - c));
  }

  const koiEval = useMemo(() => {
    return evaluateKoiSetup({
      trend: koiTrend,
      htfLocation: koiHTFLocation,
      zoneSide: koiZoneSide,
      patternStage: koiPatternStage,
      imbalance: koiImbalance,
      freshness,
      timeAtZone: koiTimeAtZone,
      entryPrice: entry,
      stopPrice: stop,
      target1Price: target,
      target2Price: target2,
    });
  }, [
    koiTrend,
    koiHTFLocation,
    koiZoneSide,
    koiPatternStage,
    koiImbalance,
    freshness,
    koiTimeAtZone,
    entry,
    stop,
    target,
    target2,
  ]);

  const koiDisplay: KoiDisplayModel = useMemo(
    () => ({
      totalScore:
        !koiEval.isComplete && koiEval.totalScore === 0
          ? "—"
          : (koiEval.totalScore ?? "—"),
      grade: koiEval.grade ?? "—",
      setupQuality: koiEval.setupQuality ?? "Waiting for input",
      tradeDecision: getKoiTradeDecision({
        isComplete: koiEval.isComplete,
        tradeAllowed: koiEval.tradeAllowed,
        zoneSide: koiZoneSide,
        grade: koiEval.grade,
      }),
      scorePartialHint:
        !koiEval.isComplete &&
        typeof koiEval.totalScore === "number" &&
        koiEval.totalScore > 0,
    }),
    [koiEval, koiZoneSide]
  );

  const engineTradeBias: "Long" | "Short" | null =
    koiEval.tradeAllowed
      ? koiZoneSide === "Demand"
        ? "Long"
        : koiZoneSide === "Supply"
          ? "Short"
          : null
      : null;

  const gradeVisual = useMemo(() => {
    const g = koiDisplay.grade;
    return g === "A+"
      ? {
          color: "#36d399",
          fontWeight: 900,
          opacity: 1,
          boxShadow:
            "0 0 0 1px rgba(54,211,153,.35), 0 0 20px rgba(54,211,153,.30)",
          borderColor: "rgba(54,211,153,.45)",
        }
      : g === "A"
        ? {
            color: "#22c55e",
            fontWeight: 850,
            opacity: 1,
            boxShadow: "none",
            borderColor: "rgba(34,197,94,.35)",
          }
        : g === "B+"
          ? {
              color: "#2dd4bf",
              fontWeight: 780,
              opacity: 1,
              boxShadow: "none",
              borderColor: "rgba(45,212,191,.28)",
            }
          : g === "B"
            ? {
                color: "#e2e8f0",
                fontWeight: 700,
                opacity: 1,
                boxShadow: "none",
                borderColor: "rgba(226,232,240,.22)",
              }
            : g === "C"
              ? {
                  color: "#d8c27a",
                  fontWeight: 650,
                  opacity: 0.85,
                  boxShadow: "none",
                  borderColor: "rgba(216,194,122,.22)",
                }
              : g === "D/F"
                ? {
                    color: "#fb7185",
                    fontWeight: 650,
                    opacity: 0.72,
                    boxShadow: "none",
                    borderColor: "rgba(251,113,133,.32)",
                  }
                : {
                    color: "#9bb0d1",
                    fontWeight: 700,
                    opacity: 0.8,
                    boxShadow: "none",
                    borderColor: "rgba(155,176,209,.20)",
                  };
  }, [koiDisplay.grade]);

  async function handleCreateSetup() {
    const entryNum = Number(entry);
    const stopNum = Number(stop);
    const targetNum = Number(target);
    const target2Num = Number(target2);
    const sizeNum = Number(size);
    const pct1 = Number(target1AllocPct);
    const pct2 = Number(target2AllocPct);
    const setupSide =
      koiEval.tradeAllowed
        ? koiZoneSide === "Demand"
          ? "Long"
          : koiZoneSide === "Supply"
            ? "Short"
            : null
        : null;

    if (!symbol || !entryNum || !stopNum || !targetNum || !target2Num || !sizeNum) {
      alert("Please fill in all setup fields.");
      return;
    }
    if (!sizeNum || sizeNum <= 0) {
      alert("Position size must be greater than zero.");
      return;
    }
    if (
      !Number.isFinite(pct1) ||
      !Number.isFinite(pct2) ||
      Math.abs(pct1 + pct2 - 100) >= 0.0001
    ) {
      alert("Target 1 and Target 2 allocation % must total exactly 100%.");
      return;
    }
    const riskDollars = Math.abs(entryNum - stopNum);
    if (!riskDollars) {
      alert("Entry and stop must differ (risk cannot be zero).");
      return;
    }
    if (!freshness) {
      alert("Select Fresh in the Opportunity Decision Engine.");
      return;
    }
    if (!setupSide) {
      alert(
        "Complete Opportunity Decision Engine (valid opportunity required for Trade Bias)."
      );
      return;
    }

    const newTrade = buildNewTrade({
      symbol,
      entry: entryNum,
      stop: stopNum,
      target: targetNum,
      target2: target2Num,
      pct1,
      pct2,
      size: sizeNum,
      side: setupSide,
      imbalanceQuality,
      freshness,
      htfAlignment,
      locationQuality,
      setupMistakes: selectedSetupMistakes,
    });

    try {
      const supabase = createClient();
      const saved = await createTradeForUser(supabase, user.id, newTrade);
      setTrades((prev) => [saved, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Could not save trade. Check your connection and try again.");
      return;
    }

    setSymbol("");
    setEntry("");
    setStop("");
    setTarget("");
    setTarget2("");
    setTarget1AllocPct("0");
    setTarget2AllocPct("100");
    setAccountSize("");
    setRiskPercent("");
    setSize("");
    setPositionSizeManual(false);
    setImbalanceQuality("Strong");
    setFreshness("");
    setHTFAlignment("Fully Aligned");
    setLocationQuality("Excellent");
    setSelectedSetupMistakes([]);
  }

  async function updateTradeStatus(id: number, status: TradeStatus) {
    try {
      const supabase = createClient();
      const updated = await updateTradeForUser(supabase, user.id, id, {
        status,
      });
      setTrades((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      console.error(e);
      alert("Could not update trade status.");
    }
  }

  async function finalizeTrade(id: number) {
    const exitValue = Number(exitInputs[id]);

    if (!exitValue) {
      alert("Please enter an exit price.");
      return;
    }

    const trade = trades.find((t) => t.id === id);
    if (!trade) return;

    const finalized = finalizeExistingTrade(trade, exitValue);

    try {
      const supabase = createClient();
      const saved = await finalizeTradeForUser(
        supabase,
        user.id,
        id,
        finalized
      );
      setTrades((prev) => prev.map((t) => (t.id === id ? saved : t)));
    } catch (e) {
      console.error(e);
      alert("Could not finalize trade.");
    }
  }

  async function persistStageMistakesForTrade(
    id: number,
    partial: { setup?: Mistake[]; management?: Mistake[] }
  ) {
    const trade = trades.find((t) => t.id === id);
    if (!trade) return;
    const norm = normalizeStageMistakes(trade);
    const setup = partial.setup ?? norm.setup;
    const management = partial.management ?? norm.management;
    try {
      const supabase = createClient();
      const saved = await replaceTradeMistakesForTrade(
        supabase,
        user.id,
        id,
        aggregateMistakesForPersistence(setup, management)
      );
      const rescored = recalculateTradeScores(saved);
      const persisted = await finalizeTradeForUser(
        supabase,
        user.id,
        id,
        rescored
      );
      setTrades((prev) => prev.map((t) => (t.id === id ? persisted : t)));
    } catch (e) {
      console.error(e);
      alert("Could not save mistakes.");
      throw e;
    }
  }

  async function handleSetReviewCompleted(id: number, completed: boolean) {
    try {
      const supabase = createClient();
      const updated = await updateTradeReviewCompleted(
        supabase,
        user.id,
        id,
        completed
      );
      setTrades((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      console.error(e);
      alert("Could not update review status.");
      throw e;
    }
  }

  async function handleClearTrades() {
    const confirmed = window.confirm("Clear all saved trades?");
    if (!confirmed) return;
    try {
      const supabase = createClient();
      await deleteAllTradesForUser(supabase, user.id);
      setTrades([]);
      clearTradesStorage();
      setExitInputs({});
    } catch (e) {
      console.error(e);
      alert("Could not clear trades on the server.");
    }
  }

  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const activeTrades = trades.filter((t) => t.status === "ACTIVE");
  const pendingTrades = trades.filter((t) => t.status === "PENDING");
  const plannedTrades = trades.filter((t) => t.status === "PLANNED");
  const missedTrades = trades.filter((t) => t.status === "MISSED");

  const tradeSetupAllocationValid = useMemo(() => {
    const a = Number(target1AllocPct);
    const b = Number(target2AllocPct);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return Math.abs(a + b - 100) < 0.0001;
  }, [target1AllocPct, target2AllocPct]);

  const tradeSetupDerived = useMemo(() => {
    const entryNum = Number(entry.trim());
    const stopNum = Number(stop.trim());
    const t1 = Number(target.trim());
    const t2 = Number(target2.trim());
    const pct1 = Number(target1AllocPct.trim());
    const pct2 = Number(target2AllocPct.trim());
    const acc = Number(accountSize.trim());
    const rp = Number(riskPercent.trim());

    const riskDist =
      Number.isFinite(entryNum) &&
      Number.isFinite(stopNum) &&
      Math.abs(entryNum - stopNum) > 0
        ? Math.abs(entryNum - stopNum)
        : null;

    let weightedRR: number | null = null;
    if (
      riskDist &&
      Number.isFinite(t1) &&
      Number.isFinite(t2) &&
      Number.isFinite(pct1) &&
      Number.isFinite(pct2) &&
      Math.abs(pct1 + pct2 - 100) < 0.0001
    ) {
      weightedRR = calculateWeightedRewardRiskFromPrices(
        entryNum,
        stopNum,
        t1,
        t2,
        pct1,
        pct2
      );
    }

    let riskAmount: number | null = null;
    if (Number.isFinite(acc) && acc > 0 && Number.isFinite(rp) && rp >= 0) {
      riskAmount = acc * (rp / 100);
    }

    return { weightedRR, riskAmount, riskDist };
  }, [
    entry,
    stop,
    target,
    target2,
    target1AllocPct,
    target2AllocPct,
    accountSize,
    riskPercent,
  ]);

  const avgR = useMemo(() => {
    if (!closedTrades.length) return 0;
    const total = closedTrades.reduce(
      (sum, trade) => sum + (trade.rMultiple ?? 0),
      0
    );
    return total / closedTrades.length;
  }, [closedTrades]);

  const avgRewardRisk = useMemo(() => {
    if (!trades.length) return 0;
    const total = trades.reduce((sum, trade) => sum + trade.rewardRisk, 0);
    return total / trades.length;
  }, [trades]);

  const avgSetupScore = useMemo(() => {
    if (!trades.length) return 0;
    const total = trades.reduce((sum, trade) => sum + trade.setupScore, 0);
    return total / trades.length;
  }, [trades]);

  const avgExecutionScore = useMemo(() => {
    if (!closedTrades.length) return 0;
    const total = closedTrades.reduce(
      (sum, trade) => sum + (trade.executionScore ?? 0),
      0
    );
    return total / closedTrades.length;
  }, [closedTrades]);

  const avgTotalScore = useMemo(() => {
    if (!closedTrades.length) return 0;
    const total = closedTrades.reduce(
      (sum, trade) => sum + (trade.totalScore ?? 0),
      0
    );
    return total / closedTrades.length;
  }, [closedTrades]);

  const disciplineScore = useMemo(() => {
    if (!closedTrades.length) return 100;
    const cleanTrades = closedTrades.filter(
      (trade) => trade.mistakes.length === 0
    ).length;
    return (cleanTrades / closedTrades.length) * 100;
  }, [closedTrades]);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h1 style={styles.headerTitle}>KOI Elite Dashboard</h1>
            <p style={styles.headerText}>
              Trading performance, scoring, and lifecycle control.
            </p>
          </div>
          <UserMenu email={user.email ?? user.id} />
        </div>
      </div>

      <div style={styles.wrap}>
        <AccountContextBar trades={trades} />

        {loadingTrades ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <p style={{ margin: 0 }}>Loading trades…</p>
          </div>
        ) : (
          <>
          <DevelopmentProgressPanel trades={trades} />

          <ThirtyTradeReportPanel trades={trades} />

          <SixtyTradeReportPanel trades={trades} />

          <NinetyTradeReportPanel trades={trades} />

          <TraderScorecard
            avgR={avgR}
            avgRewardRisk={avgRewardRisk}
            avgSetupScore={avgSetupScore}
            avgExecutionScore={avgExecutionScore}
            avgTotalScore={avgTotalScore}
            disciplineScore={disciplineScore}
            plannedCount={plannedTrades.length}
            pendingCount={pendingTrades.length}
            activeCount={activeTrades.length}
            closedCount={closedTrades.length}
            missedCount={missedTrades.length}
          />

          <FocusForTodayPanel trades={trades} />

          <OpportunityDecisionEngine
            koiEval={koiEval}
            koiDisplay={koiDisplay}
            gradeVisual={gradeVisual}
            koiTrend={koiTrend}
            setKoiTrend={setKoiTrend}
            koiHTFLocation={koiHTFLocation}
            setKoiHTFLocation={setKoiHTFLocation}
            koiZoneSide={koiZoneSide}
            setKoiZoneSide={setKoiZoneSide}
            koiPatternStage={koiPatternStage}
            setKoiPatternStage={setKoiPatternStage}
            koiImbalance={koiImbalance}
            setKoiImbalance={setKoiImbalance}
            setImbalanceQuality={setImbalanceQuality}
            freshness={freshness}
            setFreshness={setFreshness}
            koiTimeAtZone={koiTimeAtZone}
            setKoiTimeAtZone={setKoiTimeAtZone}
            entry={entry}
            setEntry={setEntry}
            stop={stop}
            setStop={setStop}
            target={target}
            setTarget={setTarget}
            target2={target2}
            setTarget2={setTarget2}
          />

          <SystemChecksPanel
            showSystemChecks={showSystemChecks}
            setShowSystemChecks={setShowSystemChecks}
            koiEval={koiEval}
            koiZoneSide={koiZoneSide}
          />

          <TradeSetupPanel
            engineTradeBias={engineTradeBias}
            symbol={symbol}
            setSymbol={setSymbol}
            entry={entry}
            setEntry={setEntry}
            stop={stop}
            setStop={setStop}
            target={target}
            setTarget={setTarget}
            target2={target2}
            setTarget2={setTarget2}
            target1AllocPct={target1AllocPct}
            target2AllocPct={target2AllocPct}
            onTarget1AllocChange={handleTarget1AllocChange}
            onTarget2AllocChange={handleTarget2AllocChange}
            tradeSetupAllocationValid={tradeSetupAllocationValid}
            accountSize={accountSize}
            setAccountSize={setAccountSize}
            riskPercent={riskPercent}
            setRiskPercent={setRiskPercent}
            size={size}
            setSize={setSize}
            setPositionSizeManual={setPositionSizeManual}
            positionSizeManual={positionSizeManual}
            tradeSetupDerived={tradeSetupDerived}
            onCreateSetup={handleCreateSetup}
            onClearTrades={handleClearTrades}
            selectedMistakes={selectedSetupMistakes}
            onToggleMistake={handleSetupMistakeToggle}
          />

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Trade Lifecycle</h2>
            {trades.length === 0 ? (
              <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 14 }}>
                No trades yet. Complete the ODE and create a setup to add one.
              </p>
            ) : null}
            <TradeLifecycleTable
              trades={trades}
              exitInputs={exitInputs}
              setExitInputs={setExitInputs}
              updateTradeStatus={updateTradeStatus}
              finalizeTrade={finalizeTrade}
              persistStageMistakesForTrade={persistStageMistakesForTrade}
              setReviewCompleted={handleSetReviewCompleted}
            />
          </div>
          </>
        )}
      </div>
    </main>
  );
}
