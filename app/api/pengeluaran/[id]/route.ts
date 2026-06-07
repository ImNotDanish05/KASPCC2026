import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";
import { uploadPengeluaranFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// ── PUT — update record (Bendahara Inti only) ─────────────────────────────────

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!auth.roles.includes("Bendahara Inti")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const existing = await prisma.pengeluaranKas.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data tidak ditemukan." },
      { status: 404 },
    );
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
      { error: "Detail tidak valid." },
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

  // IDs of existing buktis to keep; the rest will be removed from DB
  let keepBuktiIds: number[] = [];
  try {
    const raw = fd.get("keepBuktiIds");
    if (raw) keepBuktiIds = JSON.parse(raw as string);
  } catch {
    // ignore — default to empty (remove all old buktis)
  }

  // Upload new bukti files
  const buktiFiles = fd.getAll("buktis") as File[];
  const newBuktiUrls: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < buktiFiles.length; i++) {
    const file = buktiFiles[i];
    if (!file || !file.size) continue;
    const ext = file.type.includes("png") ? "png" : "jpg";
    const path = `pengeluaran/${auth.userId}/${timestamp}-edit-${i}.${ext}`;
    try {
      const url = await uploadPengeluaranFile(file, path);
      newBuktiUrls.push(url);
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

  const totalNominal = details.reduce(
    (sum, d) => sum + Math.floor(Number(d.nominal)),
    0,
  );

  try {
    const record = await prisma.$transaction(async (tx) => {
      // Remove buktis not in keepBuktiIds
      await tx.buktiNotaPengeluaran.deleteMany({
        where: { pengeluaranKasId: id, NOT: { id: { in: keepBuktiIds } } },
      });
      // Replace all details
      await tx.detailPengeluaranKas.deleteMany({
        where: { pengeluaranKasId: id },
      });
      return tx.pengeluaranKas.update({
        where: { id },
        data: {
          namaKegiatan,
          totalNominal,
          details: {
            create: details.map((d) => ({
              keterangan: d.keterangan.trim(),
              nominal: Math.floor(Number(d.nominal)),
            })),
          },
          buktis: {
            create: newBuktiUrls.map((url) => ({ urlBukti: url })),
          },
        },
        include: {
          details: true,
          buktis: true,
          user: { include: { anggota: true } },
        },
      });
    });
    return NextResponse.json({ data: record });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal mengupdate data.",
      },
      { status: 500 },
    );
  }
}

// ── DELETE — remove record + cascade (Bendahara Inti only) ───────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!auth.roles.includes("Bendahara Inti")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const existing = await prisma.pengeluaranKas.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data tidak ditemukan." },
      { status: 404 },
    );
  }

  // onDelete: Cascade in schema handles DetailPengeluaranKas + BuktiNotaPengeluaran
  await prisma.pengeluaranKas.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
