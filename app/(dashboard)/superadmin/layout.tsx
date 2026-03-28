import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyAuthToken(token);
  if (!payload || !payload.roles.includes("Superadmin")) {
    // Non-superadmin users get sent back to the dashboard
    redirect("/");
  }

  return <>{children}</>;
}
