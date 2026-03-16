import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      anggota: {
        include: { jabatan: true },
      },
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles = user.roles.map((entry: { role: { name: string } }) => entry.role.name);

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      roles,
      anggota: {
        id: user.anggota.id,
        nim: user.anggota.nim,
        nama: user.anggota.nama,
        noTelepon: user.anggota.noTelepon,
        jabatanId: user.anggota.jabatanId,
        jabatan: {
          id: user.anggota.jabatan.id,
          namaJabatan: user.anggota.jabatan.namaJabatan,
          kategori: user.anggota.jabatan.kategori,
        },
      },
    },
  });
}
