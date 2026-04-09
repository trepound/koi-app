import type { KoiGrade } from "./types";

export function getSetupGrade(score: number) {
  if (score >= 40) return "A";
  if (score >= 32) return "B";
  if (score >= 24) return "C";
  return "D";
}

/** Setup score on 0–50 scale (pillar-based, setup-mistake-adjusted). */
export function getSetupGradeScaled50(score: number) {
  if (score >= 44) return "A";
  if (score >= 36) return "B";
  if (score >= 27) return "C";
  return "D";
}

export function getTradeGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

/** Final opportunity score (setup max 50 + R:R max 10, cap 60). */
export function getKoiGradeFromFinalOpportunityScore(score: number): KoiGrade {
  if (score >= 55) return "A+";
  if (score >= 50) return "A";
  if (score >= 44) return "B+";
  if (score >= 36) return "B";
  if (score >= 30) return "C";
  return "D/F";
}

export function getKoiRecommendedAction(grade: KoiGrade): string {
  if (grade === "A+" || grade === "A") return "Enter";
  if (grade === "B+") return "Watch closely";
  if (grade === "B") return "Wait for confirmation";
  return "No Trade";
}

export function getKoiSetupQuality(grade: KoiGrade): string {
  if (grade === "A+" || grade === "A") return "Premium setup";
  if (grade === "B+") return "High probability";
  if (grade === "B") return "Quality setup";
  if (grade === "C") return "Borderline setup";
  return "Low-quality / avoid";
}
