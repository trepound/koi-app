"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setPending(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signErr } = await signUpWithEmail(
          supabase,
          email.trim(),
          password,
          `${window.location.origin}/auth/callback`
        );
        if (signErr) {
          setError(signErr.message);
          return;
        }
        if (data.user && !data.session) {
          setMessage(
            "Check your email to confirm your account, then sign in."
          );
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error: inErr } = await signInWithEmail(
        supabase,
        email.trim(),
        password
      );
      if (inErr) {
        setError(inErr.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const other = mode === "login" ? "/signup" : "/login";
  const otherLabel = mode === "login" ? "Create an account" : "Sign in instead";

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        maxWidth: 360,
        width: "100%",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.85 }}>Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "rgba(15,23,42,0.6)",
            color: "#e2e8f0",
          }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, opacity: 0.85 }}>Password</span>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "rgba(15,23,42,0.6)",
            color: "#e2e8f0",
          }}
        />
      </label>
      {error ? (
        <p style={{ margin: 0, fontSize: 14, color: "#fb7185" }}>{error}</p>
      ) : null}
      {message ? (
        <p style={{ margin: 0, fontSize: 14, color: "#4ade80" }}>{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#fff",
        }}
      >
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
      </button>
      <p style={{ margin: 0, fontSize: 14, textAlign: "center" }}>
        <Link href={other} style={{ color: "#93c5fd" }}>
          {otherLabel}
        </Link>
      </p>
    </form>
  );
}
