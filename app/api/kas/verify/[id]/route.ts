import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyPayload = {
  status?: "VERIFIED" | "REJECTED";
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

  const pemasukanId = Number(id);
  if (!Number.isFinite(pemasukanId)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as VerifyPayload | null;
  const status = payload?.status;

  if (status !== "VERIFIED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "Status harus VERIFIED atau REJECTED." },
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

  // Fetch the pemasukan with its details and each anggota's current state
  const existing = await prisma.pemasukanKas.findUnique({
    where: { id: pemasukanId },
    include: {
      details: {
        include: { anggota: true },
      },
      user: true,
    },
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

  // ── If VERIFIED: compute and update lunas_sampai + tabungan per anggota ──────

  if (status === "VERIFIED") {
    // Fetch Pengaturan (settings) once
    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 1 } });
    if (!pengaturan) {
      return NextResponse.json(
        { error: "Pengaturan belum dikonfigurasi." },
        { status: 500 },
      );
    }

    const targetPerBulan = pengaturan.targetKasPerBulan;
    const tanggalMulai = pengaturan.tanggalMulai;

    // Run everything in a single transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the pemasukan status
      const updatedPemasukan = await tx.pemasukanKas.update({
        where: { id: pemasukanId },
        data: { status: "VERIFIED", alasanTolak: null },
        include: {
          details: { include: { anggota: true } },
          user: true,
        },
      });

      // 2. For each detail line, update the corresponding anggota
      for (const detail of existing.details) {
        const anggota = detail.anggota;
        const nominalPembayaran = detail.nominalBayar;
        const tabunganSaatIni = anggota.tabungan ?? 0;
        const lunasSaatIni = anggota.lunasSampai; // DateTime | null

        const totalEfektif = nominalPembayaran + tabunganSaatIni;
        const bulanBertambah = Math.floor(totalEfektif / targetPerBulan);
        const sisaTabungan = totalEfektif % targetPerBulan;

        if (bulanBertambah > 0) {
          // Base date: use lunasSaatIni if set, otherwise fall back to tanggalMulai
          const baseDate = lunasSaatIni ?? tanggalMulai;
          // Add bulanBertambah months to baseDate (preserve day=1 for clean month arithmetic)
          const base = new Date(baseDate);
          const newLunasSampai = new Date(
            base.getFullYear(),
            base.getMonth() + bulanBertambah,
            base.getDate(),
          );

          await tx.anggota.update({
            where: { id: anggota.id },
            data: {
              lunasSampai: newLunasSampai,
              tabungan: sisaTabungan,
            },
          });
        } else {
          // Not enough to cover a full month — accumulate into tabungan only
          await tx.anggota.update({
            where: { id: anggota.id },
            data: {
              tabungan: tabunganSaatIni + nominalPembayaran,
            },
          });
        }
      }

      return updatedPemasukan;
    });

    return NextResponse.json({ data: updated });
  }

  // ── REJECTED path (no anggota updates needed) ─────────────────────────────

  const updated = await prisma.pemasukanKas.update({
    where: { id: pemasukanId },
    data: { status: "REJECTED", alasanTolak },
    include: {
      details: { include: { anggota: true } },
      user: true,
    },
  });

  return NextResponse.json({ data: updated });
}
