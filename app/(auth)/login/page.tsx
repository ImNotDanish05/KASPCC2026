"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login gagal.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            KAS Management System
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Masuk untuk mengelola kas organisasi secara rapi dan terstruktur.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Sistem ini membantu Bendahara Eksternal dan Internal memantau
            pemasukan, verifikasi, serta status pembayaran anggota dengan cepat.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Role-based access
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Pencatatan transparan
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Laporan mudah dipantau
            </span>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Login</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Masukkan username dan password yang sudah diberikan.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Username
              </label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                placeholder="contoh: bendahara"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                placeholder="Password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
