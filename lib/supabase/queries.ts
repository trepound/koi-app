import type { SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseTradeRow, Mistake, Trade, TradeStatus } from "@/lib/koi/types";
import {
  isMistake,
  mapDatabaseTradeToTrade,
  mapTradeMistakesToInsertPayload,
  mapTradeToInsertPayload,
  mapTradeToUpdatePayload,
} from "@/lib/koi/trade-mappers";

function normalizeTradeId(id: unknown): number | null {
  if (typeof id === "number" && Number.isFinite(id) && Number.isSafeInteger(id)) {
    return id;
  }
  if (typeof id === "string" && id.trim() !== "") {
    const n = Number(id);
    if (Number.isFinite(n) && Number.isSafeInteger(n)) return n;
  }
  return null;
}

/**
 * Load mistakes for many trades in one query (no PostgREST embed — avoids
 * "could not find relationship" / schema cache issues).
 */
async function loadMistakesMapForTrades(
  supabase: SupabaseClient,
  tradeIds: unknown[]
): Promise<Map<number, Mistake[]>> {
  const ids = tradeIds
    .map(normalizeTradeId)
    .filter((id): id is number => id !== null);
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("trade_mistakes")
    .select("trade_id, mistake")
    .in("trade_id", ids);

  if (error) throw error;

  const map = new Map<number, Mistake[]>();
  for (const raw of data ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as { trade_id?: unknown; mistake?: unknown };
    const tradeId = normalizeTradeId(rec.trade_id);
    const mistakeStr = rec.mistake;
    if (tradeId === null || typeof mistakeStr !== "string") continue;
    if (!isMistake(mistakeStr)) continue;
    const list = map.get(tradeId) ?? [];
    list.push(mistakeStr);
    map.set(tradeId, list);
  }
  return map;
}

function mapTradeDbToUi(
  row: DatabaseTradeRow,
  mistakeMap: Map<number, Mistake[]>
): Trade {
  const nid = normalizeTradeId(row.id);
  const mistakes = nid !== null ? mistakeMap.get(nid) ?? [] : [];
  return mapDatabaseTradeToTrade(row, mistakes);
}

async function mapSingleTradeRowWithMistakes(
  supabase: SupabaseClient,
  row: DatabaseTradeRow
): Promise<Trade> {
  const mistakeMap = await loadMistakesMapForTrades(supabase, [row.id]);
  return mapTradeDbToUi(row, mistakeMap);
}

export async function fetchTradesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Trade[]> {
  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (tradesError) throw tradesError;
  if (!trades?.length) return [];

  const mistakeMap = await loadMistakesMapForTrades(
    supabase,
    trades.map((t) => t.id)
  );

  const out: Trade[] = [];
  for (const row of trades) {
    try {
      out.push(mapTradeDbToUi(row as DatabaseTradeRow, mistakeMap));
    } catch (rowErr) {
      console.warn(
        "[KOI fetchTradesForUser] skipped row (mapping failed):",
        row?.id,
        rowErr
      );
    }
  }
  return out;
}

export async function createTradeForUser(
  supabase: SupabaseClient,
  userId: string,
  trade: Trade
): Promise<Trade> {
  const insertRow = mapTradeToInsertPayload(userId, trade);
  const { data, error } = await supabase
    .from("trades")
    .insert(insertRow)
    .select()
    .single();

  if (error) throw error;
  const row = data as DatabaseTradeRow;
  const newId = normalizeTradeId(row.id);
  if (newId !== null && trade.mistakes.length > 0) {
    const rows = mapTradeMistakesToInsertPayload(newId, trade.mistakes);
    const { error: insErr } = await supabase.from("trade_mistakes").insert(rows);
    if (insErr) throw insErr;
  }
  return mapSingleTradeRowWithMistakes(supabase, row);
}

export async function updateTradeForUser(
  supabase: SupabaseClient,
  userId: string,
  tradeId: number,
  updates: { status: TradeStatus }
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .update({ status: updates.status })
    .eq("id", tradeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapSingleTradeRowWithMistakes(supabase, data as DatabaseTradeRow);
}

export async function finalizeTradeForUser(
  supabase: SupabaseClient,
  userId: string,
  tradeId: number,
  finalizedTrade: Trade
): Promise<Trade> {
  const payload = mapTradeToUpdatePayload(finalizedTrade);
  const { data, error } = await supabase
    .from("trades")
    .update(payload)
    .eq("id", tradeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapSingleTradeRowWithMistakes(supabase, data as DatabaseTradeRow);
}

export async function replaceTradeMistakesForTrade(
  supabase: SupabaseClient,
  userId: string,
  tradeId: number,
  mistakes: Mistake[]
): Promise<Trade> {
  const { error: delErr } = await supabase
    .from("trade_mistakes")
    .delete()
    .eq("trade_id", tradeId);

  if (delErr) throw delErr;

  if (mistakes.length > 0) {
    const rows = mapTradeMistakesToInsertPayload(tradeId, mistakes);
    const { error: insErr } = await supabase.from("trade_mistakes").insert(rows);
    if (insErr) throw insErr;
  }

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return mapSingleTradeRowWithMistakes(supabase, data as DatabaseTradeRow);
}

export async function deleteAllTradesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("trades").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function updateTradeReviewCompleted(
  supabase: SupabaseClient,
  userId: string,
  tradeId: number,
  reviewCompleted: boolean
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .update({ review_completed: reviewCompleted })
    .eq("id", tradeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapSingleTradeRowWithMistakes(supabase, data as DatabaseTradeRow);
}
