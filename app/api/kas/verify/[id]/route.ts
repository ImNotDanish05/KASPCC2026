import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Mencegah timeout di Vercel (default 10-15s)

type VerifyPayload = {
  status?: "VERIFIED" | "REJECTED" | "PENDING";
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

  const isInternal =
    auth.roles.includes("Bendahara Inti") || auth.roles.includes("Superadmin");
  if (!isInternal) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const pemasukanId = Number(id);
  if (!Number.isFinite(pemasukanId)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as VerifyPayload | null;
  const status = payload?.status;

  if (status !== "VERIFIED" && status !== "REJECTED" && status !== "PENDING") {
    return NextResponse.json(
      { error: "Status harus PENDING, VERIFIED, atau REJECTED." },
      { status: 400 },
    );
  }

  const alasanTolak = payload?.alasanTolak?.trim() ?? "";
  if (status === "REJECTED" && alasanTolak.length === 0) {
    return NextResponse.json(
      { error: "Alasan tolak wajib diisi." },
      { status: 400 },
    );
  }

  const existing = await prisma.pemasukanKas.findUnique({
    where: { id: pemasukanId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  const updated = await prisma.pemasukanKas.update({
    where: { id: pemasukanId },
    data: {
      status,
      alasanTolak: status === "REJECTED" ? alasanTolak : null,
    },
    include: {
      details: { include: { anggota: true } },
      user: true,
    },
  });

  return NextResponse.json({ data: updated });
}
