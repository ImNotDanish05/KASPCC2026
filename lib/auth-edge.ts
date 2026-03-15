import { AUTH_COOKIE_NAME } from "./auth-constants";

export type AuthTokenPayload = {
  userId: number;
  username: string;
  roles: string[];
  anggotaId: number;
};

export { AUTH_COOKIE_NAME };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function base64UrlToUint8Array(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJson(segment: string) {
  const bytes = base64UrlToUint8Array(segment);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as Record<string, unknown>;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(buffer).set(view);
  return buffer;
}

async function verifySignature(
  token: string,
  secret: string,
  signature: Uint8Array,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(token);
  const signatureBuffer = toArrayBuffer(signature);
  const dataBuffer = toArrayBuffer(data);
  return crypto.subtle.verify("HMAC", key, signatureBuffer, dataBuffer);
}

export async function verifyAuthTokenEdge(
  token: string,
): Promise<AuthTokenPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeJson(headerSegment);
    payload = decodeJson(payloadSegment);
  } catch {
    return null;
  }

  if (header.alg !== "HS256") {
    return null;
  }

  const signature = base64UrlToUint8Array(signatureSegment);
  const verified = await verifySignature(
    `${headerSegment}.${payloadSegment}`,
    secret,
    signature,
  );
  if (!verified) {
    return null;
  }

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (exp && Date.now() / 1000 >= exp) {
    return null;
  }

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
}
