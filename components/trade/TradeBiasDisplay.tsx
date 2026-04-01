"use client";

import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";

export function TradeBiasDisplay({
  engineTradeBias,
}: {
  engineTradeBias: "Long" | "Short" | null;
}) {
  return (
    <>
      <div style={{ ...styles.small, marginBottom: "8px", fontWeight: 700 }}>
        Trade Bias
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          style={{
            ...styles.sideButton,
            ...(engineTradeBias === "Long" ? styles.longActive : {}),
            ...(engineTradeBias
              ? {}
              : {
                  background: "#f8fafc",
                  color: "#667085",
                  border: "1px solid #cfd8e3",
                }),
            cursor: "default",
          }}
          disabled
        >
          LONG
        </button>

        <button
          style={{
            ...styles.sideButton,
            ...(engineTradeBias === "Short" ? styles.shortActive : {}),
            ...(engineTradeBias
              ? {}
              : {
                  background: "#f8fafc",
                  color: "#667085",
                  border: "1px solid #cfd8e3",
                }),
            cursor: "default",
          }}
          disabled
        >
          SHORT
        </button>
      </div>
    </>
  );
}
