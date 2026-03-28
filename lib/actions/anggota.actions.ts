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

export async function getAnggotas(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const anggotas = await prisma.anggota.findMany({
      orderBy: { id: "asc" },
      include: {
        jabatan: {
          select: { id: true, namaJabatan: true, kategori: true },
        },
        user: {
          select: { id: true, username: true },
        },
      },
    });

    return { success: true, data: anggotas };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- GET JABATAN LIST (for dropdown) ----------

export async function getJabatanOptions(): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const jabatans = await prisma.jabatan.findMany({
      orderBy: [{ kategori: "asc" }, { namaJabatan: "asc" }],
      select: { id: true, namaJabatan: true, kategori: true },
    });

    return { success: true, data: jabatans };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- CREATE ----------

type AnggotaInput = {
  nim: string;
  nama: string;
  noTelepon: string;
  jabatanId: number;
  statusAktif: boolean;
};

export async function createAnggota(input: AnggotaInput): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const nim = input.nim.trim();
    const nama = input.nama.trim();
    const noTelepon = input.noTelepon.trim();

    if (!nim) return { success: false, error: "NIM is required" };
    if (!nama) return { success: false, error: "Nama is required" };
    if (!noTelepon) return { success: false, error: "No. Telepon is required" };
    if (!input.jabatanId) return { success: false, error: "Jabatan is required" };

    // Check NIM uniqueness
    const existingNim = await prisma.anggota.findUnique({ where: { nim } });
    if (existingNim) {
      return { success: false, error: `NIM "${nim}" is already registered` };
    }

    // Verify jabatan exists
    const jabatan = await prisma.jabatan.findUnique({ where: { id: input.jabatanId } });
    if (!jabatan) {
      return { success: false, error: "Selected jabatan does not exist" };
    }

    const anggota = await prisma.anggota.create({
      data: {
        nim,
        nama,
        noTelepon,
        jabatanId: input.jabatanId,
        statusAktif: input.statusAktif,
      },
    });

    revalidatePath("/superadmin/anggota");
    return { success: true, data: anggota };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- UPDATE ----------

export async function updateAnggota(
  id: number,
  input: AnggotaInput,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const nim = input.nim.trim();
    const nama = input.nama.trim();
    const noTelepon = input.noTelepon.trim();

    if (!nim) return { success: false, error: "NIM is required" };
    if (!nama) return { success: false, error: "Nama is required" };
    if (!noTelepon) return { success: false, error: "No. Telepon is required" };
    if (!input.jabatanId) return { success: false, error: "Jabatan is required" };

    // Check NIM uniqueness (excluding current)
    const existingNim = await prisma.anggota.findFirst({
      where: { nim, NOT: { id } },
    });
    if (existingNim) {
      return { success: false, error: `NIM "${nim}" is already registered by another anggota` };
    }

    // Verify jabatan exists
    const jabatan = await prisma.jabatan.findUnique({ where: { id: input.jabatanId } });
    if (!jabatan) {
      return { success: false, error: "Selected jabatan does not exist" };
    }

    const anggota = await prisma.anggota.update({
      where: { id },
      data: {
        nim,
        nama,
        noTelepon,
        jabatanId: input.jabatanId,
        statusAktif: input.statusAktif,
      },
    });

    revalidatePath("/superadmin/anggota");
    return { success: true, data: anggota };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- DELETE ----------

export async function deleteAnggota(id: number): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    // Check if anggota has a linked user account
    const linkedUser = await prisma.user.findUnique({ where: { anggotaId: id } });
    if (linkedUser) {
      return {
        success: false,
        error: "Cannot delete anggota: they have a linked user account. Delete the user first.",
      };
    }

    // Check if anggota has payment detail records
    const hasPayments = await prisma.detailPemasukanKas.findFirst({
      where: { anggotaId: id },
    });
    if (hasPayments) {
      return {
        success: false,
        error: "Cannot delete anggota: they have existing payment records.",
      };
    }

    await prisma.anggota.delete({ where: { id } });
    revalidatePath("/superadmin/anggota");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------- BULK IMPORT ----------

export interface BulkImportAnggotaInput {
  nim: string;
  nama: string;
  noTelepon: string;
  jabatan?: string; // Will be looked up by namaJabatan
  statusAktif?: boolean;
}

export interface BulkImportResult {
  success: boolean;
  createdCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{
    rowIndex: number;
    nim?: string;
    error: string;
  }>;
}

export async function bulkCreateAnggota(
  data: BulkImportAnggotaInput[]
): Promise<ActionResult<BulkImportResult>> {
  try {
    await requireSuperadmin();

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowIndex: number; nim?: string; error: string }> = [];

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const nim = row.nim?.trim();
      const nama = row.nama?.trim();
      const noTelepon = row.noTelepon?.trim();
      const statusAktif = row.statusAktif !== false;

      // Validation
      if (!nim || !nama || !noTelepon) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          nim,
          error: "Missing required fields (NIM, Nama, or No. Telepon)",
        });
        continue;
      }

      try {
        // Check if NIM already exists
        const existingNim = await prisma.anggota.findUnique({ where: { nim } });
        if (existingNim) {
          skippedCount++;
          errors.push({
            rowIndex: index + 1,
            nim,
            error: `NIM "${nim}" already exists (skipped)`,
          });
          continue;
        }

        // Lookup jabatan by name
        let jabatanId: number | null = null;
        if (row.jabatan) {
          const jabatan = await prisma.jabatan.findFirst({
            where: { namaJabatan: row.jabatan.trim() },
          });
          if (jabatan) {
            jabatanId = jabatan.id;
          } else {
            // Gracefully set to null if jabatan not found
            skippedCount++;
            errors.push({
              rowIndex: index + 1,
              nim,
              error: `Jabatan "${row.jabatan}" not found (setting to null)`,
            });
            jabatanId = null;
          }
        }

        // Create anggota
        await prisma.anggota.create({
          data: {
            nim,
            nama,
            noTelepon,
            jabatanId: jabatanId || undefined,
            statusAktif,
          },
        });

        createdCount++;
      } catch (rowErr) {
        errorCount++;
        errors.push({
          rowIndex: index + 1,
          nim,
          error: rowErr instanceof Error ? rowErr.message : "Unknown error",
        });
      }
    }

    revalidatePath("/superadmin/anggota");

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
