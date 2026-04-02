import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 8px", color: "#f1f5f9", fontSize: 26 }}>
          KOI — Sign in
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 15 }}>
          Use your email and password to access your dashboard.
        </p>
      </div>
      {params.error === "auth" ? (
        <p style={{ color: "#fb7185", marginBottom: 16, maxWidth: 360 }}>
          Authentication failed. Try signing in again.
        </p>
      ) : null}
      <AuthForm mode="login" />
      <p style={{ marginTop: 24, fontSize: 14 }}>
        <Link href="/" style={{ color: "#64748b" }}>
          Home
        </Link>
      </p>
    </main>
  );
}
