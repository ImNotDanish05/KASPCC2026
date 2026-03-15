import { SignJWT, jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, TOKEN_TTL_SECONDS } from "./auth-constants";

export type AuthTokenPayload = {
  userId: number;
  username: string;
  roles: string[];
  anggotaId: number;
};

export { AUTH_COOKIE_NAME, TOKEN_TTL_SECONDS };

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const secret = getJwtSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;

  const token = await new SignJWT({
    userId: payload.userId,
    username: payload.username,
    roles: payload.roles,
    anggotaId: payload.anggotaId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secret);

  return { token, expiresIn: TOKEN_TTL_SECONDS };
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      !isStringArray(payload.roles) ||
      typeof payload.anggotaId !== "number"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      roles: payload.roles,
      anggotaId: payload.anggotaId,
    };
  } catch {
    return null;
  }
}
