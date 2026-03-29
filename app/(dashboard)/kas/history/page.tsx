"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

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
  userId: number;
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
    userId: toNumber(data.userId ?? data.user_id),
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        setCurrentUserId(res.user?.id ?? null);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    const url = `/api/kas/history${params.toString() ? `?${params}` : ""}`;
    console.log(url)
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
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Riwayat Setoran KAS" />

      <ComponentCard
        title="Daftar Setoran"
        desc="Pantau status setoran dan lakukan revisi jika ditolak."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total data: {data.length}
          </div>
          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <div className="w-48">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Semua</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Tanggal
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Total
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Bukti
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada setoran.
                  </TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : (
                data.map((item: Pemasukan) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                      #{item.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "VERIFIED"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                            : item.status === "REJECTED"
                            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.alasan_tolak ? (
                        <div className="mt-2 text-xs text-error-500">
                          Alasan: {item.alasan_tolak}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      Rp {formatRupiah(item.nominal_total)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.bukti_transfer
                        ? `${item.bukti_transfer.slice(0, 32)}...`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {item.status === "REJECTED" && currentUserId === item.userId ? (
                        <Link href={`/kas/resubmit/${item.id}`}>
                          <Button size="sm">Perbaiki</Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((item: Pemasukan) => (
              <div
                key={`detail-${item.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Detail Setoran #{item.id}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {item.user?.anggota?.nama ?? item.user?.username}
                    </span>
                    {item.user?.anggota?.jabatan?.nama_jabatan && (
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                        {item.user.anggota.jabatan.nama_jabatan}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
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
              </div>
            ))}
          </div>
        ) : null}
      </ComponentCard>
    </div>
  );
}
