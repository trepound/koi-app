"use client";

import { useMemo, useState } from "react";
import type { Mistake } from "@/lib/koi/types";

type Props = {
  setupMistakes?: Mistake[];
  managementMistakes?: Mistake[];
  mistakes?: Mistake[]; // legacy fallback
};

const MANAGEMENT_KEYWORDS = [
  "stop",
  "exit",
  "target",
  "hold",
  "close",
  "management",
  "moved stop",
  "cut winner",
  "let loser run",
  "no stop",
  "overheld",
  "underheld",
];

function classifyLegacyMistakes(mistakes: Mistake[]) {
  const setup: Mistake[] = [];
  const management: Mistake[] = [];

  for (const mistake of mistakes) {
    const lower = mistake.toLowerCase();

    const isManagement = MANAGEMENT_KEYWORDS.some((keyword) =>
      lower.includes(keyword),
    );

    if (isManagement) {
      management.push(mistake);
    } else {
      setup.push(mistake);
    }
  }

  return { setup, management };
}

export function MistakeSummary({
  setupMistakes,
  managementMistakes,
  mistakes,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const derived = useMemo(() => {
    const explicitSetup = setupMistakes ?? [];
    const explicitManagement = managementMistakes ?? [];

    if (explicitSetup.length > 0 || explicitManagement.length > 0) {
      return {
        setup: explicitSetup,
        management: explicitManagement,
      };
    }

    return classifyLegacyMistakes(mistakes ?? []);
  }, [setupMistakes, managementMistakes, mistakes]);

  const hasSetup = derived.setup.length > 0;
  const hasManagement = derived.management.length > 0;
  const hasMistakes = hasSetup || hasManagement;

  let display = "None";

  if (hasMistakes) {
    if (hasSetup && hasManagement) {
      display = "🔴🔴";
    } else {
      display = "🟡";
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        disabled={!hasMistakes}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: hasMistakes ? "pointer" : "default",
          font: "inherit",
          color: "inherit",
        }}
      >
        <span>{display}</span>
        {hasMistakes && <span>{expanded ? "▼" : "▶"}</span>}
      </button>

      {expanded && hasMistakes && (
        <div style={{ marginTop: "8px" }}>
          {hasSetup && (
            <div style={{ marginBottom: hasManagement ? "8px" : 0 }}>
              <div style={{ fontWeight: 600 }}>Setup</div>
              {derived.setup.map((m, i) => (
                <div key={`setup-${i}`}>- {m}</div>
              ))}
            </div>
          )}

          {hasManagement && (
            <div>
              <div style={{ fontWeight: 600 }}>Management</div>
              {derived.management.map((m, i) => (
                <div key={`management-${i}`}>- {m}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
