import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env",
  );
}

// Server-side Supabase client. For production, replace with SUPABASE_SERVICE_ROLE_KEY
// to bypass Row-Level-Security on the storage bucket.
export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Storage Helpers ──────────────────────────────────────────────────────────

const BUCKET = "bukti_pemasukan_kas";

/**
 * Uploads a base64 data-URL image to Supabase Storage.
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

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Gagal mengunggah file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}
