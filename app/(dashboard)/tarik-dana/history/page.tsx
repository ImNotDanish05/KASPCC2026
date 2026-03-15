"use client";

import { useEffect, useState } from "react";

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
  alasan_tolak: string | null;
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
    alasan_tolak: (data.alasan_tolak ?? data.alasanTolak ?? null) as
      | string
      | null,
    created_at: toString(data.created_at ?? data.createdAt),
    user: mapUser(data.user ?? {}),
  };
}

export default function TarikDanaHistoryPage() {
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<Pengeluaran[]>([]);
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
    const url = `/api/tarik-dana/history${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((payload: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(payload.data)
          ? payload.data.map((item: unknown) => mapPengeluaran(item))
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
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Riwayat Tarik Dana
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Pantau status pengajuan tarik dana dan catatan penolakan.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-500">Total data: {data.length}</div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-zinc-600">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
            >
              <option value="">Semua</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
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
          <table className="w-full min-w-[820px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-3">ID</th>
                <th className="px-3">Tanggal</th>
                <th className="px-3">Pemohon</th>
                <th className="px-3">Nominal</th>
                <th className="px-3">Status</th>
                <th className="px-3">Bukti</th>
                <th className="px-3">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                  >
                    Belum ada pengajuan.
                  </td>
                </tr>
              ) : (
                data.map((item: Pengeluaran) => (
                  <tr
                    key={item.id}
                    className="rounded-lg bg-zinc-50 text-sm text-zinc-700"
                  >
                    <td className="px-3 py-3 font-medium text-zinc-900">
                      #{item.id}
                    </td>
                    <td className="px-3 py-3">{formatDate(item.created_at)}</td>
                    <td className="px-3 py-3">
                      {item.user?.anggota?.nama ?? item.user?.username}
                    </td>
                    <td className="px-3 py-3">
                      Rp {formatRupiah(item.nominal)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {item.bukti_nota ? (
                        <span className="text-xs text-zinc-600">
                          {item.bukti_nota.slice(0, 32)}...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">
                      {item.alasan_tolak ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
