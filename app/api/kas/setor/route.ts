import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";
import { uploadBuktiImage } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SetorItem = {
  anggotaId: number;
  nominalBayar: number;
  buktiBase64: string; // data URL: "data:image/jpeg;base64,..."
};

type SetorPayload = {
  jabatanId?: number;
  items?: SetorItem[];
};

function validateItems(raw: unknown): SetorItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result: SetorItem[] = [];
  for (const item of raw) {
    const anggotaId = Number((item as Record<string, unknown>).anggotaId);
    const nominalBayar = Math.floor(
      Number((item as Record<string, unknown>).nominalBayar),
    );
    const buktiBase64 = String(
      (item as Record<string, unknown>).buktiBase64 ?? "",
    ).trim();

    if (
      !Number.isFinite(anggotaId) ||
      !Number.isFinite(nominalBayar) ||
      nominalBayar <= 0 ||
      !buktiBase64
    ) {
      continue;
    }
    result.push({ anggotaId, nominalBayar, buktiBase64 });
  }
  return result.length > 0 ? result : null;
}

export async function POST(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Parse & Validate ───────────────────────────────────────────────────────
  const payload = (await req.json().catch(() => null)) as SetorPayload | null;

  if (!payload) {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const items = validateItems(payload?.items);
  if (!items) {
    return NextResponse.json(
      {
        error:
          "Setiap anggota yang dipilih harus memiliki nominal > 0 dan bukti transfer.",
      },
      { status: 400 },
    );
  }

  // Determine jabatanId: superadmin can pass any, others use their own
  const isSuperadmin = auth.roles.includes("Superadmin");
  const jabatanId = isSuperadmin
    ? Number(payload?.jabatanId ?? NaN)
    : await prisma.anggota
        .findUnique({ where: { id: auth.anggotaId }, select: { jabatanId: true } })
        .then((a) => a?.jabatanId ?? NaN);

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

  // ── Upload Images to Supabase Storage ──────────────────────────────────────
  const timestamp = Date.now();
  const uploadResults: { anggotaId: number; nominalBayar: number; url: string }[] = [];

  for (const item of items) {
    const ext = item.buktiBase64.includes("image/png") ? "png" : "jpg";
    const path = `setor/${auth.userId}/${timestamp}-${item.anggotaId}.${ext}`;

    try {
      const url = await uploadBuktiImage(item.buktiBase64, path);
      uploadResults.push({
        anggotaId: item.anggotaId,
        nominalBayar: item.nominalBayar,
        url,
      });
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
  }

  // ── Prisma Transaction ─────────────────────────────────────────────────────
  const nominalTotal = uploadResults.reduce((sum, i) => sum + i.nominalBayar, 0);
  // buktiTransfer on PemasukanKas stores the first URL as the primary proof
  const primaryBuktiUrl = uploadResults[0].url;

  try {
    const pemasukan = await prisma.$transaction(async (tx) => {
      return tx.pemasukanKas.create({
        data: {
          userId: auth.userId,
          jabatanId,
          nominalTotal,
          buktiTransfer: primaryBuktiUrl,
          status: "PENDING",
          details: {
            create: uploadResults.map((r) => ({
              anggotaId: r.anggotaId,
              nominalBayar: r.nominalBayar,
              linkBukti: r.url,
            })),
          },
        },
        include: {
          details: {
            include: { anggota: true },
          },
        },
      });
    });

    return NextResponse.json({ data: pemasukan }, { status: 201 });
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
