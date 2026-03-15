import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestAuth } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusValues = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function GET(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusValues.includes(statusParam as typeof statusValues[number])
    ? (statusParam as "PENDING" | "APPROVED" | "REJECTED")
    : undefined;

  const isInternal =
    auth.roles.includes("Bendahara Internal") || auth.roles.includes("Superadmin");

  const pengajuan = await prisma.pengeluaranKas.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(isInternal ? {} : { userId: auth.userId }),
    },
    include: {
      user: {
        include: { anggota: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ data: pengajuan });
}
