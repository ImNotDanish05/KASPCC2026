"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { JabatanKategori } from "@prisma/client";

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

const VALID_KATEGORI = Object.values(JabatanKategori);

// ---------- READ ----------

export async function getJabatans(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const jabatans = await prisma.jabatan.findMany({
      orderBy: { id: "asc" },
      include: {
        anggotas: {
          select: { id: true, nama: true },
        },
      },
    });

    return { success: true, data: jabatans };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- CREATE ----------

export async function createJabatan(
  namaJabatan: string,
  kategori: string,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const trimmed = namaJabatan.trim();
    if (!trimmed) {
      return { success: false, error: "Nama jabatan is required" };
    }

    if (!VALID_KATEGORI.includes(kategori as JabatanKategori)) {
      return { success: false, error: `Invalid kategori. Must be one of: ${VALID_KATEGORI.join(", ")}` };
    }

    // Check for duplicate name + kategori combo
    const existing = await prisma.jabatan.findFirst({
      where: { namaJabatan: trimmed, kategori: kategori as JabatanKategori },
    });
    if (existing) {
      return { success: false, error: `Jabatan "${trimmed}" with kategori "${kategori}" already exists` };
    }

    const jabatan = await prisma.jabatan.create({
      data: {
        namaJabatan: trimmed,
        kategori: kategori as JabatanKategori,
      },
    });
    revalidatePath("/superadmin/jabatan");
    return { success: true, data: jabatan };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- UPDATE ----------

export async function updateJabatan(
  id: number,
  namaJabatan: string,
  kategori: string,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const trimmed = namaJabatan.trim();
    if (!trimmed) {
      return { success: false, error: "Nama jabatan is required" };
    }

    if (!VALID_KATEGORI.includes(kategori as JabatanKategori)) {
      return { success: false, error: `Invalid kategori. Must be one of: ${VALID_KATEGORI.join(", ")}` };
    }

    // Check for duplicate (excluding current)
    const existing = await prisma.jabatan.findFirst({
      where: {
        namaJabatan: trimmed,
        kategori: kategori as JabatanKategori,
        NOT: { id },
      },
    });
    if (existing) {
      return { success: false, error: `Jabatan "${trimmed}" with kategori "${kategori}" already exists` };
    }

    const jabatan = await prisma.jabatan.update({
      where: { id },
      data: {
        namaJabatan: trimmed,
        kategori: kategori as JabatanKategori,
      },
    });
    revalidatePath("/superadmin/jabatan");
    return { success: true, data: jabatan };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- DELETE ----------

export async function deleteJabatan(id: number): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const hasKasHistory = await prisma.pemasukanKas.findFirst({
      where: { jabatanId: id },
      select: { id: true },
    });
    if (hasKasHistory) {
      return {
        success: false,
        error: "Cannot delete jabatan: it has existing kas history records.",
      };
    }

    await prisma.jabatan.delete({ where: { id } });
    revalidatePath("/superadmin/jabatan");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- BULK IMPORT ----------

export interface BulkImportJabatanInput {
  namaJabatan: string;
  kategori: string;
}

export interface BulkImportResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{
    rowIndex: number;
    namaJabatan?: string;
    error: string;
  }>;
}

export async function bulkCreateJabatans(
  data: BulkImportJabatanInput[],
): Promise<ActionResult<BulkImportResult>> {
  try {
    await requireSuperadmin();

    let createdCount = 0;
    let updatedCount = 0;
    const skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowIndex: number; namaJabatan?: string; error: string }> = [];

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const namaJabatan = row.namaJabatan?.trim();
      const kategori = row.kategori?.trim().toUpperCase();

      if (!namaJabatan || !kategori) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          namaJabatan,
          error: "Missing required fields (Nama Jabatan or Kategori)",
        });
        continue;
      }

      if (!VALID_KATEGORI.includes(kategori as JabatanKategori)) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          namaJabatan,
          error: `Invalid kategori. Must be one of: ${VALID_KATEGORI.join(", ")}`,
        });
        continue;
      }

      try {
        const existing = await prisma.jabatan.findFirst({
          where: {
            namaJabatan,
            kategori: kategori as JabatanKategori,
          },
        });

        if (existing) {
          await prisma.jabatan.update({
            where: { id: existing.id },
            data: { namaJabatan, kategori: kategori as JabatanKategori },
          });
          updatedCount++;
        } else {
          await prisma.jabatan.create({
            data: { namaJabatan, kategori: kategori as JabatanKategori },
          });
          createdCount++;
        }
      } catch (rowErr) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          namaJabatan,
          error: rowErr instanceof Error ? rowErr.message : "Unknown error",
        });
      }
    }

    revalidatePath("/superadmin/jabatan");

    return {
      success: true,
      data: {
        success: errorCount === 0,
        createdCount,
        updatedCount,
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
