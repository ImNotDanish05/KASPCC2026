import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";
import { uploadPengeluaranFile } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET — list all pengeluaran (Bendahara Inti + Superadmin) ──────────────────

export async function GET(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const allowed =
    auth.roles.includes("Bendahara Inti") ||
    auth.roles.includes("Superadmin");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const data = await prisma.pengeluaranKas.findMany({
    include: {
      user: { include: { anggota: true } },
      details: { orderBy: { id: "asc" } },
      buktis: { orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data });
}

// ── POST — create new pengeluaran (Bendahara Inti only) ───────────────────────

export async function POST(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!auth.roles.includes("Bendahara Inti")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const namaKegiatan = (fd.get("namaKegiatan") as string | null)?.trim() ?? "";
  if (!namaKegiatan) {
    return NextResponse.json(
      { error: "Nama kegiatan wajib diisi." },
      { status: 400 },
    );
  }

  let details: { keterangan: string; nominal: number }[];
  try {
    details = JSON.parse(fd.get("details") as string);
    if (!Array.isArray(details) || details.length === 0) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Detail pengeluaran tidak valid." },
      { status: 400 },
    );
  }
  for (const d of details) {
    if (!d.keterangan?.trim() || !(Number(d.nominal) > 0)) {
      return NextResponse.json(
        { error: "Setiap detail harus memiliki keterangan dan nominal > 0." },
        { status: 400 },
      );
    }
  }

  const totalNominal = details.reduce(
    (sum, d) => sum + Math.floor(Number(d.nominal)),
    0,
  );

  // Upload bukti files
  const buktiFiles = fd.getAll("buktis") as File[];
  const buktiUrls: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < buktiFiles.length; i++) {
    const file = buktiFiles[i];
    if (!file || !file.size) continue;
    const ext = file.type.includes("png") ? "png" : "jpg";
    const path = `pengeluaran/${auth.userId}/${timestamp}-${i}.${ext}`;
    try {
      const url = await uploadPengeluaranFile(file, path);
      buktiUrls.push(url);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Gagal mengunggah bukti.",
        },
        { status: 500 },
      );
    }
  }

  try {
    const record = await prisma.pengeluaranKas.create({
      data: {
        userId: auth.userId,
        namaKegiatan,
        totalNominal,
        details: {
          create: details.map((d) => ({
            keterangan: d.keterangan.trim(),
            nominal: Math.floor(Number(d.nominal)),
          })),
        },
        buktis: {
          create: buktiUrls.map((url) => ({ urlBukti: url })),
        },
      },
      include: {
        details: true,
        buktis: true,
        user: { include: { anggota: true } },
      },
    });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal menyimpan data.",
      },
      { status: 500 },
    );
  }
}
