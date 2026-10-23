"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ accessNote }: { accessNote: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) {
    e.preventDefault();
    // Read the fields at submit time rather than from React state:
    // browser autofill can fill them without firing change events.
    const form = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "That email and password combination didn't work."
      );
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <a className="wordmark wordmark-ink" href="/">
          Winterhaven Village
        </a>
        <h1 className="auth-title">Resident Sign In</h1>
        <p className="auth-sub">
          Welcome back, neighbor. Sign in to reach the directory and community
          board.
        </p>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn-block" type="submit" disabled={pending}>
            {pending ? "Signing in" : "Sign In"}
          </button>
        </form>
        <p className="auth-note">{accessNote}</p>
      </div>
    </main>
  );
}
