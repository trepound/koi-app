"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const AuthUserContext = createContext<User | null>(null);

export function useAuthUser(): User {
  const user = useContext(AuthUserContext);
  if (!user) {
    throw new Error("useAuthUser must be used within AuthGate when signed in");
  }
  return user;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(data.user ?? null);
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
        }}
      >
        <p style={{ margin: 0 }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>
  );
}
