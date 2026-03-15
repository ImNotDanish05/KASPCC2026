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

  const pemasukanAgg = await prisma.pemasukanKas.aggregate({
    _sum: { nominalTotal: true },
    where: { status: "VERIFIED" },
  });

  const pengeluaranAgg = await prisma.pengeluaranKas.aggregate({
    _sum: { nominal: true },
    where: { status: "APPROVED" },
  });

  const pendingSetoran = await prisma.pemasukanKas.count({
    where: { status: "PENDING" },
  });

  const pendingTarikDana = await prisma.pengeluaranKas.count({
    where: { status: "PENDING" },
  });

  const anggotaTotal = await prisma.anggota.count();

  const nunggakTotal = await prisma.anggota.count({
    where: {
      detailKas: {
        none: {
          pemasukanKas: { status: "VERIFIED" },
        },
      },
    },
  });

  const pemasukanTotal = pemasukanAgg._sum.nominalTotal ?? 0;
  const pengeluaranTotal = pengeluaranAgg._sum.nominal ?? 0;
  const saldoKas = pemasukanTotal - pengeluaranTotal;

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
    select: {
      createdAt: true,
      nominalTotal: true,
    },
  });

  for (const row of pemasukanRows) {
    const key = buildMonthKey(row.createdAt);
    const bucket = monthBuckets.get(key);
    if (bucket) {
      bucket.pemasukan_total += row.nominalTotal;
    }
  }

  const pengeluaranRows = await prisma.pengeluaranKas.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      nominal: true,
    },
  });

  for (const row of pengeluaranRows) {
    const key = buildMonthKey(row.createdAt);
    const bucket = monthBuckets.get(key);
    if (bucket) {
      bucket.pengeluaran_total += row.nominal;
    }
  }

  const grafikKas: ChartPoint[] = Array.from(monthBuckets.values());

  return NextResponse.json({
    data: {
      saldo_kas: saldoKas,
      pemasukan_verified: pemasukanTotal,
      pengeluaran_approved: pengeluaranTotal,
      pending_setoran: pendingSetoran,
      pending_tarik_dana: pendingTarikDana,
      anggota_total: anggotaTotal,
      nunggak_total: nunggakTotal,
      grafik_kas: grafikKas,
    },
  });
}
