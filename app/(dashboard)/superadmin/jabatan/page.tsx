import type { Metadata } from "next";
import JabatanTable from "@/components/superadmin/JabatanTable";

export const metadata: Metadata = {
  title: "Jabatan Management | Superadmin",
  description: "Manage organizational positions and divisions for the KAS application",
};

export default function JabatanPage() {
  return <JabatanTable />;
}
