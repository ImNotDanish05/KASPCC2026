import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChartPoint = {
  label: string;
  pemasukan_total: number;
  pengeluaran_total: number;
};

function buildMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${month.toString().padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("id-ID", { month: "short", year: "numeric" });
}

export async function GET(_req: NextRequest) {
  const auth = getRequestAuth(_req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Aggregate totals ──────────────────────────────────────────────────────

  const pemasukanAgg = await prisma.pemasukanKas.aggregate({
    _sum: { nominalTotal: true },
    where: { status: "VERIFIED" },
  });

  // PengeluaranKas uses totalNominal; no status filter (all records count)
  const pengeluaranAgg = await prisma.pengeluaranKas.aggregate({
    _sum: { totalNominal: true },
  });

  // Sum of all anggota tabungan (accumulated savings)
  const tabunganAgg = await prisma.anggota.aggregate({
    _sum: { tabungan: true },
  });

  const pendingSetoran = await prisma.pemasukanKas.count({
    where: { status: "PENDING" },
  });

  const anggotaTotal = await prisma.anggota.count();

  const pemasukanTotal = pemasukanAgg._sum.nominalTotal ?? 0;
  const pengeluaranTotal = pengeluaranAgg._sum.totalNominal ?? 0;
  const tabunganTotal = tabunganAgg._sum.tabungan ?? 0;

  // Saldo = Pemasukan (verified) - Pengeluaran + Tabungan (anggota savings)
  const saldoKas = pemasukanTotal - pengeluaranTotal + tabunganTotal;

  // ── Grafik 6 Bulan Terakhir ───────────────────────────────────────────────

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthBuckets = new Map<string, ChartPoint>();
  for (let i = 0; i < 6; i += 1) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const key = buildMonthKey(date);
    monthBuckets.set(key, {
      label: monthLabel(date),
      pemasukan_total: 0,
      pengeluaran_total: 0,
    });
  }

  const pemasukanRows = await prisma.pemasukanKas.findMany({
    where: {
      status: "VERIFIED",
      createdAt: { gte: startDate },
    },
    select: { createdAt: true, nominalTotal: true },
  });

  for (const row of pemasukanRows) {
    const key = buildMonthKey(row.createdAt);
    const bucket = monthBuckets.get(key);
    if (bucket) bucket.pemasukan_total += row.nominalTotal;
  }

  const pengeluaranRows = await prisma.pengeluaranKas.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, totalNominal: true },
  });

  for (const row of pengeluaranRows) {
    const key = buildMonthKey(row.createdAt);
    const bucket = monthBuckets.get(key);
    if (bucket) bucket.pengeluaran_total += row.totalNominal;
  }

  const grafikKas: ChartPoint[] = Array.from(monthBuckets.values());

  return NextResponse.json({
    data: {
      saldo_kas: saldoKas,
      pemasukan_verified: pemasukanTotal,
      pengeluaran_total: pengeluaranTotal,
      pending_setoran: pendingSetoran,
      anggota_total: anggotaTotal,
      grafik_kas: grafikKas,
    },
  });
}
