"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Dashboard Overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
              Ringkasan KAS Organisasi
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Pantau saldo kas, setoran, dan pengajuan dana secara real-time.
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Sistem Aktif
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Saldo Kas
          </p>
          <div className="mt-3 text-2xl font-semibold text-zinc-900">
            {loading || !stats ? "-" : `Rp ${formatRupiah(stats.saldo_kas)}`}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Total kas setelah pemasukan diverifikasi dan pengeluaran disetujui.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Setoran Pending
          </p>
          <div className="mt-3 text-2xl font-semibold text-zinc-900">
            {loading || !stats ? "-" : stats.pending_setoran}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Menunggu verifikasi bendahara internal.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Pengajuan Tarik Dana
          </p>
          <div className="mt-3 text-2xl font-semibold text-zinc-900">
            {loading || !stats ? "-" : stats.pending_tarik_dana}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Pengajuan yang perlu disetujui.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Grafik Kas 6 Bulan Terakhir
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Pemasukan diverifikasi vs pengeluaran disetujui.
              </p>
            </div>
            <div className="text-xs text-zinc-400">
              {loading || !stats ? "-" : `${stats.anggota_total} anggota`}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {(stats?.grafik_kas ?? []).map((item: ChartPoint) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{item.label}</span>
                  <span>
                    Rp {formatRupiah(item.pemasukan_total)} / Rp{" "}
                    {formatRupiah(item.pengeluaran_total)}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="bg-emerald-500"
                    style={{
                      width: `${(item.pemasukan_total / maxValue) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-400"
                    style={{
                      width: `${(item.pengeluaran_total / maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {loading && !stats ? (
              <div className="text-xs text-zinc-500">Memuat grafik...</div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              Aktivitas Cepat
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Jalankan proses utama KAS dengan satu klik.
            </p>
            <div className="mt-5 grid gap-3">
              {actions.map((action: ActionLink) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div>
                    <div className="font-semibold text-zinc-900">
                      {action.label}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {action.description}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400">→</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Anggota Nunggak
              </h2>
              <span className="text-xs font-semibold text-zinc-400">
                {loading || !stats ? "-" : stats.nunggak_total}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Belum memiliki setoran terverifikasi.
            </p>
            <div className="mt-4 space-y-2">
              {nunggak.length === 0 && !loading ? (
                <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-xs text-zinc-500">
                  Semua anggota sudah pernah setor.
                </div>
              ) : (
                nunggak.map((anggota: Anggota) => (
                  <div
                    key={anggota.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900">
                        {anggota.nama}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {anggota.nim} · {anggota.jabatan?.nama_jabatan ?? "-"}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Nunggak
                    </span>
                  </div>
                ))
              )}
              {loading ? (
                <div className="text-xs text-zinc-500">Memuat data...</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
