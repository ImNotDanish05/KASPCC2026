"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { ZoomIn, ZoomOut, RotateCcw, X, Plus, Pencil, Trash2, Eye, ImageOff } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BuktiNota = { id: number; url_bukti: string };

type DetailItem = { id: number; keterangan: string; nominal: number };

type Pengeluaran = {
  id: number;
  nama_kegiatan: string;
  total_nominal: number;
  created_at: string;
  user: { username: string; anggota: { nama: string } };
  details: DetailItem[];
  buktis: BuktiNota[];
};

type FormDetail = { keterangan: string; nominal: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  return String(v);
}
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function formatRupiah(v: number) {
  return new Intl.NumberFormat("id-ID").format(v);
}
function formatDate(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("id-ID");
}
function mapPengeluaran(raw: unknown): Pengeluaran {
  const d = raw as Record<string, unknown>;
  const user = (d.user ?? {}) as Record<string, unknown>;
  const anggota = (user.anggota ?? {}) as Record<string, unknown>;
  const rawDetails = Array.isArray(d.details) ? d.details : [];
  const rawBuktis = Array.isArray(d.buktis) ? d.buktis : [];
  return {
    id: toNum(d.id),
    nama_kegiatan: toStr(d.nama_kegiatan ?? d.namaKegiatan),
    total_nominal: toNum(d.total_nominal ?? d.totalNominal),
    created_at: toStr(d.created_at ?? d.createdAt),
    user: { username: toStr(user.username), anggota: { nama: toStr(anggota.nama) } },
    details: rawDetails.map((x) => {
      const dd = x as Record<string, unknown>;
      return { id: toNum(dd.id), keterangan: toStr(dd.keterangan), nominal: toNum(dd.nominal) };
    }),
    buktis: rawBuktis.map((x) => {
      const bb = x as Record<string, unknown>;
      return { id: toNum(bb.id), url_bukti: toStr(bb.url_bukti ?? bb.urlBukti) };
    }),
  };
}

// ── ImageViewerModal ──────────────────────────────────────────────────────────

function ImageViewerModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[999999] flex h-screen w-screen items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog" aria-modal="true"
    >
      <div className="relative flex h-[90vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Bukti Nota</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <TransformWrapper initialScale={1} minScale={0.3} maxScale={10} centerOnInit wheel={{ step: 0.1 }}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/60">
                <button onClick={() => zoomIn()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"><ZoomIn className="h-3.5 w-3.5" />Perbesar</button>
                <button onClick={() => zoomOut()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"><ZoomOut className="h-3.5 w-3.5" />Perkecil</button>
                <button onClick={() => resetTransform()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
              </div>
              <div className="flex flex-1 items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-950">
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={label} className="max-h-full max-w-full select-none object-contain" draggable={false} />
                </TransformComponent>
              </div>
            </div>
          )}
        </TransformWrapper>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline hover:text-brand-700 dark:text-brand-400">Buka di tab baru ↗</a>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900">Tutup</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── DeleteConfirmDialog ───────────────────────────────────────────────────────

function DeleteConfirmDialog({ onConfirm, onCancel, deleting }: {
  onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Hapus Pengeluaran?</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tindakan ini tidak bisa dibatalkan. Semua detail dan bukti nota terkait juga akan dihapus.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} disabled={deleting} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">Batal</button>
          <button onClick={onConfirm} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-error-600 disabled:opacity-50">
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── PengeluaranFormModal ──────────────────────────────────────────────────────

type FormModalProps = {
  editing: Pengeluaran | null;
  onClose: () => void;
  onSaved: () => void;
  onViewImage: (url: string, label: string) => void;
};

function PengeluaranFormModal({ editing, onClose, onSaved, onViewImage }: FormModalProps) {
  const isEdit = editing !== null;
  const [namaKegiatan, setNamaKegiatan] = useState(editing?.nama_kegiatan ?? "");
  const [details, setDetails] = useState<FormDetail[]>(
    isEdit && editing!.details.length > 0
      ? editing!.details.map((d) => ({ keterangan: d.keterangan, nominal: String(d.nominal) }))
      : [{ keterangan: "", nominal: "" }],
  );
  const [keepBuktis, setKeepBuktis] = useState<BuktiNota[]>(editing?.buktis ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalNominal = details.reduce((s, d) => s + (parseFloat(d.nominal) || 0), 0);

  function addDetail() { setDetails((p) => [...p, { keterangan: "", nominal: "" }]); }
  function removeDetail(i: number) { setDetails((p) => p.filter((_, idx) => idx !== i)); }
  function updateDetail(i: number, field: keyof FormDetail, val: string) {
    setDetails((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }
  function removeKeepBukti(id: number) { setKeepBuktis((p) => p.filter((b) => b.id !== id)); }
  function removeNewFile(i: number) { setNewFiles((p) => p.filter((_, idx) => idx !== i)); }
  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      ["image/png", "image/jpeg", "image/jpg"].includes(f.type),
    );
    setNewFiles((p) => [...p, ...picked]);
    e.target.value = "";
  }

  async function handleSubmit() {
    setError(null);
    if (!namaKegiatan.trim()) { setError("Nama kegiatan wajib diisi."); return; }
    if (details.length === 0) { setError("Minimal satu detail diperlukan."); return; }
    for (const d of details) {
      if (!d.keterangan.trim() || !(parseFloat(d.nominal) > 0)) {
        setError("Setiap detail harus memiliki keterangan dan nominal > 0."); return;
      }
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("namaKegiatan", namaKegiatan.trim());
      fd.append("details", JSON.stringify(details.map((d) => ({ keterangan: d.keterangan.trim(), nominal: parseFloat(d.nominal) }))));
      if (isEdit) fd.append("keepBuktiIds", JSON.stringify(keepBuktis.map((b) => b.id)));
      for (const file of newFiles) fd.append("buktis", file);

      const url = isEdit ? `/api/pengeluaran/${editing!.id}` : "/api/pengeluaran";
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Gagal menyimpan.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Nama Kegiatan */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Kegiatan</label>
            <input value={namaKegiatan} onChange={(e) => setNamaKegiatan(e.target.value)} placeholder="Contoh: Training Basic, PCC Class" className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>

          {/* Detail Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Detail Pengeluaran</label>
              <button onClick={addDetail} className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
                <Plus className="h-3.5 w-3.5" />Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input value={d.keterangan} onChange={(e) => updateDetail(i, "keterangan", e.target.value)} placeholder="Keterangan" className="h-10 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                  <input type="number" min={0} value={d.nominal} onChange={(e) => updateDetail(i, "nominal", e.target.value)} placeholder="Nominal" className="h-10 w-36 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                  {details.length > 1 && (
                    <button onClick={() => removeDetail(i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: Rp {formatRupiah(totalNominal)}
            </div>
          </div>

          {/* Existing buktis (edit mode) */}
          {isEdit && keepBuktis.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Bukti Nota Saat Ini</label>
              <div className="flex flex-wrap gap-2">
                {keepBuktis.map((b) => (
                  <div key={b.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.url_bukti} alt="bukti" onClick={() => onViewImage(b.url_bukti, "Bukti Nota")} className="h-20 w-20 cursor-pointer rounded-lg border border-gray-200 object-cover transition group-hover:opacity-80 dark:border-gray-700" />
                    <button onClick={() => removeKeepBukti(b.id)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white shadow"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isEdit ? "Tambah Bukti Nota Baru" : "Bukti Nota"}
            </label>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400">
              <Plus className="h-4 w-4" />Pilih Foto (PNG/JPG)
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" multiple className="hidden" onChange={handleFilePick} />
            {newFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
                    <button onClick={() => removeNewFile(i)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white shadow"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button onClick={onClose} disabled={submitting} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
            {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Pengeluaran"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PengeluaranPage() {
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengeluaran | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image viewer
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLabel, setViewerLabel] = useState("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pengeluaran");
      if (!res.ok) throw new Error("Gagal memuat data.");
      const payload = (await res.json()) as { data?: unknown[] };
      setData(Array.isArray(payload.data) ? payload.data.map(mapPengeluaran) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Determine role
    fetch("/api/me")
      .then((r) => r.json())
      .then((res) => {
        const roles: string[] = res.user?.roles ?? [];
        setIsReadOnly(!roles.includes("Bendahara Inti"));
      })
      .catch(() => {});
    loadData();
  }, []);

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pengeluaran/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Gagal menghapus.");
      }
      setDeleteId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() { setEditingItem(null); setFormOpen(true); }
  function openEdit(item: Pengeluaran) { setEditingItem(item); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditingItem(null); }
  function onSaved() { closeForm(); void loadData(); }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Pengeluaran KAS" />

      {/* Image viewer modal */}
      {viewerUrl && (
        <ImageViewerModal url={viewerUrl} label={viewerLabel} onClose={() => { setViewerUrl(null); setViewerLabel(""); }} />
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <DeleteConfirmDialog
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          deleting={deleting}
        />
      )}

      {/* Add/Edit form */}
      {formOpen && (
        <PengeluaranFormModal
          editing={editingItem}
          onClose={closeForm}
          onSaved={onSaved}
          onViewImage={(url, label) => { setViewerUrl(url); setViewerLabel(label); }}
        />
      )}

      <ComponentCard
        title="Daftar Pengeluaran KAS"
        desc="Reimbursement yang telah dicatat oleh Bendahara Inti."
      >
        {/* Toolbar */}
        {!isReadOnly && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Pengeluaran
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Memuat data...
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            Belum ada pengeluaran yang dicatat.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["Nama Kegiatan", "Total Nominal", "Dicatat Oleh", "Tanggal", "Bukti Nota", "Aksi"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 dark:text-white/90">{item.nama_kegiatan}</div>
                        <div className="mt-0.5 text-xs text-gray-400">{item.details.length} item</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">
                        Rp {formatRupiah(item.total_nominal)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.user.anggota.nama || item.user.username}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {item.buktis.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.buktis.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => { setViewerUrl(b.url_bukti); setViewerLabel(item.nama_kegiatan); }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                                title="Lihat bukti"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800">
                            <ImageOff className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isReadOnly && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-error-200 text-error-500 transition hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}

