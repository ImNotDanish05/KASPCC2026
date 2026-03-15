"use client";

import { useState } from "react";

type TarikDanaResponse = {
  data: {
    id: number;
  };
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function TarikDanaPage() {
  const [nominal, setNominal] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [buktiNota, setBuktiNota] = useState<string>("");
  const [buktiFileName, setBuktiFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File | null) {
    if (!file) {
      setBuktiFileName(null);
      setBuktiNota("");
      return;
    }
    setBuktiFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBuktiNota(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setMessage(null);
    setError(null);

    const nominalValue = Number(nominal);
    if (!Number.isFinite(nominalValue) || nominalValue <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }

    if (!keterangan.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }

    if (!buktiNota) {
      setError("Bukti nota wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tarik-dana", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nominal: nominalValue,
          keterangan: keterangan.trim(),
          bukti_nota: buktiNota,
          buktiNota: buktiNota,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal mengajukan tarik dana.");
      }

      const payload = (await response.json()) as TarikDanaResponse;
      setMessage(`Pengajuan berhasil dikirim. ID: ${payload.data.id}`);
      setNominal("");
      setKeterangan("");
      setBuktiNota("");
      setBuktiFileName(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Pengajuan Tarik Dana
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ajukan penarikan dana kas dengan nominal, alasan, dan bukti nota.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Nominal</label>
              <input
                type="number"
                min={0}
                value={nominal}
                onChange={(event) => setNominal(event.target.value)}
                placeholder="Contoh: 500000"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                Total: Rp {formatRupiah(Number(nominal) || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Keterangan
              </label>
              <textarea
                rows={4}
                value={keterangan}
                onChange={(event) => setKeterangan(event.target.value)}
                placeholder="Contoh: pembelian peralatan acara"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Bukti Nota
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0] ?? null)
                }
                className="w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
              />
              {buktiFileName ? (
                <div className="text-xs text-zinc-500">
                  File terpilih: {buktiFileName}
                </div>
              ) : null}
              <input
                value={buktiNota}
                onChange={(event) => setBuktiNota(event.target.value)}
                placeholder="Atau masukkan URL bukti nota"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Ringkasan</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <div className="flex items-center justify-between">
              <span>Nominal</span>
              <span className="font-semibold text-zinc-900">
                Rp {formatRupiah(Number(nominal) || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Pending
              </span>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {submitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      </div>
    </div>
  );
}
