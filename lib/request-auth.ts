import { NextRequest } from "next/server";

export type RequestAuth = {
  userId: number;
  anggotaId: number;
  username: string;
  roles: string[];
};

export function getRequestAuth(req: NextRequest): RequestAuth | null {
  const userIdRaw = req.headers.get("x-user-id");
  const anggotaIdRaw = req.headers.get("x-anggota-id");
  const username = req.headers.get("x-username") ?? "";
  const rolesRaw = req.headers.get("x-user-roles") ?? "";

  const userId = userIdRaw ? Number(userIdRaw) : NaN;
  const anggotaId = anggotaIdRaw ? Number(anggotaIdRaw) : NaN;
  if (!Number.isFinite(userId) || !Number.isFinite(anggotaId) || !username) {
    return null;
  }

  const roles = rolesRaw
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role.length > 0);

  return { userId, anggotaId, username, roles };
}
