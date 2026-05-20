"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, ImageOff, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/modal";

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
  userId: number;
  nominal_total: number;
  bukti_transfer: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  alasan_tolak: string | null;
  created_at: string;
  details: Detail[];
  user: User;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID");
}

function normalizeKategori(value: unknown): Jabatan["kategori"] {
  if (value === "DIVISI" || value === "DEPARTEMEN" || value === "INTI") {
    return value;
  }
  return "DIVISI";
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toString(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapJabatan(raw: unknown): Jabatan {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nama_jabatan: toString(data.nama_jabatan ?? data.namaJabatan),
    kategori: normalizeKategori(data.kategori),
  };
}

function mapAnggota(raw: unknown): Anggota {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    nim: toString(data.nim),
    nama: toString(data.nama),
    no_telepon: toString(data.no_telepon ?? data.noTelepon),
    jabatan_id: toNumber(data.jabatan_id ?? data.jabatanId),
    jabatan: data.jabatan ? mapJabatan(data.jabatan) : undefined,
  };
}

function mapDetail(raw: unknown): Detail {
  const data = raw as Record<string, unknown>;
  const rawLinkBukti = data.link_bukti ?? data.linkBukti;
  return {
    id: toNumber(data.id),
    nominal_bayar: toNumber(data.nominal_bayar ?? data.nominalBayar),
    link_bukti: typeof rawLinkBukti === "string" && rawLinkBukti ? rawLinkBukti : null,
    anggota: mapAnggota(data.anggota ?? {}),
  };
}

function mapUser(raw: unknown): User {
  const data = raw as Record<string, unknown>;
  return {
    id: toNumber(data.id),
    username: toString(data.username),
    anggota: mapAnggota(data.anggota ?? {}),
  };
}

