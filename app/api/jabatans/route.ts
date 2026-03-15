import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JabatanKategori } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kategoriParam = searchParams.get("kategori");
  const kategori =
    kategoriParam &&
    Object.values(JabatanKategori).includes(kategoriParam as JabatanKategori)
      ? (kategoriParam as JabatanKategori)
      : undefined;

  const jabatans = await prisma.jabatan.findMany({
    where: kategori ? { kategori } : {},
    orderBy: [{ kategori: "asc" }, { namaJabatan: "asc" }],
  });

  return NextResponse.json({ data: jabatans });
}
