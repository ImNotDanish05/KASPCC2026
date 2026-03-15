"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MenuItem = {
  label: string;
  href: string;
  roles: string[];
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const MENU: MenuSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", roles: ["Superadmin", "Bendahara Internal", "Bendahara Eksternal"] },
    ],
  },
  {
    title: "KAS Masuk",
    items: [
      { label: "Setor KAS", href: "/kas/setor", roles: ["Bendahara Eksternal"] },
      { label: "Riwayat Setoran", href: "/kas/history", roles: ["Superadmin", "Bendahara Internal", "Bendahara Eksternal"] },
      { label: "Verifikasi Setoran", href: "/kas/verifikasi", roles: ["Bendahara Internal"] },
    ],
  },
  {
    title: "KAS Keluar",
    items: [
      { label: "Ajukan Tarik Dana", href: "/tarik-dana", roles: ["Bendahara Eksternal"] },
      { label: "Persetujuan Tarik Dana", href: "/tarik-dana/approve", roles: ["Bendahara Internal"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Manajemen User", href: "/admin/users", roles: ["Superadmin"] },
      { label: "Pengaturan Sistem", href: "/admin/settings", roles: ["Superadmin"] },
    ],
  },
];

type SidebarLayoutProps = {
  roles: string[];
  username?: string;
  children: React.ReactNode;
};

function filterMenu(roles: string[]) {
  if (roles.includes("Superadmin")) {
    return MENU;
  }
  const roleSet = new Set(roles);
  return MENU.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.some((r) => roleSet.has(r))),
  })).filter((section) => section.items.length > 0);
}

export default function SidebarLayout({ roles, username, children }: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);
  const menu = useMemo(() => filterMenu(roles), [roles]);

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold">KAS Admin</span>
        </div>
        <nav className="flex-1 space-y-6 px-4 py-4">
          {menu.map((section) => (
            <div key={section.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-200 px-6 py-4 text-sm text-zinc-500">
          {username ? `Signed in as ${username}` : "Not signed in"}
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 shadow-sm lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 lg:hidden"
          >
            Menu
          </button>
          <div className="text-sm text-zinc-500">
            {roles.length > 0 ? roles.join(" • ") : "Guest"}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 bg-white shadow-xl transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold">KAS Admin</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <nav className="flex-1 space-y-6 px-4 py-4">
          {menu.map((section) => (
            <div key={`mobile-${section.title}`}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-200 px-6 py-4 text-sm text-zinc-500">
          {username ? `Signed in as ${username}` : "Not signed in"}
        </div>
      </aside>
    </div>
  );
}
