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

  // Calculate dynamic tabungan for all members
  const anggotas = await prisma.anggota.findMany({
    select: {
      detailKas: {
        where: { pemasukanKas: { status: "VERIFIED" } },
        select: { nominalBayar: true },
      },
    },
  });

  const pengaturan = await prisma.pengaturan.findFirst();
  const targetNominal = pengaturan?.targetKasPerBulan ?? 0;
  const start = pengaturan?.tanggalMulai ? new Date(pengaturan.tanggalMulai) : new Date();
  const end = pengaturan?.tanggalAkhir ? new Date(pengaturan.tanggalAkhir) : new Date();
  const maxMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

  let tabunganTotal = 0;
  for (const a of anggotas) {
    const totalBayar = a.detailKas.reduce((acc, d) => acc + d.nominalBayar, 0);
    let monthsPaid = targetNominal > 0 ? Math.floor(totalBayar / targetNominal) : 0;
    let dynamicTabungan = targetNominal > 0 ? totalBayar % targetNominal : totalBayar;
    if (monthsPaid > maxMonths) {
      dynamicTabungan += (monthsPaid - maxMonths) * targetNominal;
    }
    tabunganTotal += dynamicTabungan;
  }

  const pendingSetoran = await prisma.pemasukanKas.count({
    where: { status: "PENDING" },
  });

  const anggotaTotal = await prisma.anggota.count();

  const pemasukanTotal = pemasukanAgg._sum.nominalTotal ?? 0;
  const pengeluaranTotal = pengeluaranAgg._sum.totalNominal ?? 0;

  // Saldo = Pemasukan (verified) - Pengeluaran
  // Note: Pemasukan ALREADY includes tabungan because it's the total money received.
  // DO NOT add tabunganTotal to saldoKas to avoid double-counting.
  const saldoKas = pemasukanTotal - pengeluaranTotal;

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
      tabungan_total: tabunganTotal,
    },
  });
}
