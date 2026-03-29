"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { ArrowRightIcon, BoxCubeIcon, TableIcon, UserCircleIcon } from "@/icons";

type ChartPoint = {
  label: string;
  pemasukan_total: number;
  pengeluaran_total: number;
};

type StatsPayload = {
  saldo_kas: number;
  pemasukan_verified: number;
  pengeluaran_approved: number;
  pending_setoran: number;
  pending_tarik_dana: number;
  anggota_total: number;
  nunggak_total: number;
  grafik_kas: ChartPoint[];
};

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
  jabatan?: Jabatan;
};

type ActionLink = {
  label: string;
  href: string;
  description: string;
};

const actions: ActionLink[] = [
  {
    label: "Setor KAS",
    href: "/kas/setor",
    description: "Input setoran anggota dan unggah bukti.",
  },
  {
    label: "Riwayat Setoran",
    href: "/kas/history",
    description: "Pantau status setoran dan revisi jika perlu.",
  },
  {
    label: "Pengajuan Tarik Dana",
    href: "/tarik-dana",
    description: "Ajukan dana kas dengan nominal dan bukti nota.",
  },
  {
    label: "Riwayat Tarik Dana",
    href: "/tarik-dana/history",
    description: "Lihat status pengajuan tarik dana.",
  },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
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
    kategori: (data.kategori as Jabatan["kategori"]) ?? "DIVISI",
  };
}

function mapAnggota(raw: unknown): Anggota {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nim: toString(data.nim),
    nama: toString(data.nama),
    no_telepon: toString(data.no_telepon ?? data.noTelepon),
    jabatan: data.jabatan ? mapJabatan(data.jabatan) : undefined,
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [nunggak, setNunggak] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/dashboard/stats").then((res) => res.json()),
      fetch("/api/dashboard/nunggak?limit=8").then((res) => res.json()),
    ])
      .then(([statsRes, nunggakRes]) => {
        if (!active) return;
        setStats(statsRes.data ?? null);
        const list = Array.isArray(nunggakRes.data)
          ? nunggakRes.data.map((item: unknown) => mapAnggota(item))
          : [];
        setNunggak(list);
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat data dashboard.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const maxValue = useMemo(() => {
    if (!stats?.grafik_kas?.length) return 1;
    return Math.max(
      1,
      ...stats.grafik_kas.map((item) =>
        Math.max(item.pemasukan_total, item.pengeluaran_total),
      ),
    );
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Dashboard" />

      {error ? (
        <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <TableIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Saldo Kas
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {loading || !stats ? "-" : `Rp ${formatRupiah(stats.saldo_kas)}`}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Setoran Pending
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {loading || !stats ? "-" : stats.pending_setoran}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pengajuan Tarik Dana
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {loading || !stats ? "-" : stats.pending_tarik_dana}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Grafik Kas 6 Bulan Terakhir
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pemasukan diverifikasi vs pengeluaran disetujui.
                </p>
              </div>
              <div className="text-xs text-gray-400">
                {loading || !stats ? "-" : `${stats.anggota_total} anggota`}
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(stats?.grafik_kas ?? []).map((item: ChartPoint) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Rp {formatRupiah(item.pemasukan_total)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className="h-full bg-brand-500"
                        style={{
                          width: `${(item.pemasukan_total / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pengeluaran
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Rp {formatRupiah(item.pengeluaran_total)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className="h-full bg-error-500"
                        style={{
                          width: `${(item.pengeluaran_total / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {loading && !stats ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Memuat grafik...
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <ComponentCard
            title="Aktivitas Cepat"
            desc="Jalankan proses utama KAS dengan satu klik."
          >
            <div className="grid gap-3">
              {actions.map((action: ActionLink) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300"
                >
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white/90">
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                  <ArrowRightIcon className="text-gray-400" />
                </Link>
              ))}
            </div>
          </ComponentCard>

          <ComponentCard
            title="Anggota Nunggak"
            desc="Belum memiliki setoran terverifikasi."
          >
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Total</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {loading || !stats ? "-" : nunggak.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400">
                      Anggota
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400">
                      Jabatan
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nunggak.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Semua anggota sudah pernah setor.
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        -
                      </TableCell>
                    </TableRow>
                  ) : (
                    nunggak.map((anggota: Anggota) => (
                      <TableRow key={anggota.id}>
                        <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                          <div className="font-semibold">{anggota.nama}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {anggota.nim}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {anggota.jabatan?.nama_jabatan ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {loading ? (
                    <TableRow>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Memuat data...
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        -
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div className="pt-2">
              <Link href="/kas/history">
                <Button variant="outline" size="sm" className="w-full">
                  Lihat Riwayat Setoran
                </Button>
              </Link>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
