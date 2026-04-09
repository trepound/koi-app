/** Top dashboard account / risk context (not full portfolio management). */

export const ACCOUNT_CONTEXT_STORAGE_KEY = "koi-account-context-v1";

export const ACCOUNT_CONTEXT_DEFAULTS = {
  accountSize: 25_000,
  riskPerTradePct: 1.0,
  maxExposurePct: 3.0,
} as const;

export type AccountContextSnapshot = {
  accountSize: number;
  riskPerTradePct: number;
  maxExposurePct: number;
};

function clampPositive(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function clampPct(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(100, n);
}

export function loadAccountContextFromStorage(): AccountContextSnapshot {
  if (typeof window === "undefined") {
    return { ...ACCOUNT_CONTEXT_DEFAULTS };
  }
  try {
    const raw = localStorage.getItem(ACCOUNT_CONTEXT_STORAGE_KEY);
    if (!raw) return { ...ACCOUNT_CONTEXT_DEFAULTS };
    const p = JSON.parse(raw) as Partial<AccountContextSnapshot>;
    return {
      accountSize: clampPositive(
        Number(p.accountSize),
        ACCOUNT_CONTEXT_DEFAULTS.accountSize
      ),
      riskPerTradePct: clampPct(
        Number(p.riskPerTradePct),
        ACCOUNT_CONTEXT_DEFAULTS.riskPerTradePct
      ),
      maxExposurePct: clampPct(
        Number(p.maxExposurePct),
        ACCOUNT_CONTEXT_DEFAULTS.maxExposurePct
      ),
    };
  } catch {
    return { ...ACCOUNT_CONTEXT_DEFAULTS };
  }
}

export function saveAccountContextToStorage(s: AccountContextSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNT_CONTEXT_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}
