import { ALL_KNOWN_MISTAKE_TAGS } from "./constants";
import type { Mistake } from "./types";

const KNOWN = new Set<string>(ALL_KNOWN_MISTAKE_TAGS);

/**
 * Renames only where the behavior and scoring intent match the modern tag.
 * (Display uses the modern string after load — optional future: store raw.)
 */
const LEGACY_RENAME_EQUIVALENT: Record<string, Mistake> = {
  "Cut Winner Early": "Cut Early",
  "Emotional Trade": "Emotional",
  Overtraded: "Oversized",
  "Let Loss Grow": "Moved Stop",
  "Ignored Target": "Cut Early",
  "No Confirmation": "Early Entry",
  "Poor Risk/Reward": "Chased Price",
};

/**
 * Parse a stored mistake string: modern catalog, preserved legacy labels, or
 * equivalent rename. Returns null only for unknown strings.
 */
export function parseMistakeFromDb(raw: string): Mistake | null {
  if (KNOWN.has(raw)) return raw as Mistake;
  const renamed = LEGACY_RENAME_EQUIVALENT[raw];
  if (renamed) return renamed;
  return null;
}

/** Dedupe while preserving first-seen order. */
export function normalizeMistakesFromDb(raw: readonly string[]): Mistake[] {
  const out: Mistake[] = [];
  const seen = new Set<Mistake>();
  for (const s of raw) {
    const m = parseMistakeFromDb(String(s));
    if (m && !seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  return out;
}
