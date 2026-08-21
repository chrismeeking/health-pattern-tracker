"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-16 w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Homeboard
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
        Admin login
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Enter the household admin password to manage the schedule.
      </p>

      <label className="mt-6 mb-1.5 block text-sm font-semibold text-[var(--muted)]" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        className="w-full rounded-2xl bg-[var(--panel)] px-4 py-3.5 text-lg outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--accent)]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && (
        <p className="mt-3 rounded-2xl bg-[#fde8e8] px-4 py-3 text-[#7a1224]">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="touch-target mt-5 w-full rounded-2xl bg-[var(--accent)] py-3.5 text-lg font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
