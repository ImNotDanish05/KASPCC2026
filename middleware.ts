import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthTokenEdge } from "@/lib/auth-edge";

const publicPaths = new Set(["/api/login", "/api/logout"]);

const roleRules: Array<{
  pattern: RegExp;
  roles: string[];
  methods?: string[];
}> = [
  { pattern: /^\/api\/kas\/verify(\/|$)/, roles: ["Bendahara Internal"] },
  { pattern: /^\/api\/tarik-dana\/approve(\/|$)/, roles: ["Bendahara Internal"] },
  { pattern: /^\/api\/kas\/setor(\/|$)/, roles: ["Bendahara Eksternal"] },
  { pattern: /^\/api\/kas\/resubmit(\/|$)/, roles: ["Bendahara Eksternal"] },
  {
    pattern: /^\/api\/tarik-dana(\/|$)/,
    roles: ["Bendahara Eksternal"],
    methods: ["POST"],
  },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await verifyAuthTokenEdge(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles = payload.roles ?? [];
  if (!roles.includes("Superadmin")) {
    const rule = roleRules.find((entry) => {
      if (!entry.pattern.test(pathname)) {
        return false;
      }
      if (!entry.methods) {
        return true;
      }
      return entry.methods.includes(req.method);
    });
    if (rule && !rule.roles.some((role) => roles.includes(role))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-roles", roles.join(","));
  requestHeaders.set("x-username", payload.username);
  requestHeaders.set("x-anggota-id", String(payload.anggotaId));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
