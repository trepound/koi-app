"use client";

import { useState, type ReactNode } from "react";

export function KoiInputHelp({
  helpText,
  children,
  variant = "input",
}: {
  helpText: string;
  children: ReactNode;
  /** Select controls need the icon inset from the native dropdown arrow */
  variant?: "input" | "select";
}) {
  const [show, setShow] = useState(false);
  const iconRight = variant === "select" ? 26 : 8;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: iconRight,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "11px",
          fontWeight: 800,
          color: "#7dd3fc",
          opacity: 0.9,
          cursor: "help",
          userSelect: "none",
          lineHeight: 1,
          zIndex: 2,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        (?)
        {show ? (
          <span
            role="tooltip"
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "6px 9px",
              maxWidth: 232,
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1.35,
              color: "#0f172a",
              background: "rgba(240, 249, 255, 0.98)",
              border: "1px solid rgba(125, 211, 252, 0.45)",
              borderRadius: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,.22)",
              textTransform: "none",
              letterSpacing: "0.01em",
              zIndex: 100,
              whiteSpace: "normal",
              textAlign: "left",
              pointerEvents: "none",
            }}
          >
            {helpText}
          </span>
        ) : null}
      </span>
    </div>
  );
}
