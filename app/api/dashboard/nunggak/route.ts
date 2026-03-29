import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. Definisikan tipe data di luar biar bersih
type AnggotaWithDetails = Prisma.AnggotaGetPayload<{
  include: { 
    jabatan: true;
    detailKas: { 
      include: { pemasukanKas: true } 
    };
  };
}>;

export async function GET(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2. Ambil Pengaturan
  const settings = await prisma.pengaturan.findFirst();
  if (!settings) {
    return NextResponse.json({ error: "Settings not found." }, { status: 404 });
  }

  // 3. Logika perhitungan bulan berjalan (Sync dengan Rekapitulasi)
  const start = new Date(settings.tanggalMulai);
  const now = new Date();
  
  const yearsDiff = now.getFullYear() - start.getFullYear();
  const monthsDiff = now.getMonth() - start.getMonth();
  const currentMonthIdx = Math.max(0, yearsDiff * 12 + monthsDiff);

  const targetNominal = settings.targetKasPerBulan;
  const kewajibanHinggaSaatIni = (currentMonthIdx + 1) * targetNominal;

  // 4. Query Data
  const anggotas = await prisma.anggota.findMany({
    include: {
      jabatan: true,
      detailKas: {
        where: {
          pemasukanKas: { status: "VERIFIED" }
        },
        include: {
          pemasukanKas: true
        }
      }
    },
    orderBy: { nama: "asc" },
  }) as AnggotaWithDetails[];

  // 5. Filter & Mapping (Fixed TypeScript Errors)
  const dataNunggak = anggotas
    .map((anggota) => {
      // Tentukan tipe 'acc' sebagai number untuk hilangkan error 'any'
      const totalBayar = anggota.detailKas.reduce(
        (acc: number, detail) => acc + (detail.nominalBayar || 0), 
        0
      );
      
      const sisa = kewajibanHinggaSaatIni - totalBayar;

      return {
        ...anggota,
        totalBayar,
        sisaTunggakan: sisa,
      };
    })
    .filter((anggota) => anggota.sisaTunggakan > 0);

  return NextResponse.json({ data: dataNunggak });
}