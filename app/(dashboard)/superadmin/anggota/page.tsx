import type { Metadata } from "next";
import AnggotaTable from "@/components/superadmin/AnggotaTable";

export const metadata: Metadata = {
  title: "Anggota Management | Superadmin",
  description: "Manage organization members, their positions, and status",
};

export default function AnggotaPage() {
  return <AnggotaTable />;
}
