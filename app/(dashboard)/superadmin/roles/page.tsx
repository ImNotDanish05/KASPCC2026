import type { Metadata } from "next";
import RolesTable from "@/components/superadmin/RolesTable";

export const metadata: Metadata = {
  title: "Roles Management | Superadmin",
  description: "Manage user roles for the KAS application",
};

export default function RolesPage() {
  return <RolesTable />;
}
