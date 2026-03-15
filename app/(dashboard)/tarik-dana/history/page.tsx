"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

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
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Riwayat Tarik Dana" />

      <ComponentCard
        title="Daftar Pengajuan"
        desc="Pantau status pengajuan tarik dana dan catatan penolakan."
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
                <option value="APPROVED">Approved</option>
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
                  Pemohon
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Nominal
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
                  Bukti
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Catatan
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
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada pengajuan.
                  </TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : (
                data.map((item: Pengeluaran) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                      #{item.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.user?.anggota?.nama ?? item.user?.username}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      Rp {formatRupiah(item.nominal)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                            : item.status === "REJECTED"
                            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.bukti_nota
                        ? `${item.bukti_nota.slice(0, 32)}...`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {item.alasan_tolak ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}
