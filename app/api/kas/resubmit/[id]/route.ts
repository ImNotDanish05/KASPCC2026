import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResubmitItem = {
  anggotaId: number;
  nominalBayar: number;
};

type ResubmitPayload = {
  buktiTransfer?: string;
  items?: ResubmitItem[];
};

function normalizeItems(items: ResubmitItem[]) {
  const map = new Map<number, number>();
  for (const item of items) {
    if (!Number.isFinite(item.anggotaId) || !Number.isFinite(item.nominalBayar)) {
      continue;
    }
    if (item.nominalBayar <= 0) {
      continue;
    }
    const current = map.get(item.anggotaId) ?? 0;
    map.set(item.anggotaId, current + Math.floor(item.nominalBayar));
  }
  return Array.from(map.entries()).map(([anggotaId, nominalBayar]) => ({
    anggotaId,
    nominalBayar,
  }));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pemasukanId = Number(id);
  if (!Number.isFinite(pemasukanId)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as ResubmitPayload | null;
  const buktiTransfer = payload?.buktiTransfer?.trim() ?? "";
  const itemsRaw = payload?.items ?? [];

  if (!buktiTransfer) {
    return NextResponse.json(
      { error: "Bukti transfer wajib diisi." },
      { status: 400 },
    );
  }

  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return NextResponse.json(
      { error: "Daftar anggota wajib diisi." },
      { status: 400 },
    );
  }

  const items = normalizeItems(itemsRaw);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Nominal pembayaran harus lebih dari 0." },
      { status: 400 },
    );
  }

  const existing = await prisma.pemasukanKas.findUnique({
    where: { id: pemasukanId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  if (existing.userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (existing.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Hanya setoran yang ditolak bisa dikirim ulang." },
      { status: 409 },
    );
  }

  const anggotaIds = items.map((item) => item.anggotaId);
  const anggotaCount = await prisma.anggota.count({
    where: { id: { in: anggotaIds } },
  });

  if (anggotaCount !== anggotaIds.length) {
    return NextResponse.json(
      { error: "Ada anggota yang tidak ditemukan." },
      { status: 400 },
    );
  }

  const nominalTotal = items.reduce(
    (sum, item) => sum + item.nominalBayar,
    0,
  );

  const updated = await prisma.pemasukanKas.update({
    where: { id: pemasukanId },
    data: {
      buktiTransfer,
      nominalTotal,
      status: "PENDING",
      alasanTolak: null,
      details: {
        deleteMany: {},
        create: items.map((item) => ({
          anggotaId: item.anggotaId,
          nominalBayar: item.nominalBayar,
        })),
      },
    },
    include: {
      details: {
        include: { anggota: true },
      },
    },
  });

  return NextResponse.json({ data: updated });
}
