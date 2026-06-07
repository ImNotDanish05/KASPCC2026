import fs from "fs/promises";
import pathLib from "path";

// ── Storage Helpers ──────────────────────────────────────────────────────────

const BUCKET = "bukti_pemasukan_kas";
const PENGELUARAN_BUCKET = "bukti_pengeluaran_kas";

/**
 * Ensures the target directory exists.
 */
async function ensureDir(filePath: string) {
  const dir = pathLib.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Uploads a base64 data-URL image to the local filesystem.
 * Returns the public URL string, or throws on failure.
 */
export async function uploadBuktiImage(
  base64DataUrl: string,
  path: string,
): Promise<string> {
  // Strip the "data:image/jpeg;base64," prefix
  const matches = base64DataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Format file tidak valid. Hanya PNG, JPG, dan JPEG yang diizinkan.");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const fullPath = pathLib.join(process.cwd(), "public", "uploads", BUCKET, path);

  try {
    await ensureDir(fullPath);
    await fs.writeFile(fullPath, buffer);
    // Return relative URL for browser access
    return `/uploads/${BUCKET}/${path}`;
  } catch (error: any) {
    throw new Error(`Gagal menyimpan file secara lokal: ${error.message}`);
  }
}

/**
 * Uploads a raw File/Blob directly to the local filesystem under the bukti_pengeluaran_kas bucket.
 * Returns the public URL string, or throws on failure.
 */
export async function uploadPengeluaranFile(
  file: File | Blob,
  path: string,
): Promise<string> {
  const fullPath = pathLib.join(process.cwd(), "public", "uploads", PENGELUARAN_BUCKET, path);

  try {
    await ensureDir(fullPath);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(fullPath, buffer);
    // Return relative URL for browser access
    return `/uploads/${PENGELUARAN_BUCKET}/${path}`;
  } catch (error: any) {
    throw new Error(`Gagal menyimpan file secara lokal: ${error.message}`);
  }
}
