import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";
import { uploadBuktiImage } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResubmitItem = {
  anggotaId: number;
  nominalBayar: number;
  // buktiBase64 is optional on resubmit — if omitted the existing linkBukti is kept.
  // If provided it MUST be a new image which will be reuploaded.
  buktiBase64?: string;
};

type ResubmitPayload = {
  jabatanId?: number;
  items?: ResubmitItem[];
};

function validateItems(raw: unknown): ResubmitItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result: ResubmitItem[] = [];
  for (const item of raw) {
    const r = item as Record<string, unknown>;
    const anggotaId = Number(r.anggotaId);
    const nominalBayar = Math.floor(Number(r.nominalBayar));
    const buktiBase64 =
      typeof r.buktiBase64 === "string" && r.buktiBase64.trim()
        ? r.buktiBase64.trim()
        : undefined;

    if (
      !Number.isFinite(anggotaId) ||
      !Number.isFinite(nominalBayar) ||
      nominalBayar <= 0
    ) {
      continue;
    }
    result.push({ anggotaId, nominalBayar, buktiBase64 });
  }
  return result.length > 0 ? result : null;
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

  // ── Parse & Validate ───────────────────────────────────────────────────────
  const payload = (await req.json().catch(() => null)) as ResubmitPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const items = validateItems(payload?.items);
  if (!items) {
    return NextResponse.json(
      { error: "Pilih anggota dan isi nominal yang valid." },
      { status: 400 },
    );
  }

  // ── Load existing record ───────────────────────────────────────────────────
  const existing = await prisma.pemasukanKas.findUnique({
    where: { id: pemasukanId },
    include: {
      details: { select: { anggotaId: true, linkBukti: true } },
    },
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

  // Build a lookup map of existing linkBukti per anggotaId
  const existingLinkBukti = new Map(
    existing.details
      .filter((d) => d.linkBukti)
      .map((d) => [d.anggotaId, d.linkBukti as string]),
  );

  // Determine jabatanId
  const isSuperadmin = auth.roles.includes("Superadmin");
  const jabatanId = isSuperadmin
    ? Number(payload?.jabatanId ?? existing.jabatanId)
    : existing.jabatanId;

  if (!Number.isFinite(jabatanId)) {
    return NextResponse.json({ error: "Jabatan tidak valid." }, { status: 400 });
  }

  // Verify all anggotaIds exist
  const anggotaIds = items.map((i) => i.anggotaId);
  const anggotaCount = await prisma.anggota.count({
    where: { id: { in: anggotaIds } },
  });
  if (anggotaCount !== anggotaIds.length) {
    return NextResponse.json(
      { error: "Ada anggota yang tidak ditemukan." },
      { status: 400 },
    );
  }

  // Every item must have either a new buktiBase64 OR an existing linkBukti
  for (const item of items) {
    if (!item.buktiBase64 && !existingLinkBukti.has(item.anggotaId)) {
      return NextResponse.json(
        {
          error: `Anggota ID ${item.anggotaId} tidak memiliki bukti transfer. Unggah bukti baru.`,
        },
        { status: 400 },
      );
    }
  }

  // ── Upload new images (only for items that have a new file) ────────────────
  const timestamp = Date.now();
  const uploadResults: {
    anggotaId: number;
    nominalBayar: number;
    url: string;
  }[] = [];

  for (const item of items) {
    let url: string;

    if (item.buktiBase64) {
      const ext = item.buktiBase64.includes("image/png") ? "png" : "jpg";
      const path = `resubmit/${auth.userId}/${pemasukanId}-${timestamp}-${item.anggotaId}.${ext}`;
      try {
        url = await uploadBuktiImage(item.buktiBase64, path);
      } catch (err) {
        return NextResponse.json(
          {
            error:
              err instanceof Error
                ? err.message
                : `Gagal mengunggah bukti untuk anggota ID ${item.anggotaId}.`,
          },
          { status: 500 },
        );
      }
    } else {
      // Reuse existing URL
      url = existingLinkBukti.get(item.anggotaId)!;
    }

    uploadResults.push({
      anggotaId: item.anggotaId,
      nominalBayar: item.nominalBayar,
      url,
    });
  }

  // ── Prisma Transaction ─────────────────────────────────────────────────────
  const nominalTotal = uploadResults.reduce((sum, i) => sum + i.nominalBayar, 0);
  const primaryBuktiUrl = uploadResults[0].url;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      return tx.pemasukanKas.update({
        where: { id: pemasukanId },
        data: {
          jabatanId,
          nominalTotal,
          buktiTransfer: primaryBuktiUrl,
          status: "PENDING",
          alasanTolak: null,
          details: {
            deleteMany: {},
            create: uploadResults.map((r) => ({
              anggotaId: r.anggotaId,
              nominalBayar: r.nominalBayar,
              linkBukti: r.url,
            })),
          },
        },
        include: {
          details: { include: { anggota: true } },
        },
      });
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyimpan data. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}
