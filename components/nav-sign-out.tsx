"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function NavSignOut() {
  const router = useRouter();
  return (
    <button
      className="nav-link-btn"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign Out
    </button>
  );
}
