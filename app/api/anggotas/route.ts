import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jabatanIdParam = searchParams.get("jabatanId");
  const jabatanId = jabatanIdParam ? Number(jabatanIdParam) : undefined;
  const qRaw = searchParams.get("q")?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw : undefined;

  const anggotas = await prisma.anggota.findMany({
    where: {
      ...(Number.isFinite(jabatanId) ? { jabatanId } : {}),
      ...(q
        ? {
            OR: [
              { nama: { contains: q, mode: "insensitive" } },
              { nim: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      jabatan: true,
    },
    orderBy: [{ nama: "asc" }],
  });

  return NextResponse.json({ data: anggotas });
}
