"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email,
      password,
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
    <div className="auth-page">
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
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-block" type="submit" disabled={pending}>
            {pending ? "Signing in" : "Sign In"}
          </button>
        </form>
        <p className="auth-note">
          Accounts are created by the HOA for Winterhaven Village residents.
          Need access or forgot your password? Contact a board member and
          we&rsquo;ll get you set up.
        </p>
      </div>
    </div>
  );
}
