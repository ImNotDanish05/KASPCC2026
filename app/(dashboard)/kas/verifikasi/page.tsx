"use client";

import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { ZoomIn, ZoomOut, RotateCcw, X, ImageOff, Eye } from "lucide-react";

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
  jabatan?: Jabatan;
};

type Detail = {
  id: number;
  nominal_bayar: number;
  link_bukti: string | null;
  anggota: Anggota;
};

type User = {
  id: number;
  username: string;
  anggota: Anggota;
};

type Pemasukan = {
  id: number;
  nominal_total: number;
  bukti_transfer: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  created_at: string;
  details: Detail[];
  user: User;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID");
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
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
    kategori: (d.kategori as Jabatan["kategori"]) ?? "DIVISI",
  };
}

function mapAnggota(raw: unknown): Anggota {
  const d = raw as Record<string, unknown>;
  return {
    id: toNumber(d.id),
    nim: toStr(d.nim),
    nama: toStr(d.nama),
    no_telepon: toStr(d.no_telepon ?? d.noTelepon),
    jabatan: d.jabatan ? mapJabatan(d.jabatan) : undefined,
  };
}

function mapDetail(raw: unknown): Detail {
  const d = raw as Record<string, unknown>;
  const rawLinkBukti = d.link_bukti ?? d.linkBukti;
  return {
    id: toNumber(d.id),
    nominal_bayar: toNumber(d.nominal_bayar ?? d.nominalBayar),
    link_bukti: typeof rawLinkBukti === "string" && rawLinkBukti ? rawLinkBukti : null,
    anggota: mapAnggota(d.anggota ?? {}),
  };
}

function mapUser(raw: unknown): User {
  const d = raw as Record<string, unknown>;
  return {
    id: toNumber(d.id),
    username: toStr(d.username),
    anggota: mapAnggota(d.anggota ?? {}),
  };
}

function mapPemasukan(raw: unknown): Pemasukan {
  const d = raw as Record<string, unknown>;
  const detailsRaw = Array.isArray(d.details) ? d.details : [];
  return {
    id: toNumber(d.id),
    nominal_total: toNumber(d.nominal_total ?? d.nominalTotal),
    bukti_transfer: toStr(d.bukti_transfer ?? d.buktiTransfer),
    status: (d.status as Pemasukan["status"]) ?? "PENDING",
    created_at: toStr(d.created_at ?? d.createdAt),
    details: detailsRaw.map(mapDetail),
    user: mapUser(d.user ?? {}),
  };
}

// ── Image Viewer Modal ────────────────────────────────────────────────────────

interface ImageViewerModalProps {
  url: string;
  anggotaNama: string;
  onClose: () => void;
}

function ImageViewerModal({ url, anggotaNama, onClose }: ImageViewerModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Lihat Bukti Transfer"
    >
      <div className="relative flex h-[90vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Bukti Transfer
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {anggotaNama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={10}
          centerOnInit
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/60">
                <button
                  onClick={() => zoomIn()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  Perbesar
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                  Perkecil
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  Scroll untuk zoom · Geser untuk pindah
                </span>
              </div>

              {/* Image canvas */}
              <div className="flex flex-1 items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-950">
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Bukti transfer ${anggotaNama}`}
                    className="max-h-full max-w-full select-none object-contain"
                    draggable={false}
                  />
                </TransformComponent>
              </div>
            </div>
          )}
        </TransformWrapper>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-600 underline hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Buka di tab baru ↗
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VerifikasiKasPage() {
  const [data, setData] = useState<Pemasukan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<number, string>>({});

  // Image viewer
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerNama, setViewerNama] = useState<string>("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kas/history?status=PENDING");
      const payload = (await res.json()) as { data?: unknown[] };
      const list = Array.isArray(payload.data)
        ? payload.data.map(mapPemasukan)
        : [];
      setData(list);
    } catch {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleVerify(id: number, status: "VERIFIED" | "REJECTED") {
    const alasan_tolak = commentById[id]?.trim() ?? "";
    if (status === "REJECTED" && !alasan_tolak) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/kas/verify/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, alasan_tolak, alasanTolak: alasan_tolak }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Gagal memproses.");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  function openViewer(url: string, nama: string) {
    setViewerUrl(url);
    setViewerNama(nama);
  }

  function closeViewer() {
    setViewerUrl(null);
    setViewerNama("");
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Verifikasi Setoran" />

      {/* Global image viewer modal */}
      {viewerUrl && (
        <ImageViewerModal
          url={viewerUrl}
          anggotaNama={viewerNama}
          onClose={closeViewer}
        />
      )}

      {error && (
        <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <ComponentCard
        title="Setoran Pending"
        desc="Tinjau setoran yang masuk dan berikan keputusan."
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Memuat data...
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada setoran yang perlu diverifikasi.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item: Pemasukan) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40"
              >
                {/* Card Header */}
                <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Setoran #{item.id}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {item.user?.anggota?.nama ?? item.user?.username}
                      </span>
                      {item.user?.anggota?.jabatan?.nama_jabatan && (
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                          {item.user.anggota.jabatan.nama_jabatan}
                        </span>
                      )}
                      <span>· {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Rp {formatRupiah(item.nominal_total)}
                  </div>
                </div>

                {/* Detail rows */}
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {item.details.map((detail: Detail) => (
                    <div
                      key={detail.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        {/* Bukti viewer button */}
                        {detail.link_bukti ? (
                          <button
                            onClick={() =>
                              openViewer(detail.link_bukti!, detail.anggota.nama)
                            }
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                            title={`Lihat bukti transfer ${detail.anggota.nama}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                            title="Tidak ada bukti"
                          >
                            <ImageOff className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div>
                          <div className="text-sm text-gray-700 dark:text-white/80">
                            {detail.anggota.nama}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {detail.anggota.nim}
                          </div>
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        Rp {formatRupiah(detail.nominal_bayar)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Comment + Actions */}
                <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-800">
                  <div className="mb-3">
                    <Label>Komentar (wajib jika ditolak)</Label>
                    <TextArea
                      value={commentById[item.id] ?? ""}
                      onChange={(value) =>
                        setCommentById((prev) => ({ ...prev, [item.id]: value }))
                      }
                      rows={2}
                      placeholder="Contoh: bukti transfer tidak jelas."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleVerify(item.id, "VERIFIED")}
                      className="inline-flex items-center justify-center rounded-lg bg-success-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-success-600"
                    >
                      ✓ Setujui
                    </button>
                    <button
                      onClick={() => handleVerify(item.id, "REJECTED")}
                      className="inline-flex items-center justify-center rounded-lg bg-error-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-error-600"
                    >
                      ✕ Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
