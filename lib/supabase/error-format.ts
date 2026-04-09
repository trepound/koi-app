/** Readable string for Supabase PostgrestError, Auth errors, Error, or unknown. */
export function formatSupabaseOrUnknownError(e: unknown): string {
  if (e instanceof Error) {
    const x = e as Error & { code?: string; details?: string; hint?: string };
    const parts = [x.message];
    if (typeof x.code === "string" && x.code) parts.push(`code: ${x.code}`);
    if (typeof x.details === "string" && x.details)
      parts.push(`details: ${x.details}`);
    if (typeof x.hint === "string" && x.hint) parts.push(`hint: ${x.hint}`);
    return parts.join(" — ");
  }

  if (e !== null && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const msg = o.message;
    if (typeof msg === "string" && msg.length > 0) {
      const bits = [msg];
      if (typeof o.code === "string" && o.code) bits.push(`code: ${o.code}`);
      if (typeof o.details === "string" && o.details)
        bits.push(`details: ${o.details}`);
      if (typeof o.hint === "string" && o.hint) bits.push(`hint: ${o.hint}`);
      return bits.join(" — ");
    }
    try {
      return JSON.stringify(e, Object.getOwnPropertyNames(e as object));
    } catch {
      return String(e);
    }
  }

  return String(e);
}
