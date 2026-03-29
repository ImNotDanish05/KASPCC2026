"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageIcon, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Jabatan = {
  id: number;
  nama_jabatan: string;
  kategori: "DIVISI" | "DEPARTEMEN" | "INTI";
};

type Anggota = {
  id: number;
  nim: string;
  nama: string;
  no_telepon: string;
  jabatan_id: number;
  jabatan?: Jabatan;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function normalizeKategori(value: unknown): Jabatan["kategori"] {
  if (value === "DIVISI" || value === "DEPARTEMEN" || value === "INTI") return value;
  return "DIVISI";
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toStr(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapJabatan(raw: unknown): Jabatan {
  const d = raw as Record<string, unknown>;
  return {
    id: toNumber(d.id),
    nama_jabatan: toStr(d.nama_jabatan ?? d.namaJabatan),
    kategori: normalizeKategori(d.kategori),
  };
}

function mapAnggota(raw: unknown): Anggota {
  const d = raw as Record<string, unknown>;
  return {
    id: toNumber(d.id),
    nim: toStr(d.nim),
    nama: toStr(d.nama),
    no_telepon: toStr(d.no_telepon ?? d.noTelepon),
    jabatan_id: toNumber(d.jabatan_id ?? d.jabatanId),
    jabatan: d.jabatan ? mapJabatan(d.jabatan) : undefined,
  };
}

/** Reads a File and returns a base64 data URL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SetorKasPage() {
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [anggotas, setAnggotas] = useState<Anggota[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [selectedJabatanId, setSelectedJabatanId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Per-row state (keyed by anggota.id)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [nominalById, setNominalById] = useState<Record<number, string>>({});
  const [buktiById, setBuktiById] = useState<Record<number, File | null>>({});

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File input refs per anggota (so we can reset them on clear)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        const isAdmin = res.user?.roles?.includes("Superadmin") ?? false;
        setIsSuperadmin(isAdmin);
        if (!isAdmin) {
          const jId = res.user?.anggota?.jabatanId;
          if (jId) setSelectedJabatanId(String(jId));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // ── Fetch jabatan list ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetch("/api/jabatans")
      .then((r) => r.json())
      .then((data: { data?: unknown[] }) => {
        if (!active) return;
        setJabatans(
          Array.isArray(data.data) ? data.data.map(mapJabatan) : [],
        );
      })
      .catch(() => { if (active) setJabatans([]); });
    return () => { active = false; };
  }, []);

  // ── Fetch anggota list ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setLoadingAnggota(true);
    const params = new URLSearchParams();
    if (selectedJabatanId) params.set("jabatanId", selectedJabatanId);
    if (query.trim()) params.set("q", query.trim());
    const url = `/api/anggotas${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: { data?: unknown[] }) => {
        if (!active) return;
        setAnggotas(Array.isArray(data.data) ? data.data.map(mapAnggota) : []);
      })
      .catch(() => { if (active) setAnggotas([]); })
      .finally(() => { if (active) setLoadingAnggota(false); });
    return () => { active = false; };
  }, [selectedJabatanId, query]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalNominal = useMemo(() => {
    let total = 0;
    selectedIds.forEach((id) => {
      const v = Number(nominalById[id] ?? 0);
      if (Number.isFinite(v) && v > 0) total += v;
    });
    return total;
  }, [selectedIds, nominalById]);

  const selectedList = useMemo(
    () => anggotas.filter((a) => selectedIds.has(a.id)),
    [anggotas, selectedIds],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleAnggota(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Clear file when unchecking
        setBuktiById((b) => { const nb = { ...b }; delete nb[id]; return nb; });
        if (fileInputRefs.current[id]) {
          fileInputRefs.current[id]!.value = "";
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleNominalChange(id: number, value: string) {
    setNominalById((prev) => ({ ...prev, [id]: value }));
  }

  function handleFileChange(id: number, file: File | null) {
    // Strictly accept only image types
    if (file && !["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Hanya file PNG, JPG, dan JPEG yang diizinkan.");
      if (fileInputRefs.current[id]) fileInputRefs.current[id]!.value = "";
      return;
    }
    setBuktiById((prev) => ({ ...prev, [id]: file }));
    setError(null);
  }

  async function handleSubmit() {
    setMessage(null);
    setError(null);

    // Validation
    if (selectedIds.size === 0) {
      setError("Pilih minimal satu anggota terlebih dahulu.");
      return;
    }

    const missingNominal = Array.from(selectedIds).find(
      (id) => !(Number(nominalById[id]) > 0),
    );
    if (missingNominal !== undefined) {
      setError("Semua anggota yang dipilih harus memiliki nominal > 0.");
      return;
    }

    const missingBukti = Array.from(selectedIds).find((id) => !buktiById[id]);
    if (missingBukti !== undefined) {
      setError("Semua anggota yang dipilih harus memiliki bukti transfer.");
      return;
    }

    setSubmitting(true);
    try {
      // Convert all files to base64
      const items: { anggotaId: number; nominalBayar: number; buktiBase64: string }[] = [];
      for (const id of Array.from(selectedIds)) {
        const file = buktiById[id]!;
        const buktiBase64 = await fileToBase64(file);
        items.push({
          anggotaId: id,
          nominalBayar: Math.floor(Number(nominalById[id])),
          buktiBase64,
        });
      }

      const body: Record<string, unknown> = { items };
      if (isSuperadmin && selectedJabatanId) {
        body.jabatanId = Number(selectedJabatanId);
      }

      const response = await fetch("/api/kas/setor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Gagal mengirim setoran.");
      }

      const result = await response.json();
      setMessage(`Setoran berhasil dikirim. ID: ${result.data.id}`);

      // Reset form
      setSelectedIds(new Set());
      setNominalById({});
      setBuktiById({});
      Object.values(fileInputRefs.current).forEach((ref) => {
        if (ref) ref.value = "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Setor KAS" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* ── Left: Anggota Table ─────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <ComponentCard
            title="Daftar Anggota"
            desc="Centang anggota yang sudah membayar, isi nominal, lalu unggah bukti transfernya."
          >
            {/* Filters */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Cari anggota</Label>
                <Input
                  placeholder="Cari nama atau NIM"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div>
                <Label>Filter jabatan</Label>
                {isSuperadmin ? (
                  <select
                    value={selectedJabatanId}
                    onChange={(e) => setSelectedJabatanId(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="">Semua jabatan</option>
                    {jabatans.map((j) => (
                      <option key={j.id} value={String(j.id)}>
                        {j.nama_jabatan}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex h-11 w-full items-center rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    {jabatans.find((j) => String(j.id) === selectedJabatanId)
                      ?.nama_jabatan || "Memuat jabatan..."}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      {["Pilih", "Nama", "NIM", "Jabatan", "Nominal (Rp)", "Bukti Transfer"].map(
                        (h) => (
                          <TableCell
                            key={h}
                            isHeader
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            {h}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAnggota ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                            Memuat data anggota...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : anggotas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          Tidak ada anggota ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      anggotas.map((anggota) => {
                        const checked = selectedIds.has(anggota.id);
                        const file = buktiById[anggota.id] ?? null;
                        return (
                          <TableRow
                            key={anggota.id}
                            className={`border-b border-gray-100 dark:border-gray-800 ${
                              checked ? "bg-brand-50/30 dark:bg-brand-500/5" : ""
                            }`}
                          >
                            {/* Checkbox */}
                            <TableCell className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAnggota(anggota.id)}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-brand-500"
                              />
                            </TableCell>

                            {/* Nama */}
                            <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                              <div className="font-medium">{anggota.nama}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {anggota.no_telepon || "—"}
                              </div>
                            </TableCell>

                            {/* NIM */}
                            <TableCell className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                              {anggota.nim}
                            </TableCell>

                            {/* Jabatan */}
                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {anggota.jabatan?.nama_jabatan ?? "—"}
                            </TableCell>

                            {/* Nominal */}
                            <TableCell className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                disabled={!checked}
                                value={nominalById[anggota.id] ?? ""}
                                onChange={(e) =>
                                  handleNominalChange(anggota.id, e.target.value)
                                }
                                placeholder="0"
                                className="h-10 w-32 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                              />
                            </TableCell>

                            {/* Bukti Transfer (per anggota) */}
                            <TableCell className="px-4 py-3">
                              {checked ? (
                                file ? (
                                  /* File selected — show preview chip */
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1.5 text-xs text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                                      <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                                      <span className="max-w-[100px] truncate">
                                        {file.name}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setBuktiById((prev) => {
                                          const nb = { ...prev };
                                          delete nb[anggota.id];
                                          return nb;
                                        });
                                        if (fileInputRefs.current[anggota.id]) {
                                          fileInputRefs.current[anggota.id]!.value = "";
                                        }
                                      }}
                                      className="rounded-full p-0.5 text-gray-400 hover:text-error-500"
                                      title="Hapus file"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  /* No file yet — show file picker */
                                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400">
                                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span>Pilih gambar</span>
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg, image/jpg"
                                      className="hidden"
                                      ref={(el) => {
                                        fileInputRefs.current[anggota.id] = el;
                                      }}
                                      onChange={(e) =>
                                        handleFileChange(
                                          anggota.id,
                                          e.target.files?.[0] ?? null,
                                        )
                                      }
                                    />
                                  </label>
                                )
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* ── Right: Summary ─────────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <ComponentCard title="Ringkasan" desc="Pastikan semua data sudah lengkap.">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Anggota dipilih</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {selectedIds.size}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Bukti diunggah</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {Object.values(buktiById).filter(Boolean).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Total nominal</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  Rp {formatRupiah(totalNominal)}
                </span>
              </div>
            </div>

            {selectedList.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Anggota dipilih:
                </p>
                <ul className="space-y-1">
                  {selectedList.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {a.nama}
                      </span>
                      <span
                        className={`ml-2 shrink-0 ${
                          buktiById[a.id]
                            ? "text-success-600 dark:text-success-400"
                            : "text-error-500"
                        }`}
                      >
                        {buktiById[a.id] ? "✓ Bukti" : "✗ Belum"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
                {message}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="sm"
            >
              {submitting ? "Mengirim..." : "Kirim Setoran"}
            </Button>
          </ComponentCard>

          <ComponentCard title="Petunjuk" desc="Catatan penting untuk setoran.">
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">1.</span>
                Centang anggota yang sudah membayar.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">2.</span>
                Isi nominal pembayaran di kolom Nominal.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">3.</span>
                Unggah bukti transfer <strong>per anggota</strong> (PNG/JPG/JPEG).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">4.</span>
                Klik &quot;Kirim Setoran&quot; setelah semua data lengkap.
              </li>
            </ul>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
