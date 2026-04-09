import type { Mistake } from "./types";

export const EXECUTION_BUCKET_MAX = {
  discipline: 20,
  sizing: 15,
  emotional: 15,
} as const;

export const MISTAKE_BUCKETS: Record<
  Mistake,
  { bucket: "discipline" | "sizing" | "emotional"; penalty: number }
> = {
  "Early Entry": { bucket: "discipline", penalty: 3 },
  "Chased Price": { bucket: "discipline", penalty: 4 },
  "Ignored Zone": { bucket: "discipline", penalty: 4 },
  "Countertrend Force": { bucket: "discipline", penalty: 4 },
  "Cut Early": { bucket: "discipline", penalty: 3 },
  "Moved Stop": { bucket: "discipline", penalty: 5 },
  Oversized: { bucket: "sizing", penalty: 6 },
  "Undersized Position": { bucket: "sizing", penalty: 2 },
  Emotional: { bucket: "emotional", penalty: 6 },
};

export function calculateExecutionBreakdown(mistakes: Mistake[]) {
  let discipline: number = EXECUTION_BUCKET_MAX.discipline;
  let sizing: number = EXECUTION_BUCKET_MAX.sizing;
  let emotional: number = EXECUTION_BUCKET_MAX.emotional;

  for (const mistake of mistakes) {
    const config = MISTAKE_BUCKETS[mistake];
    if (!config) continue;

    if (config.bucket === "discipline") {
      discipline -= config.penalty;
    } else if (config.bucket === "sizing") {
      sizing -= config.penalty;
    } else if (config.bucket === "emotional") {
      emotional -= config.penalty;
    }
  }

  discipline = Math.max(0, discipline);
  sizing = Math.max(0, sizing);
  emotional = Math.max(0, emotional);

  return {
    discipline,
    sizing,
    emotional,
    executionScore: discipline + sizing + emotional,
  };
}

export function calculateExecutionScore(mistakes: Mistake[]) {
  return calculateExecutionBreakdown(mistakes).executionScore;
}
