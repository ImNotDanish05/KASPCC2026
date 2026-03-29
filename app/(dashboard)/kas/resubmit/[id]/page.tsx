"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ImageIcon, X, ExternalLink } from "lucide-react";

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

type Detail = {
  id: number;
  nominal_bayar: number;
  link_bukti: string;
  anggota: Anggota;
};

type Pemasukan = {
  id: number;
  userId: number;
  jabatan_id: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  alasan_tolak: string | null;
  details: Detail[];
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

function mapDetail(raw: unknown): Detail {
  const d = raw as Record<string, unknown>;
  return {
    id: toNumber(d.id),
    nominal_bayar: toNumber(d.nominal_bayar ?? d.nominalBayar),
    link_bukti: toStr(d.link_bukti ?? d.linkBukti),
    anggota: mapAnggota(d.anggota ?? {}),
  };
}

function mapPemasukan(raw: unknown): Pemasukan {
  const d = raw as Record<string, unknown>;
  const detailsRaw = Array.isArray(d.details) ? d.details : [];
  return {
    id: toNumber(d.id),
    userId: toNumber(d.userId ?? d.user_id),
    jabatan_id: toNumber(d.jabatan_id ?? d.jabatanId),
    status: (d.status as Pemasukan["status"]) ?? "PENDING",
    alasan_tolak: (d.alasan_tolak ?? d.alasanTolak ?? null) as string | null,
    details: detailsRaw.map(mapDetail),
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

export default function ResubmitKasPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const pemasukanId = Number(Array.isArray(idParam) ? idParam[0] : idParam);

  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [anggotas, setAnggotas] = useState<Anggota[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [selectedJabatanId, setSelectedJabatanId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [pemasukan, setPemasukan] = useState<Pemasukan | null>(null);

  // Per-row states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [nominalById, setNominalById] = useState<Record<number, string>>({});
  const [existingBuktiById, setExistingBuktiById] = useState<Record<number, string>>({});
  const [newBuktiFileById, setNewBuktiFileById] = useState<Record<number, File | null>>({});

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File input refs
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
        setCurrentUserId(res.user?.id ?? null);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // ── Fetch jabatans ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetch("/api/jabatans")
      .then((r) => r.json())
      .then((data: { data?: unknown[] }) => {
        if (!active) return;
        setJabatans(Array.isArray(data.data) ? data.data.map(mapJabatan) : []);
      })
      .catch(() => { if (active) setJabatans([]); });
    return () => { active = false; };
  }, []);

  // ── Fetch existing pemasukan data ───────────────────────────────────────────
  useEffect(() => {
    let active = true;
    if (!Number.isFinite(pemasukanId)) {
      setLoadingData(false);
      setError("ID tidak valid.");
      return;
    }
    setLoadingData(true);
    fetch("/api/kas/history?status=REJECTED")
      .then((res) => res.json())
      .then((payload: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(payload.data)
          ? payload.data.map(mapPemasukan)
          : [];
        const found = list.find((item) => item.id === pemasukanId);
        
        if (!found) {
          setError("Data setoran tidak ditemukan atau tidak berstatus Ditolak.");
        } else {
          setPemasukan(found);
          setSelectedJabatanId(String(found.jabatan_id));
          
          const nextSelected = new Set<number>();
          const nextNominal: Record<number, string> = {};
          const nextExistingBukti: Record<number, string> = {};
          
          found.details.forEach((d) => {
            const aId = d.anggota.id;
            nextSelected.add(aId);
            nextNominal[aId] = String(d.nominal_bayar);
            if (d.link_bukti) nextExistingBukti[aId] = d.link_bukti;
          });
          
          setSelectedIds(nextSelected);
          setNominalById(nextNominal);
          setExistingBuktiById(nextExistingBukti);
        }
      })
      .catch(() => {
        if (active) setError("Gagal memuat data revisi.");
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => { active = false; };
  }, [pemasukanId]);

  // ── Fetch anggota list (reactive to selectedJabatanId search/filter) ────────
  useEffect(() => {
    let active = true;
    setLoadingAnggota(true);
    const filters = new URLSearchParams();
    if (selectedJabatanId) filters.set("jabatanId", selectedJabatanId);
    if (query.trim()) filters.set("q", query.trim());
    
    fetch(`/api/anggotas${filters.toString() ? `?${filters}` : ""}`)
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
        setNewBuktiFileById((b) => { const nb = { ...b }; delete nb[id]; return nb; });
        if (fileInputRefs.current[id]) fileInputRefs.current[id]!.value = "";
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
    if (file && !["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Hanya file PNG, JPG, dan JPEG yang diizinkan.");
      if (fileInputRefs.current[id]) fileInputRefs.current[id]!.value = "";
      return;
    }
    setNewBuktiFileById((prev) => ({ ...prev, [id]: file }));
    setError(null);
  }

  async function handleSubmit() {
    setMessage(null);
    setError(null);

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

    // Every selected member must either have an existing link_bukti OR a newly uploaded file
    const missingBukti = Array.from(selectedIds).find(
      (id) => !existingBuktiById[id] && !newBuktiFileById[id]
    );
    if (missingBukti !== undefined) {
      setError("Semua anggota yang dipilih harus memiliki bukti transfer.");
      return;
    }

    setSubmitting(true);
    try {
      const items: { anggotaId: number; nominalBayar: number; buktiBase64?: string }[] = [];
      
      for (const id of Array.from(selectedIds)) {
        const file = newBuktiFileById[id];
        let buktiBase64: string | undefined = undefined;
        if (file) {
          buktiBase64 = await fileToBase64(file);
        }
        
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

      const response = await fetch(`/api/kas/resubmit/${pemasukanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Gagal mengirim setoran.");
      }

      setMessage("Setoran berhasil dikirim ulang. Mengalihkan...");
      setTimeout(() => {
        router.push("/kas/history");
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  // ── Render Validation ───────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Revisi Setoran" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Memuat data revisi...
        </div>
      </div>
    );
  }

  if (!pemasukan) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Revisi Setoran" />
        <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error ?? "Data tidak ditemukan."}
        </div>
      </div>
    );
  }

  // ── Authorization Check ─────────────────────────────────────────────────────
  if (currentUserId !== null && pemasukan.userId !== currentUserId) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Akses Ditolak" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-error-200 bg-error-50 p-8 text-center dark:border-error-500/30 dark:bg-error-500/10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
            <svg
              className="h-8 w-8 text-error-600 dark:text-error-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-error-700 dark:text-error-400">
            Akses Ditolak
          </h3>
          <p className="mb-6 max-w-md text-sm text-error-600 dark:text-error-400">
            Anda tidak memiliki izin untuk mengubah data setoran ini.
          </p>
          <Button
            onClick={() => router.push("/kas/history")}
            size="sm"
            className="bg-gray-800 hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Kembali ke Riwayat
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={`Revisi Setoran #KAS-${pemasukan.id}`} />

      {pemasukan.alasan_tolak && (
        <ComponentCard title="Alasan Penolakan dari Internal" desc="Harap perbaiki data berdasarkan catatan ini.">
          <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {pemasukan.alasan_tolak}
          </div>
        </ComponentCard>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* ── Left: Anggota Table ─────────────────────────────────────────── */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <ComponentCard
            title="Daftar Anggota"
            desc="Sesuaikan anggota, ubah nominal, atau ganti bukti transfer per anggota."
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
                        const newFile = newBuktiFileById[anggota.id] ?? null;
                        const existingLink = existingBuktiById[anggota.id];

                        return (
                          <TableRow
                            key={anggota.id}
                            className={`border-b border-gray-100 dark:border-gray-800 ${
                              checked ? "bg-brand-50/30 dark:bg-brand-500/5" : ""
                            }`}
                          >
                            <TableCell className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAnggota(anggota.id)}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-brand-500"
                              />
                            </TableCell>

                            <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                              <div className="font-medium">{anggota.nama}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {anggota.no_telepon || "—"}
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                              {anggota.nim}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {anggota.jabatan?.nama_jabatan ?? "—"}
                            </TableCell>

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

                            <TableCell className="px-4 py-3">
                              {!checked ? (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              ) : newFile ? (
                                /* New file selected */
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1.5 text-xs text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="max-w-[100px] truncate">{newFile.name}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setNewBuktiFileById((prev) => {
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
                              ) : existingLink ? (
                                /* Existing DB file */
                                <div className="flex items-center gap-2">
                                  <a
                                    href={existingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:text-brand-400 dark:hover:bg-gray-800"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Tersimpan
                                  </a>
                                  <label
                                    className="cursor-pointer text-xs text-gray-500 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                                    title="Ganti gambar"
                                  >
                                    Ganti
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg, image/jpg"
                                      className="hidden"
                                      ref={(el) => {
                                        fileInputRefs.current[anggota.id] = el;
                                      }}
                                      onChange={(e) =>
                                        handleFileChange(anggota.id, e.target.files?.[0] ?? null)
                                      }
                                    />
                                  </label>
                                </div>
                              ) : (
                                /* Need file */
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
                                      handleFileChange(anggota.id, e.target.files?.[0] ?? null)
                                    }
                                  />
                                </label>
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
                  {Object.values(newBuktiFileById).filter(Boolean).length} baru
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
                  {selectedList.map((a) => {
                    const hasBukti =
                      newBuktiFileById[a.id] != null || existingBuktiById[a.id] != null;
                    return (
                      <li key={a.id} className="flex items-center justify-between text-xs">
                        <span className="truncate text-gray-700 dark:text-gray-300">
                          {a.nama}
                        </span>
                        <span
                          className={`ml-2 shrink-0 ${
                            hasBukti
                              ? "text-success-600 dark:text-success-400"
                              : "text-error-500"
                          }`}
                        >
                          {hasBukti ? "✓ Bukti" : "✗ Belum"}
                        </span>
                      </li>
                    );
                  })}
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
              {submitting ? "Kirim Ulang..." : "Kirim Revisi Setoran"}
            </Button>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
