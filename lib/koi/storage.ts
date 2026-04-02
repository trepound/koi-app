import { STORAGE_KEY } from "./constants";
import type { Trade } from "./types";

/**
 * Legacy browser persistence (pre–Phase 3). Kept for emergency fallback and a
 * future one-time cloud import when the user is signed in but Supabase has no trades.
 */
export function loadTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Trade[];
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearTradesStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
