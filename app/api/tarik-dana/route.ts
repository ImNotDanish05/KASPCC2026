import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TarikDanaPayload = {
  nominal?: number;
  keterangan?: string;
  bukti_nota?: string;
  buktiNota?: string;
};

export async function POST(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as TarikDanaPayload | null;
  const nominalRaw = payload?.nominal;
  const nominal = typeof nominalRaw === "number" ? nominalRaw : Number(nominalRaw);
  const keterangan = payload?.keterangan?.trim() ?? "";
  const buktiNota = payload?.bukti_nota?.trim() ?? payload?.buktiNota?.trim() ?? "";

  if (!Number.isFinite(nominal) || nominal <= 0) {
    return NextResponse.json(
      { error: "Nominal harus lebih dari 0." },
      { status: 400 },
    );
  }

  if (!keterangan) {
    return NextResponse.json(
      { error: "Keterangan wajib diisi." },
      { status: 400 },
    );
  }

  if (!buktiNota) {
    return NextResponse.json(
      { error: "Bukti nota wajib diisi." },
      { status: 400 },
    );
  }

  const pengajuan = await prisma.pengeluaranKas.create({
    data: {
      userId: auth.userId,
      nominal: Math.floor(nominal),
      keterangan,
      buktiNota,
      status: "PENDING",
    },
    include: {
      user: {
        include: {
          anggota: true,
        },
      },
    },
  });

  return NextResponse.json({ data: pengajuan }, { status: 201 });
}
