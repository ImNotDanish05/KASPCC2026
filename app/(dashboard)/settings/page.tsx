"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

type SettingsResponse = {
  data?: {
    id: number;
    target_kas_per_bulan: number;
    tanggal_mulai: string;
    tanggal_akhir: string;
  };
  error?: string;
};

function toDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function SettingsPage() {
  const [targetKas, setTargetKas] = useState<string>("");
  const [tanggalMulai, setTanggalMulai] = useState<string>("");
  const [tanggalAkhir, setTanggalAkhir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((payload: SettingsResponse) => {
        if (!active) return;
        if (!payload.data) {
          setError(payload.error ?? "Pengaturan tidak ditemukan.");
          return;
        }
        setTargetKas(String(payload.data.target_kas_per_bulan ?? ""));
        setTanggalMulai(toDateInput(payload.data.tanggal_mulai));
        setTanggalAkhir(toDateInput(payload.data.tanggal_akhir));
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const targetValue = Number(targetKas);
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError("Target KAS per bulan harus lebih dari 0.");
      return;
    }

    if (!tanggalMulai || !tanggalAkhir) {
      setError("Tanggal mulai dan akhir wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_kas_per_bulan: targetValue,
          tanggal_mulai: tanggalMulai,
          tanggal_akhir: tanggalAkhir,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as SettingsResponse | null;
        throw new Error(body?.error ?? "Gagal memperbarui pengaturan.");
      }

      const payload = (await res.json()) as SettingsResponse;
      if (payload.data) {
        setTargetKas(String(payload.data.target_kas_per_bulan));
        setTanggalMulai(toDateInput(payload.data.tanggal_mulai));
        setTanggalAkhir(toDateInput(payload.data.tanggal_akhir));
      }
      setMessage("Pengaturan berhasil diperbarui.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Global Settings" />

      <ComponentCard
        title="Pengaturan KAS"
        desc="Kelola target KAS dan periode aktif pembayaran."
      >
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Memuat pengaturan...
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Target KAS per Bulan</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={targetKas}
                  onChange={(event) => setTargetKas(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400">
                Nominal dalam rupiah.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tanggal Mulai</Label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(event) => setTanggalMulai(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <Label>Tanggal Akhir</Label>
                <input
                  type="date"
                  value={tanggalAkhir}
                  onChange={(event) => setTanggalAkhir(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
                {message}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          </form>
        )}
      </ComponentCard>
    </div>
  );
}
