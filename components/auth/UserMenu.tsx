"use client";

import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await signOutUser(supabase);
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        fontSize: 14,
        color: "#94a3b8",
      }}
    >
      <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid rgba(148,163,184,0.35)",
          background: "transparent",
          color: "#e2e8f0",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Sign out
      </button>
    </div>
  );
}
