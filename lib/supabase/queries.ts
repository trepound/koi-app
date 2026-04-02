import type { SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseTradeRow, Mistake, Trade, TradeStatus } from "@/lib/koi/types";
import {
  isMistake,
  mapDatabaseTradeToTrade,
  mapTradeMistakesToInsertPayload,
  mapTradeToInsertPayload,
  mapTradeToUpdatePayload,
} from "@/lib/koi/trade-mappers";

type TradeRowWithMistakes = DatabaseTradeRow & {
  trade_mistakes?: { mistake: string }[] | null;
};

function mapJoinedRow(row: TradeRowWithMistakes): Trade {
  const nested = row.trade_mistakes ?? [];
  const mistakes: Mistake[] = nested
    .map((m) => m.mistake)
    .filter(isMistake);
  const { trade_mistakes, ...rest } = row;
  void trade_mistakes;
  return mapDatabaseTradeToTrade(rest, mistakes);
}

export async function fetchTradesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("*, trade_mistakes(mistake)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  return (data as TradeRowWithMistakes[]).map(mapJoinedRow);
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
  return mapDatabaseTradeToTrade(data as DatabaseTradeRow, []);
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
    .select("*, trade_mistakes(mistake)")
    .single();

  if (error) throw error;
  return mapJoinedRow(data as TradeRowWithMistakes);
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
    .select("*, trade_mistakes(mistake)")
    .single();

  if (error) throw error;
  return mapJoinedRow(data as TradeRowWithMistakes);
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
    .select("*, trade_mistakes(mistake)")
    .eq("id", tradeId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return mapJoinedRow(data as TradeRowWithMistakes);
}

export async function deleteAllTradesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("trades").delete().eq("user_id", userId);
  if (error) throw error;
}