function mapPemasukan(raw: unknown): Pemasukan {
  const data = raw as Record<string, unknown>;
  const detailsRaw = Array.isArray(data.details) ? data.details : [];
  return {
    id: toNumber(data.id),
    userId: toNumber(data.userId ?? data.user_id),
    nominal_total: toNumber(data.nominal_total ?? data.nominalTotal),
    bukti_transfer: toString(data.bukti_transfer ?? data.buktiTransfer),
    status: (data.status as Pemasukan["status"]) ?? "PENDING",
    alasan_tolak: (data.alasan_tolak ?? data.alasanTolak ?? null) as
      | string
      | null,
    created_at: toString(data.created_at ?? data.createdAt),
    details: detailsRaw.map((detail: unknown) => mapDetail(detail)),
    user: mapUser(data.user ?? {}),
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-black/80 backdrop-blur-sm"
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

  // Render the modal into document.body using Portal
  return createPortal(modalContent, document.body);
}

export default function KasHistoryPage() {
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<Pemasukan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<Pemasukan | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerNama, setViewerNama] = useState<string>("");

  // Revisi status states
  const [revisiItem, setRevisiItem] = useState<Pemasukan | null>(null);
  const [revisiStatus, setRevisiStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [revisiAlasan, setRevisiAlasan] = useState<string>("");
  const [revisiLoading, setRevisiLoading] = useState<boolean>(false);
  const [revisiError, setRevisiError] = useState<string | null>(null);

  function openRevisi(item: Pemasukan) {
    setRevisiItem(item);
    setRevisiStatus(item.status);
    setRevisiAlasan(item.alasan_tolak ?? "");
    setRevisiError(null);
  }

  function closeRevisi() {
    setRevisiItem(null);
    setRevisiStatus("PENDING");
    setRevisiAlasan("");
    setRevisiError(null);
  }

  async function handleRevisiSubmit() {
    if (!revisiItem) return;
    if (revisiStatus === "REJECTED" && !revisiAlasan.trim()) {
      setRevisiError("Alasan penolakan wajib diisi.");
      return;
    }

    setRevisiLoading(true);
    setRevisiError(null);
    try {
      const res = await fetch(`/api/kas/verify/${revisiItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: revisiStatus,
          alasanTolak: revisiStatus === "REJECTED" ? revisiAlasan.trim() : "",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal memproses revisi.");
      }

      await loadData();
      closeRevisi();
    } catch (err) {
      setRevisiError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setRevisiLoading(false);
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

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        setCurrentUserId(res.user?.id ?? null);
        setUserRoles(res.user?.roles ?? []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const isInternal = userRoles.includes("Bendahara Inti") || userRoles.includes("Superadmin");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    const url = `/api/kas/history${params.toString() ? `?${params}` : ""}`;
    console.log(url)
    fetch(url)
      .then((res) => res.json())
      .then((payload: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(payload.data)
          ? payload.data.map((item: unknown) => mapPemasukan(item))
          : [];
        setData(list);
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat data.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Riwayat Setoran KAS" />

      <ComponentCard
        title="Daftar Setoran"
        desc="Pantau status setoran dan lakukan revisi jika ditolak."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total data: {data.length}
          </div>
          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <div className="w-48">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Semua</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Tanggal
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Total
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Bukti
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada setoran.
                  </TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                  <TableCell className="px-4 py-4">-</TableCell>
                </TableRow>
              ) : (
                data.map((item: Pemasukan) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                      #{item.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "VERIFIED"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                            : item.status === "REJECTED"
                            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.alasan_tolak ? (
                        <div className="mt-2 text-xs text-error-500">
                          Alasan: {item.alasan_tolak}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      Rp {formatRupiah(item.nominal_total)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.bukti_transfer
                        ? `${item.bukti_transfer.slice(0, 32)}...`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {item.status === "REJECTED" && currentUserId === item.userId && (
                          <Link href={`/kas/resubmit/${item.id}`}>
                            <Button size="sm">Perbaiki</Button>
                          </Link>
                        )}
                        {isInternal && (
                          <button
                            onClick={() => openRevisi(item)}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                            title="Revisi Status"
                          >
                            Revisi
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </ComponentCard>

      {/* Modal Detail */}
      <Modal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        className="max-w-md p-6"
      >
        {selectedDetail && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">
              Detail Setoran #{selectedDetail.id}
            </h3>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedDetail.user?.anggota?.nama ?? selectedDetail.user?.username}
              </span>
              {selectedDetail.user?.anggota?.jabatan?.nama_jabatan && (
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                  {selectedDetail.user.anggota.jabatan.nama_jabatan}
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  selectedDetail.status === "VERIFIED"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                    : selectedDetail.status === "REJECTED"
                    ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                    : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                }`}
              >
                {selectedDetail.status}
              </span>
            </div>
            {selectedDetail.status === "REJECTED" && selectedDetail.alasan_tolak && (
              <div className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
                <span className="font-semibold">Alasan Penolakan: </span>
                {selectedDetail.alasan_tolak}
              </div>
            )}
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {selectedDetail.details.map((detail: Detail) => (
                <div
                  key={detail.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    {detail.link_bukti ? (
                      <button
                        onClick={() => openViewer(detail.link_bukti!, detail.anggota.nama)}
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
                    <span className="font-medium">
                      {detail.anggota.nama} ({detail.anggota.nim})
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    Rp {formatRupiah(detail.nominal_bayar)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Revisi */}
      <Modal
        isOpen={!!revisiItem}
        onClose={closeRevisi}
        className="max-w-md p-6"
      >
        {revisiItem && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
              Revisi Status Setoran #{revisiItem.id}
            </h3>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pengirim: <span className="font-semibold text-gray-700 dark:text-gray-300">{revisiItem.user?.anggota?.nama ?? revisiItem.user?.username}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Nominal: <span className="font-semibold text-gray-700 dark:text-gray-300">Rp {formatRupiah(revisiItem.nominal_total)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pilih Status Verifikasi
              </label>
              <select
                value={revisiStatus}
                onChange={(e) => {
                  const val = e.target.value as "PENDING" | "VERIFIED" | "REJECTED";
                  setRevisiStatus(val);
                  if (val !== "REJECTED") {
                    setRevisiError(null);
                  }
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="PENDING">PENDING (Batalkan / Belum Diverifikasi)</option>
                <option value="VERIFIED">VERIFIED (Diterima / Disetujui)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>

            {revisiStatus === "REJECTED" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  value={revisiAlasan}
                  onChange={(e) => setRevisiAlasan(e.target.value)}
                  placeholder="Masukkan alasan penolakan setoran..."
                  className="w-full min-h-[80px] rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            )}

            {revisiError && (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {revisiError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeRevisi}
                disabled={revisiLoading}
                size="sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleRevisiSubmit}
                disabled={revisiLoading}
                size="sm"
                className="bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                {revisiLoading ? "Menyimpan..." : "Simpan Revisi"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Global image viewer modal */}
      {viewerUrl && (
        <ImageViewerModal
          url={viewerUrl}
          anggotaNama={viewerNama}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
