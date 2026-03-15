import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApprovePayload = {
  status?: "APPROVED" | "REJECTED";
  alasan_tolak?: string;
  alasanTolak?: string;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pengeluaranId = Number(id);
  if (!Number.isFinite(pengeluaranId)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as ApprovePayload | null;
  const status = payload?.status;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "Status harus APPROVED atau REJECTED." },
      { status: 400 },
    );
  }

  const alasanTolak = payload?.alasan_tolak?.trim() ?? payload?.alasanTolak?.trim() ?? "";
  if (status === "REJECTED" && alasanTolak.length === 0) {
    return NextResponse.json(
      { error: "Alasan tolak wajib diisi." },
      { status: 400 },
    );
  }

  const existing = await prisma.pengeluaranKas.findUnique({
    where: { id: pengeluaranId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Status sudah diproses sebelumnya." },
      { status: 409 },
    );
  }

  const updated = await prisma.pengeluaranKas.update({
    where: { id: pengeluaranId },
    data: {
      status,
      alasanTolak: status === "REJECTED" ? alasanTolak : null,
    },
    include: {
      user: {
        include: { anggota: true },
      },
    },
  });

  return NextResponse.json({ data: updated });
}
