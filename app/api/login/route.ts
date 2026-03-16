import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as LoginPayload | null;
  const username = body?.username?.trim();
  const password = body?.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      anggota: true,
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const passwordOk = await verifyPassword(password, user.password);
  if (!passwordOk) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const roles = user.roles.map((entry: { role: { name: string } }) => entry.role.name);
  const { token, expiresIn } = await signAuthToken({
    userId: user.id,
    username: user.username,
    roles,
    anggotaId: user.anggotaId,
  });

  const response = NextResponse.json({
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
      },
    },
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresIn,
  });

  return response;
}
