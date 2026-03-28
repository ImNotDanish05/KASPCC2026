"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcryptjs from "bcryptjs";

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

// ---------- READ USERS ----------

export async function getUsers(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      include: {
        anggota: {
          select: { id: true, nama: true, nim: true },
        },
        roles: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
          orderBy: { roleId: "asc" },
        },
      },
    });

    // Transform roles array for easier consumption
    const transformedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      anggota: u.anggota,
      roles: u.roles.map((r) => r.role),
    }));

    return { success: true, data: transformedUsers };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- READ ANGGOTA OPTIONS ----------

export async function getAnggotasForDropdown(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const anggotas = await prisma.anggota.findMany({
      where: { statusAktif: true },
      orderBy: { nama: "asc" },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    return { success: true, data: anggotas };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- READ ROLES OPTIONS ----------

export async function getRolesForDropdown(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    return { success: true, data: roles };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- CREATE USER ----------

type CreateUserInput = {
  anggotaId: number;
  username: string;
  password: string;
  roleIds: number[];
};

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const username = input.username.trim();
    const password = input.password.trim();

    if (!username) {
      return { success: false, error: "Username is required" };
    }
    if (!password) {
      return { success: false, error: "Password is required" };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }
    if (!input.anggotaId) {
      return { success: false, error: "Anggota is required" };
    }
    if (!input.roleIds || input.roleIds.length === 0) {
      return { success: false, error: "At least one role is required" };
    }

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return {
        success: false,
        error: `Username "${username}" is already taken`,
      };
    }

    // Check anggota exists
    const anggota = await prisma.anggota.findUnique({
      where: { id: input.anggotaId },
    });
    if (!anggota) {
      return { success: false, error: "Selected anggota does not exist" };
    }

    // Check anggota not already assigned to another user
    const existingUser = await prisma.user.findUnique({
      where: { anggotaId: input.anggotaId },
    });
    if (existingUser) {
      return {
        success: false,
        error: `Anggota "${anggota.nama}" is already linked to another user`,
      };
    }

    // Verify all roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: input.roleIds } },
    });
    if (roles.length !== input.roleIds.length) {
      return {
        success: false,
        error: "One or more selected roles do not exist",
      };
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        anggotaId: input.anggotaId,
        roles: {
          createMany: {
            data: input.roleIds.map((roleId) => ({ roleId })),
          },
        },
      },
      include: {
        anggota: {
          select: { id: true, nama: true, nim: true },
        },
        roles: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
          orderBy: { roleId: "asc" },
        },
      },
    });

    revalidatePath("/superadmin/users");
    return { success: true, data: user };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- UPDATE USER ----------

type UpdateUserInput = {
  username?: string;
  password?: string;
  anggotaId?: number;
  roleIds?: number[];
};

export async function updateUser(
  userId: number,
  input: UpdateUserInput
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    // Get current user
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    const updateData: any = {};

    // Validate and update username
    if (input.username !== undefined) {
      const username = input.username.trim();
      if (!username) {
        return { success: false, error: "Username is required" };
      }

      // Check uniqueness (excluding current user)
      const existingUsername = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (existingUsername) {
        return {
          success: false,
          error: `Username "${username}" is already taken`,
        };
      }
      updateData.username = username;
    }

    // Validate and update password (optional)
    if (input.password !== undefined && input.password.trim()) {
      const password = input.password.trim();
      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters",
        };
      }
      updateData.password = await bcryptjs.hash(password, 10);
    }

    // Validate and update anggotaId
    if (input.anggotaId !== undefined) {
      if (!input.anggotaId) {
        return { success: false, error: "Anggota is required" };
      }

      // Check anggota exists
      const anggota = await prisma.anggota.findUnique({
        where: { id: input.anggotaId },
      });
      if (!anggota) {
        return { success: false, error: "Selected anggota does not exist" };
      }

      // Check anggota not already assigned to another user (excluding current user)
      const existingUser = await prisma.user.findFirst({
        where: { anggotaId: input.anggotaId, NOT: { id: userId } },
      });
      if (existingUser) {
        return {
          success: false,
          error: `Anggota "${anggota.nama}" is already linked to another user`,
        };
      }
      updateData.anggotaId = input.anggotaId;
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update roles if provided
    if (input.roleIds !== undefined) {
      if (!input.roleIds || input.roleIds.length === 0) {
        return { success: false, error: "At least one role is required" };
      }

      // Verify all roles exist
      const roles = await prisma.role.findMany({
        where: { id: { in: input.roleIds } },
      });
      if (roles.length !== input.roleIds.length) {
        return {
          success: false,
          error: "One or more selected roles do not exist",
        };
      }

      // Delete existing roles
      await prisma.modelHasRole.deleteMany({ where: { userId } });

      // Create new roles
      await prisma.modelHasRole.createMany({
        data: input.roleIds.map((roleId) => ({ userId, roleId })),
      });
    }

    // Fetch updated user with new roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        anggota: {
          select: { id: true, nama: true, nim: true },
        },
        roles: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
          orderBy: { roleId: "asc" },
        },
      },
    });

    revalidatePath("/superadmin/users");
    return { success: true, data: updatedUser };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- DELETE USER ----------

