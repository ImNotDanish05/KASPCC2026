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

type User = {
  id: number;
  username: string;
  anggota: Anggota;
};

type Pengeluaran = {
  id: number;
  nominal: number;
  keterangan: string;
  bukti_nota: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
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

function mapUser(raw: unknown): User {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    username: toString(data.username),
    anggota: mapAnggota(data.anggota ?? {}),
  };
}

function mapPengeluaran(raw: unknown): Pengeluaran {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nominal: toNumber(data.nominal),
    keterangan: toString(data.keterangan),
    bukti_nota: toString(data.bukti_nota ?? data.buktiNota),
    status: (data.status as Pengeluaran["status"]) ?? "PENDING",
    created_at: toString(data.created_at ?? data.createdAt),
    user: mapUser(data.user ?? {}),
  };
}

export default function TarikDanaApprovePage() {
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<number, string>>({});

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tarik-dana/history?status=PENDING");
      const payload = (await res.json()) as { data?: unknown[] };
      const list = Array.isArray(payload.data)
        ? payload.data.map((item: unknown) => mapPengeluaran(item))
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

  async function handleApprove(id: number, status: "APPROVED" | "REJECTED") {
    const alasan_tolak = commentById[id]?.trim() ?? "";
    if (status === "REJECTED" && !alasan_tolak) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/tarik-dana/approve/${id}`, {
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
      <PageBreadcrumb pageTitle="Persetujuan Tarik Dana" />

      {error ? (
        <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <ComponentCard
        title="Pengajuan Pending"
        desc="Verifikasi dan berikan keputusan untuk setiap pengajuan dana."
      >
        {loading ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat data...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada pengajuan pending.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item: Pengeluaran) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Pengajuan #{item.id}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.user?.anggota?.nama ?? item.user?.username} ·{" "}
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Rp {formatRupiah(item.nominal)}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
                  <div className="font-semibold text-gray-800 dark:text-white/90">
                    Keterangan
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.keterangan}
                  </p>
                </div>

                <div className="mt-3">
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
                    placeholder="Contoh: bukti nota kurang jelas."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApprove(item.id, "APPROVED")}
                    className="inline-flex items-center justify-center rounded-lg bg-success-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-success-600"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleApprove(item.id, "REJECTED")}
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
