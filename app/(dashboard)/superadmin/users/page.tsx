import type { Metadata } from "next";
import UsersTable from "@/components/superadmin/UsersTable";

export const metadata: Metadata = {
  title: "Users Management | Superadmin",
  description: "Manage system users, their credentials, and role assignments",
};

export default function UsersPage() {
  return <UsersTable />;
}
