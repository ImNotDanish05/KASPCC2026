"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Jabatan = {
  id: number;
  nama_jabatan: string;
  kategori: "DIVISI" | "DEPARTEMEN" | "INTI";
};

type Anggota = {
  id: number;
  nim: string;
  nama: string;
  no_telepon: string;
  jabatan_id: number;
  jabatan?: Jabatan;
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
  alasan_tolak: string | null;
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

function normalizeKategori(value: unknown): Jabatan["kategori"] {
  if (value === "DIVISI" || value === "DEPARTEMEN" || value === "INTI") {
    return value;
  }
  return "DIVISI";
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

function mapJabatan(raw: unknown): Jabatan {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nama_jabatan: toString(data.nama_jabatan ?? data.namaJabatan),
    kategori: normalizeKategori(data.kategori),
  };
}

function mapAnggota(raw: unknown): Anggota {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nim: toString(data.nim),
    nama: toString(data.nama),
    no_telepon: toString(data.no_telepon ?? data.noTelepon),
    jabatan_id: toNumber(data.jabatan_id ?? data.jabatanId),
    jabatan: data.jabatan ? mapJabatan(data.jabatan) : undefined,
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
    alasan_tolak: (data.alasan_tolak ?? data.alasanTolak ?? null) as
      | string
      | null,
    created_at: toString(data.created_at ?? data.createdAt),
    details: detailsRaw.map((detail: unknown) => mapDetail(detail)),
    user: mapUser(data.user ?? {}),
  };
}

export default function KasHistoryPage() {
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<Pemasukan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    const url = `/api/kas/history${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((payload: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(payload.data)
          ? payload.data.map((item: unknown) => mapPemasukan(item))
          : [];
        setData(list);
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat data.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Riwayat Setoran KAS
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Pantau status setoran dan lakukan revisi jika ditolak.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-500">
              Total data: {data.length}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-600">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              >
                <option value="">Semua</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-3">ID</th>
                  <th className="px-3">Tanggal</th>
                  <th className="px-3">Status</th>
                  <th className="px-3">Total</th>
                  <th className="px-3">Bukti</th>
                  <th className="px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                    >
                      Belum ada setoran.
                    </td>
                  </tr>
                ) : (
                  data.map((item: Pemasukan) => (
                    <tr
                      key={item.id}
                      className="rounded-lg bg-zinc-50 text-sm text-zinc-700"
                    >
                      <td className="px-3 py-3 font-medium text-zinc-900">
                        #{item.id}
                      </td>
                      <td className="px-3 py-3">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.alasan_tolak ? (
                          <div className="mt-2 text-xs text-red-600">
                            Alasan: {item.alasan_tolak}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        Rp {formatRupiah(item.nominal_total)}
                      </td>
                      <td className="px-3 py-3">
                        {item.bukti_transfer ? (
                          <span className="text-xs text-zinc-600">
                            {item.bukti_transfer.slice(0, 32)}...
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {item.status === "REJECTED" ? (
                          <Link
                            href={`/kas/resubmit/${item.id}`}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                          >
                            Resubmit
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {data.map((item: Pemasukan) => (
                <div
                  key={`detail-${item.id}`}
                  className="rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-800">
                      Detail Setoran #{item.id}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {item.user?.anggota?.nama ?? item.user?.username}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {item.details.map((detail: Detail) => (
                      <div
                        key={detail.id}
                        className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                      >
                        <span>
                          {detail.anggota.nama} ({detail.anggota.nim})
                        </span>
                        <span className="font-semibold text-zinc-800">
                          Rp {formatRupiah(detail.nominal_bayar)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
