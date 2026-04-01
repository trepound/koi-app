"use client";

import type { Dispatch, SetStateAction } from "react";
import type { KoiEvalResult, KoiZoneSide } from "@/lib/koi/types";
import { odeStyles as koiStyles } from "@/lib/koi/dashboard-styles";

export function SystemChecksPanel({
  showSystemChecks,
  setShowSystemChecks,
  koiEval,
  koiZoneSide,
}: {
  showSystemChecks: boolean;
  setShowSystemChecks: Dispatch<SetStateAction<boolean>>;
  koiEval: KoiEvalResult;
  koiZoneSide: KoiZoneSide;
}) {
  return (
    <div style={koiStyles.card}>
      <div style={koiStyles.panelHeader}>
        <div>
          <div style={koiStyles.title}>System Checks</div>
          <div style={koiStyles.subtitle}>
            Validation logic (collapsed by default).
          </div>
        </div>
      </div>
      <button
        style={koiStyles.checksToggle}
        onClick={() => setShowSystemChecks((prev) => !prev)}
      >
        <span>System Checks</span>
        <span>{showSystemChecks ? "Hide" : "Show"}</span>
      </button>
      {!showSystemChecks && (
        <div style={koiStyles.checksHint}>
          Validation logic is collapsed to keep focus on decision flow.
        </div>
      )}
      {showSystemChecks && (
        <div style={koiStyles.step0Box}>
          <div style={koiStyles.step0Title}>System Checks</div>
          <div style={koiStyles.checkGrid}>
            <div style={koiStyles.checkItem}>
              <div style={koiStyles.checkLabel}>Demand + Middle + Sideways</div>
              <div
                style={
                  koiEval.step0Checks.middleSidewaysFail
                    ? koiStyles.checkStatusFail
                    : koiStyles.checkStatusPass
                }
              >
                {koiEval.isComplete &&
                koiZoneSide === "Demand" &&
                koiEval.step0Checks.middleSidewaysFail
                  ? "FAIL"
                  : "—"}
              </div>
            </div>
            <div style={koiStyles.checkItem}>
              <div style={koiStyles.checkLabel}>Supply + Middle + Sideways</div>
              <div
                style={
                  koiEval.step0Checks.middleSidewaysFail
                    ? koiStyles.checkStatusFail
                    : koiStyles.checkStatusPass
                }
              >
                {koiEval.isComplete &&
                koiZoneSide === "Supply" &&
                koiEval.step0Checks.middleSidewaysFail
                  ? "FAIL"
                  : "—"}
              </div>
            </div>
            <div style={koiStyles.checkItem}>
              <div style={koiStyles.checkLabel}>All other setups</div>
              <div
                style={
                  koiEval.isComplete && koiEval.step0Pass
                    ? koiStyles.checkStatusPass
                    : koiStyles.checkStatusFail
                }
              >
                {koiEval.isComplete && koiEval.tradeAllowed ? "PASS" : "—"}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "10px",
              color: "#9bb0d1",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {koiEval.step0Reason}
          </div>
        </div>
      )}
    </div>
  );
}
