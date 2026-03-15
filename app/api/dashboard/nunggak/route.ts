import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 20;
  const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;

  const data = await prisma.anggota.findMany({
    where: {
      detailKas: {
        none: {
          pemasukanKas: { status: "VERIFIED" },
        },
      },
    },
    include: {
      jabatan: true,
    },
    orderBy: {
      nama: "asc",
    },
    take,
  });

  return NextResponse.json({ data });
}
