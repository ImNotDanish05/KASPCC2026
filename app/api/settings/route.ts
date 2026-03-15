import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SettingsPayload = {
  target_kas_per_bulan?: number | string;
  tanggal_mulai?: string;
  tanggal_akhir?: string;
  targetKasPerBulan?: number | string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
};

function parseNumber(value: unknown) {
  const num = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const setting = await prisma.pengaturan.findUnique({
    where: { id: 1 },
  });

  if (!setting) {
    return NextResponse.json({ error: "Pengaturan belum tersedia." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: setting.id,
      target_kas_per_bulan: setting.targetKasPerBulan,
      tanggal_mulai: setting.tanggalMulai,
      tanggal_akhir: setting.tanggalAkhir,
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!auth.roles.includes("Superadmin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const payload = (await req.json().catch(() => null)) as SettingsPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const targetRaw =
    payload.target_kas_per_bulan ?? payload.targetKasPerBulan ?? null;
  const tanggalMulaiRaw = payload.tanggal_mulai ?? payload.tanggalMulai ?? null;
  const tanggalAkhirRaw = payload.tanggal_akhir ?? payload.tanggalAkhir ?? null;

  const targetKasPerBulan = parseNumber(targetRaw);
  const tanggalMulai = parseDate(tanggalMulaiRaw);
  const tanggalAkhir = parseDate(tanggalAkhirRaw);

  if (!targetKasPerBulan || targetKasPerBulan <= 0) {
    return NextResponse.json(
      { error: "Target KAS per bulan harus lebih dari 0." },
      { status: 400 },
    );
  }

  if (!tanggalMulai || !tanggalAkhir) {
    return NextResponse.json(
      { error: "Tanggal mulai dan akhir wajib diisi." },
      { status: 400 },
    );
  }

  if (tanggalAkhir <= tanggalMulai) {
    return NextResponse.json(
      { error: "Tanggal akhir harus lebih besar dari tanggal mulai." },
      { status: 400 },
    );
  }

  const updated = await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: {
      targetKasPerBulan,
      tanggalMulai,
      tanggalAkhir,
    },
    create: {
      id: 1,
      targetKasPerBulan,
      tanggalMulai,
      tanggalAkhir,
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      target_kas_per_bulan: updated.targetKasPerBulan,
      tanggal_mulai: updated.tanggalMulai,
      tanggal_akhir: updated.tanggalAkhir,
    },
  });
}
