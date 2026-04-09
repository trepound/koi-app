import type { Mistake } from "./types";
import { isSetupStageMistake } from "./stage-mistakes";

/** Point deductions from raw pillar setup (0–45) per setup-stage mistake. */
export const SETUP_MISTAKE_PENALTY_POINTS: Partial<Record<Mistake, number>> = {
  "Early Entry": 3,
  "Chased Price": 4,
  "Ignored Zone": 4,
  "Countertrend Force": 4,
};

export function sumSetupMistakePenalties(setupMistakes: Mistake[]): number {
  let sum = 0;
  for (const m of setupMistakes) {
    if (!isSetupStageMistake(m)) continue;
    const p = SETUP_MISTAKE_PENALTY_POINTS[m];
    if (typeof p === "number") sum += p;
  }
  return sum;
}

/**
 * Pillar setup score is 0–45. Setup-stage mistakes subtract, then scale to 0–50
 * for KOI setup score display and storage.
 */
export function calculateScaledSetupScore(
  rawPillarSetupScore: number,
  setupMistakes: Mistake[]
): number {
  const raw = Math.max(0, Math.min(45, rawPillarSetupScore));
  const penalized = Math.max(0, raw - sumSetupMistakePenalties(setupMistakes));
  if (raw <= 0) return 0;
  return Math.min(50, Math.round((penalized / 45) * 50));
}
