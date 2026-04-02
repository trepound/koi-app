import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

export async function signUpWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
  emailRedirectTo?: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
}

export async function signInWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutUser(supabase: SupabaseClient) {
  return supabase.auth.signOut();
}

export async function getCurrentUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error };
  }
  return { user: data.user ?? null, error: null };
}
