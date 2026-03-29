"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  ArrowRightIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  DocsIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  UserCircleIcon,
} from "@/icons";
import { ShieldCheck } from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: { name: string; path: string; roles?: string[] }[];
};

const ROLE_SUPER = "Superadmin";
const ROLE_INTERNAL = "Bendahara Internal";
const ROLE_EXTERNAL = "Bendahara Eksternal";

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    roles: [ROLE_SUPER, ROLE_INTERNAL, ROLE_EXTERNAL],
  },
  {
    icon: <DocsIcon />,
    name: "Settings",
    path: "/settings",
    roles: [ROLE_SUPER, ROLE_INTERNAL],
  },
  {
    name: "KAS Masuk",
    icon: <ListIcon />,
    roles: [ROLE_SUPER, ROLE_INTERNAL, ROLE_EXTERNAL],
    subItems: [
      {
        name: "Rekapitulasi",
        path: "/kas/rekapitulasi",
        roles: [ROLE_INTERNAL, ROLE_SUPER],
      },
      {
        name: "Setor KAS",
        path: "/kas/setor",
        roles: [ROLE_EXTERNAL, ROLE_SUPER],
      },
      {
        name: "Riwayat Setoran",
        path: "/kas/history",
        roles: [ROLE_EXTERNAL, ROLE_INTERNAL, ROLE_SUPER],
      },
      {
        name: "Verifikasi Setoran",
        path: "/kas/verifikasi",
        roles: [ROLE_INTERNAL, ROLE_SUPER],
      },
    ],
  },
  {
    name: "KAS Keluar",
    icon: <BoxCubeIcon />,
    roles: [ROLE_SUPER, ROLE_INTERNAL, ROLE_EXTERNAL],
    subItems: [
      {
        name: "Ajukan Tarik Dana",
        path: "/tarik-dana",
        roles: [ROLE_EXTERNAL, ROLE_SUPER],
      },
      {
        name: "Riwayat Tarik Dana",
        path: "/tarik-dana/history",
        roles: [ROLE_EXTERNAL, ROLE_INTERNAL, ROLE_SUPER],
      },
      {
        name: "Persetujuan Tarik Dana",
        path: "/tarik-dana/approve",
        roles: [ROLE_INTERNAL, ROLE_SUPER],
      },
    ],
  },
  {
    name: "Superadmin",
    icon: <ShieldCheck className="h-6 w-6" />,
    roles: [ROLE_SUPER],
    subItems: [
      {
        name: "Manajemen Roles",
        path: "/superadmin/roles",
        roles: [ROLE_SUPER],
      },
      {
        name: "Manajemen Jabatan",
        path: "/superadmin/jabatan",
        roles: [ROLE_SUPER],
      },
      {
        name: "Manajemen Anggota",
        path: "/superadmin/anggota",
        roles: [ROLE_SUPER],
      },
      {
        name: "Manajemen Users",
        path: "/superadmin/users",
        roles: [ROLE_SUPER],
      },
    ],
  },
];

type AppSidebarProps = {
  roles: string[];
};

const AppSidebar: React.FC<AppSidebarProps> = ({ roles }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const roleSet = useMemo(() => new Set(roles), [roles]);
  const isAllowed = useCallback(
    (allowed?: string[]) =>
      !allowed || allowed.some((role) => roleSet.has(role)),
    [roleSet],
  );

  const filteredNavItems = useMemo(() => {
    return navItems
      .map((item) => {
        if (!isAllowed(item.roles)) return null;
        if (!item.subItems) return item;
        const subItems = item.subItems.filter((sub) => isAllowed(sub.roles));
        if (subItems.length === 0) return null;
        return { ...item, subItems };
      })
      .filter((item): item is NavItem => Boolean(item));
  }, [isAllowed]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${
                openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu === index ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[index] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu === index
                    ? `${subMenuHeight[index]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu(index);
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [filteredNavItems, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const node = subMenuRefs.current[openSubmenu];
      if (node) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [openSubmenu]: node.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) =>
      prevOpenSubmenu === index ? null : index,
    );
  };

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filteredNavItems)}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Account"
                ) : (
                  <UserCircleIcon />
                )}
              </h2>
              <button
                onClick={handleLogout}
                className={`menu-item group menu-item-inactive ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span className="menu-item-icon-inactive">
                  <ArrowRightIcon />
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">Logout</span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
