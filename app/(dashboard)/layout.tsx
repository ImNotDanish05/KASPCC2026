import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export default async function DashboardLayout({
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
  if (!payload) {
    redirect("/login");
  }

  return (
    <SidebarLayout roles={payload.roles} username={payload.username}>
      {children}
    </SidebarLayout>
  );
}
