import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SetorItem = {
  anggotaId: number;
  nominalBayar: number;
};

type SetorPayload = {
  buktiTransfer?: string;
  items?: SetorItem[];
};

function normalizeItems(items: SetorItem[]) {
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

export async function POST(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as SetorPayload | null;
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

  const pemasukan = await prisma.pemasukanKas.create({
    data: {
      userId: auth.userId,
      nominalTotal,
      buktiTransfer,
      status: "PENDING",
      details: {
        create: items.map((item) => ({
          anggotaId: item.anggotaId,
          nominalBayar: item.nominalBayar,
        })),
      },
    },
    include: {
      details: {
        include: {
          anggota: true,
        },
      },
    },
  });

  return NextResponse.json({ data: pemasukan }, { status: 201 });
}
