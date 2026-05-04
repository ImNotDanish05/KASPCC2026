"use client";

import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { TrendingUp, TrendingDown, Wallet, Users, Clock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartPoint = {
  label: string;
  pemasukan_total: number;
  pengeluaran_total: number;
};

type StatsPayload = {
  saldo_kas: number;
  pemasukan_verified: number;
  pengeluaran_total: number;
  pending_setoran: number;
  anggota_total: number;
  grafik_kas: ChartPoint[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
  subColor?: string;
}

function SummaryCard({ title, value, icon, iconBg, sub, subColor }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
        {sub && (
          <p className={`mt-1 text-xs ${subColor ?? "text-gray-400 dark:text-gray-500"}`}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Bar Chart (pure SVG/CSS, no external library needed) ──────────────────────

interface BarChartProps {
  data: ChartPoint[];
}

function BarChart({ data }: BarChartProps) {
  const maxVal = useMemo(
    () => Math.max(1, ...data.flatMap((d) => [d.pemasukan_total, d.pengeluaran_total])),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Belum ada data grafik.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Bars */}
        <div className="flex items-end gap-3 px-2" style={{ height: "200px" }}>
          {data.map((point) => {
            const pct = (v: number) => `${Math.round((v / maxVal) * 100)}%`;
            return (
              <div key={point.label} className="group flex flex-1 flex-col items-center gap-1">
                {/* tooltip on hover */}
                <div className="hidden w-max rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] leading-4 shadow-sm group-hover:block dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {formatRupiah(point.pemasukan_total)}
                  </div>
                  <div className="flex items-center gap-1.5 text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {formatRupiah(point.pengeluaran_total)}
                  </div>
                </div>
                {/* bar pair */}
                <div className="flex w-full items-end justify-center gap-1" style={{ height: "180px" }}>
                  <div
                    className="w-4 rounded-t-sm bg-blue-500 transition-all"
                    style={{ height: pct(point.pemasukan_total) }}
                    title={`Pemasukan: ${formatRupiah(point.pemasukan_total)}`}
                  />
                  <div
                    className="w-4 rounded-t-sm bg-red-400 transition-all"
                    style={{ height: pct(point.pengeluaran_total) }}
                    title={`Pengeluaran: ${formatRupiah(point.pengeluaran_total)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-2 flex gap-3 px-2">
          {data.map((point) => (
            <div key={point.label} className="flex-1 text-center text-[10px] text-gray-500 dark:text-gray-400">
              {point.label}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Pemasukan (Verified)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
            Pengeluaran
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        const d = payload.data as Record<string, unknown>;
        if (!d) { setError("Data tidak tersedia."); return; }
        setStats({
          saldo_kas: toNumber(d.saldo_kas),
          pemasukan_verified: toNumber(d.pemasukan_verified),
          pengeluaran_total: toNumber(d.pengeluaran_total),
          pending_setoran: toNumber(d.pending_setoran),
          anggota_total: toNumber(d.anggota_total),
          grafik_kas: Array.isArray(d.grafik_kas)
            ? (d.grafik_kas as ChartPoint[])
            : [],
        });
      })
      .catch(() => { if (active) setError("Gagal memuat data dashboard."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  const val = (key: keyof StatsPayload) =>
    loading || !stats ? "—" : (typeof stats[key] === "number" ? formatRupiah(stats[key] as number) : String(stats[key]));

  const num = (key: keyof StatsPayload) =>
    loading || !stats ? "—" : String(stats[key]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Dashboard" />

      {error && (
        <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
        <SummaryCard
          title="Total Pemasukan"
          value={val("pemasukan_verified")}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          sub="Hanya setoran terverifikasi"
          subColor="text-blue-500 dark:text-blue-400"
        />
        <SummaryCard
          title="Total Pengeluaran"
          value={val("pengeluaran_total")}
          icon={<TrendingDown className="h-6 w-6 text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-500/10"
          sub="Semua pengeluaran kas"
          subColor="text-red-400 dark:text-red-400"
        />
        <SummaryCard
          title="Saldo"
          value={val("saldo_kas")}
          icon={<Wallet className="h-6 w-6 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          sub="Pemasukan − Pengeluaran + Tabungan"
          subColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── Secondary Info + Chart ────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Chart */}
        <div className="col-span-12 xl:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Grafik Kas 6 Bulan Terakhir
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pemasukan terverifikasi vs pengeluaran per bulan.
                </p>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {loading ? "—" : `${stats?.anggota_total ?? 0} anggota`}
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  Memuat grafik...
                </div>
              ) : (
                <BarChart data={stats?.grafik_kas ?? []} />
              )}
            </div>
          </div>
        </div>

        {/* Side stats */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Setoran Pending</div>
                <div className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {num("pending_setoran")}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
              Menunggu verifikasi Bendahara Inti
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <Users className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Anggota</div>
                <div className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {num("anggota_total")}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Terdaftar dalam sistem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