export async function deleteUser(userId: number): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Delete user (cascade will handle ModelHasRole)
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/superadmin/users");
    return { success: true, data: { id: userId } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------- BULK IMPORT ----------

export interface BulkImportUserInput {
  username: string;
  password: string;
  anggota?: string; // NIM string - will be looked up
  roles?: string; // Comma-separated role names
}

export interface BulkImportResult {
  success: boolean;
  createdCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{
    rowIndex: number;
    username?: string;
    error: string;
  }>;
}

export async function bulkCreateUsers(
  data: BulkImportUserInput[]
): Promise<ActionResult<BulkImportResult>> {
  try {
    await requireSuperadmin();

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowIndex: number; username?: string; error: string }> = [];

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const username = row.username?.trim();
      const password = row.password?.trim();

      // Validation
      if (!username || !password) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          username,
          error: "Missing required fields (username or password)",
        });
        continue;
      }

      if (password.length < 6) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          username,
          error: "Password must be at least 6 characters",
        });
        continue;
      }

      try {
        // Check username uniqueness
        const existingUsername = await prisma.user.findUnique({
          where: { username },
        });
        if (existingUsername) {
          skippedCount++;
          errors.push({
            rowIndex: index + 1,
            username,
            error: `Username "${username}" already exists (skipped)`,
          });
          continue;
        }

        // Lookup anggota by NIM
        let anggotaId: number | null = null;
        if (row.anggota) {
          const anggota = await prisma.anggota.findUnique({
            where: { nim: row.anggota.trim() },
          });
          if (anggota) {
            // Check anggota not already linked to another user
            const existingUser = await prisma.user.findUnique({
              where: { anggotaId: anggota.id },
            });
            if (existingUser) {
              errorCount++;
              errors.push({
                rowIndex: index + 1,
                username,
                error: `Anggota "${row.anggota}" is already linked to another user`,
              });
              continue;
            }
            anggotaId = anggota.id;
          } else {
            // Gracefully skip if anggota not found
            errorCount++;
            errors.push({
              rowIndex: index + 1,
              username,
              error: `Anggota NIM "${row.anggota}" not found in database`,
            });
            continue;
          }
        }

        // Lookup roles by comma-separated names
        let roleIds: number[] = [];
        if (row.roles) {
          const roleNames = row.roles
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r);
          if (roleNames.length > 0) {
            const roles = await prisma.role.findMany({
              where: { name: { in: roleNames } },
            });

            const foundRoleNames = new Set(roles.map((r) => r.name));
            const missingRoles = roleNames.filter((name) => !foundRoleNames.has(name));

            if (missingRoles.length > 0) {
              errorCount++;
              errors.push({
                rowIndex: index + 1,
                username,
                error: `Roles not found: ${missingRoles.join(", ")}`,
              });
              continue;
            }

            roleIds = roles.map((r) => r.id);
          }
        }

        // At least one role is required if anggota is provided
        if (anggotaId && roleIds.length === 0) {
          errorCount++;
          errors.push({
            rowIndex: index + 1,
            username,
            error: "At least one role is required when anggota is provided",
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create user with optional anggota and roles
        const createData: any = {
          username,
          password: hashedPassword,
        };

        if (anggotaId) {
          createData.anggotaId = anggotaId;
        }

        if (roleIds.length > 0) {
          createData.roles = {
            createMany: {
              data: roleIds.map((roleId) => ({ roleId })),
            },
          };
        }

        await prisma.user.create({
          data: createData,
        });

        createdCount++;
      } catch (rowErr) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          username,
          error: rowErr instanceof Error ? rowErr.message : "Unknown error",
        });
      }
    }

    revalidatePath("/superadmin/users");

    return {
      success: true,
      data: {
        success: errorCount === 0,
        createdCount,
        skippedCount,
        errorCount,
        errors,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
