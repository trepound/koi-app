"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { getCoachingForMistake } from "@/lib/koi/mistake-coaching";
import { getTradeReviewSummaryFromStages } from "@/lib/koi/trade-review-summary";
import type { Mistake } from "@/lib/koi/types";

const box: CSSProperties = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e8eef6",
  background: "#fafbfd",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#344054",
};

const summaryStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#0d1b3d",
  cursor: "pointer",
};

const heading: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#667085",
  marginBottom: 6,
};

export function TradeFinalReviewCoaching({
  setupMistakes,
  managementMistakes,
}: {
  setupMistakes: Mistake[];
  managementMistakes: Mistake[];
}) {
  const model = useMemo(
    () =>
      getTradeReviewSummaryFromStages(setupMistakes, managementMistakes),
    [setupMistakes, managementMistakes]
  );

  const summaryTitle = model.hasMistakes
    ? `Final review summary · ${model.topMistakes.length} highest-impact ${model.topMistakes.length === 1 ? "issue" : "issues"}`
    : "Final review summary · Clean tag";

  return (
    <details style={box}>
      <summary style={summaryStyle}>{summaryTitle}</summary>

      <div style={{ marginTop: 12 }}>
        {model.hasMistakes ? (
          <>
            <div style={heading}>Most impactful (by KOI penalty)</div>
            <ul style={{ margin: "0 0 14px", paddingLeft: 18 }}>
              {model.topMistakes.map((row) => {
                const c = getCoachingForMistake(row.mistake);
                return (
                  <li key={row.mistake} style={{ marginBottom: 8 }}>
                    <strong>{row.mistake}</strong>
                    {row.source === "both" ? (
                      <span style={{ color: "#667085" }}> (setup & management)</span>
                    ) : null}
                    <div style={{ marginTop: 4 }}>{c.primaryLine}</div>
                  </li>
                );
              })}
            </ul>

            <div style={{ ...heading, marginTop: 4 }}>Focus for next trade</div>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "#fff",
                border: "1px solid #e8eef6",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6, color: "#0d1b3d" }}>
                Primary
              </div>
              <p style={{ margin: "0 0 10px" }}>{model.focusPrimaryLine}</p>
              <div style={{ fontWeight: 800, marginBottom: 6, color: "#0d1b3d" }}>
                KOI reflection
              </div>
              <p style={{ margin: "0 0 10px" }}>{model.focusKoiReflection}</p>
              <div style={{ fontWeight: 800, marginBottom: 6, color: "#0d1b3d" }}>
                Action
              </div>
              <p style={{ margin: 0 }}>{model.focusAction}</p>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: "#475467" }}>{model.positiveMessage}</p>
        )}
      </div>
    </details>
  );
}
