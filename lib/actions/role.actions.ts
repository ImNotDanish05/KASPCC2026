"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ---------- helpers ----------

async function requireSuperadmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");

  const payload = await verifyAuthToken(token);
  if (!payload || !payload.roles.includes("Superadmin")) {
    throw new Error("Forbidden: Superadmin only");
  }
  return payload;
}

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------- READ ----------

export async function getRoles(): Promise<ActionResult<Awaited<ReturnType<typeof prisma.role.findMany>>>> {
  try {
    await requireSuperadmin();

    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    return { success: true, data: roles };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- CREATE ----------

export async function createRole(name: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Role name is required" };
    }

    // Check for duplicate
    const existing = await prisma.role.findUnique({ where: { name: trimmed } });
    if (existing) {
      return { success: false, error: `Role "${trimmed}" already exists` };
    }

    const role = await prisma.role.create({ data: { name: trimmed } });
    revalidatePath("/superadmin/roles");
    return { success: true, data: role };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- UPDATE ----------

export async function updateRole(id: number, name: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Role name is required" };
    }

    // Check for duplicate (excluding current)
    const existing = await prisma.role.findFirst({
      where: { name: trimmed, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: `Role "${trimmed}" already exists` };
    }

    const role = await prisma.role.update({
      where: { id },
      data: { name: trimmed },
    });
    revalidatePath("/superadmin/roles");
    return { success: true, data: role };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- DELETE ----------

export async function deleteRole(id: number): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    // Check if any users are assigned this role
    const usersWithRole = await prisma.modelHasRole.findFirst({
      where: { roleId: id },
    });
    if (usersWithRole) {
      return {
        success: false,
        error: "Cannot delete role: it is still assigned to one or more users. Remove the assignment first.",
      };
    }

    await prisma.role.delete({ where: { id } });
    revalidatePath("/superadmin/roles");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
