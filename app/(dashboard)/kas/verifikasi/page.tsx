"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";

type Anggota = {
  id: number;
  nim: string;
  nama: string;
  no_telepon: string;
};

type Detail = {
  id: number;
  nominal_bayar: number;
  anggota: Anggota;
};

type User = {
  id: number;
  username: string;
  anggota: Anggota;
};

type Pemasukan = {
  id: number;
  nominal_total: number;
  bukti_transfer: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  created_at: string;
  details: Detail[];
  user: User;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID");
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toString(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapAnggota(raw: unknown): Anggota {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nim: toString(data.nim),
    nama: toString(data.nama),
    no_telepon: toString(data.no_telepon ?? data.noTelepon),
  };
}

function mapDetail(raw: unknown): Detail {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nominal_bayar: toNumber(data.nominal_bayar ?? data.nominalBayar),
    anggota: mapAnggota(data.anggota ?? {}),
  };
}

function mapUser(raw: unknown): User {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    username: toString(data.username),
    anggota: mapAnggota(data.anggota ?? {}),
  };
}

function mapPemasukan(raw: unknown): Pemasukan {
  const data = raw as Record<string, unknown>;
  const detailsRaw = Array.isArray(data.details) ? data.details : [];
  return {
    id: toNumber(data.id),
    nominal_total: toNumber(data.nominal_total ?? data.nominalTotal),
    bukti_transfer: toString(data.bukti_transfer ?? data.buktiTransfer),
    status: (data.status as Pemasukan["status"]) ?? "PENDING",
    created_at: toString(data.created_at ?? data.createdAt),
    details: detailsRaw.map((detail: unknown) => mapDetail(detail)),
    user: mapUser(data.user ?? {}),
  };
}

export default function VerifikasiKasPage() {
  const [data, setData] = useState<Pemasukan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<number, string>>({});

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kas/history?status=PENDING");
      const payload = (await res.json()) as { data?: unknown[] };
      const list = Array.isArray(payload.data)
        ? payload.data.map((item: unknown) => mapPemasukan(item))
        : [];
      setData(list);
    } catch {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleVerify(id: number, status: "VERIFIED" | "REJECTED") {
    const alasan_tolak = commentById[id]?.trim() ?? "";
    if (status === "REJECTED" && !alasan_tolak) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/kas/verify/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          alasan_tolak,
          alasanTolak: alasan_tolak,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal memproses.");
      }
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Verifikasi Setoran" />

      {error ? (
        <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <ComponentCard
        title="Setoran Pending"
        desc="Tinjau setoran yang masuk dan berikan keputusan."
      >
        {loading ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat data...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada setoran pending.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item: Pemasukan) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Setoran #{item.id}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.user?.anggota?.nama ?? item.user?.username} ·{" "}
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Rp {formatRupiah(item.nominal_total)}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.details.map((detail: Detail) => (
                    <div
                      key={detail.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400"
                    >
                      <span>
                        {detail.anggota.nama} ({detail.anggota.nim})
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">
                        Rp {formatRupiah(detail.nominal_bayar)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Label>Komentar (wajib jika ditolak)</Label>
                  <TextArea
                    value={commentById[item.id] ?? ""}
                    onChange={(value) =>
                      setCommentById((prev) => ({
                        ...prev,
                        [item.id]: value,
                      }))
                    }
                    rows={2}
                    placeholder="Contoh: bukti transfer tidak jelas."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVerify(item.id, "VERIFIED")}
                    className="inline-flex items-center justify-center rounded-lg bg-success-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-success-600"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleVerify(item.id, "REJECTED")}
                    className="inline-flex items-center justify-center rounded-lg bg-error-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-error-600"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
