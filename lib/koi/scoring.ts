/**
 * Setup-side scoring helpers (ODE / trade setup dimensions).
 * Execution score (0–50 from mistake buckets) lives only in `./mistake-penalties`.
 */
import type {
  Freshness,
  HTFAlignment,
  ImbalanceQuality,
  KoiImbalance,
  KoiPatternStage,
  KoiTimeAtZone,
  KoiTrendRelation,
  LocationQuality,
} from "./types";

export function getImbalancePoints(value: ImbalanceQuality) {
  if (value === "Strong") return 15;
  if (value === "Medium") return 10;
  return 5;
}

export function getFreshnessPoints(value: Freshness) {
  if (value === "Fresh") return 10;
  if (value === "Tested Once") return 6;
  return 2;
}

export function getHTFAlignmentPoints(value: HTFAlignment) {
  if (value === "Fully Aligned") return 10;
  if (value === "Partial") return 6;
  return 2;
}

export function getLocationPoints(value: LocationQuality) {
  if (value === "Excellent") return 10;
  if (value === "Good") return 7;
  if (value === "Average") return 4;
  return 0;
}

export function getKoiTrendPoints(relation: KoiTrendRelation) {
  if (relation === "With Trend") return 15;
  if (relation === "Sideways") return 10;
  return 5;
}

export function getKoiPatternPoints(value: KoiPatternStage) {
  if (value === "Confirmation") return 10;
  return 4;
}

export function getKoiImbalancePoints(value: KoiImbalance) {
  if (value === "Strong") return 8;
  if (value === "Medium") return 5;
  return 2;
}

export function getKoiTimeAtZonePoints(value: KoiTimeAtZone) {
  if (value === "1-3 candles") return 7;
  if (value === "4-6 candles") return 5;
  return 2;
}

export function getAverageRewardRiskScorePoints(rr: number): number {
  if (rr >= 5) return 10;
  if (rr >= 4) return 8;
  if (rr >= 3) return 6;
  if (rr >= 2) return 4;
  if (rr >= 1.5) return 2;
  return 0;
}

export function calculateSetupScore(
  imbalance: ImbalanceQuality,
  fresh: Freshness,
  htf: HTFAlignment,
  location: LocationQuality
) {
  return (
    getImbalancePoints(imbalance) +
    getFreshnessPoints(fresh) +
    getHTFAlignmentPoints(htf) +
    getLocationPoints(location)
  );
}

