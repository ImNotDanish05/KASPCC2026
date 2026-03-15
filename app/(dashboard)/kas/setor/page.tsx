"use client";

import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

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

type SetorResponse = {
  data: {
    id: number;
  };
};

type SetorItem = {
  anggota_id: number;
  nominal_bayar: number;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
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

export default function SetorKasPage() {
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [anggotas, setAnggotas] = useState<Anggota[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [selectedJabatanId, setSelectedJabatanId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [buktiTransfer, setBuktiTransfer] = useState("");
  const [buktiFileName, setBuktiFileName] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [nominalById, setNominalById] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/jabatans")
      .then((res) => res.json())
      .then((data: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(data.data)
          ? data.data.map((item: unknown) => mapJabatan(item))
          : [];
        setJabatans(list);
      })
      .catch(() => {
        if (!active) return;
        setJabatans([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingAnggota(true);
    const params = new URLSearchParams();
    if (selectedJabatanId) {
      params.set("jabatanId", selectedJabatanId);
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const url = `/api/anggotas${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((data: { data?: unknown[] }) => {
        if (!active) return;
        const list = Array.isArray(data.data)
          ? data.data.map((item: unknown) => mapAnggota(item))
          : [];
        setAnggotas(list);
      })
      .catch(() => {
        if (!active) return;
        setAnggotas([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingAnggota(false);
      });
    return () => {
      active = false;
    };
  }, [selectedJabatanId, query]);

  const totalNominal = useMemo(() => {
    let total = 0;
    selectedIds.forEach((id: number) => {
      const raw = nominalById[id];
      const value = raw ? Number(raw) : 0;
      if (Number.isFinite(value) && value > 0) {
        total += value;
      }
    });
    return total;
  }, [selectedIds, nominalById]);

  function toggleAnggota(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleNominalChange(id: number, value: string) {
    setNominalById((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  async function handleFileChange(file: File | null) {
    if (!file) {
      setBuktiFileName(null);
      setBuktiTransfer("");
      return;
    }
    setBuktiFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBuktiTransfer(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setMessage(null);
    setError(null);

    const items = Array.from(selectedIds)
      .map((id: number) => ({
        anggota_id: id,
        nominal_bayar: Number(nominalById[id]),
      }))
      .filter(
        (item: SetorItem) =>
          Number.isFinite(item.nominal_bayar) && item.nominal_bayar > 0,
      );

    if (!buktiTransfer) {
      setError("Bukti transfer wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setError("Pilih anggota dan isi nominalnya terlebih dahulu.");
      return;
    }

    const itemsPayload = items.map((item: SetorItem) => ({
      anggota_id: item.anggota_id,
      nominal_bayar: item.nominal_bayar,
      anggotaId: item.anggota_id,
      nominalBayar: item.nominal_bayar,
    }));

    setSubmitting(true);
    try {
      const response = await fetch("/api/kas/setor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bukti_transfer: buktiTransfer,
          buktiTransfer: buktiTransfer,
          items: itemsPayload,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal mengirim setoran.");
      }
      const body = (await response.json()) as SetorResponse;
      setMessage(`Setoran berhasil dikirim. ID: ${body.data.id}`);
      setSelectedIds(new Set());
      setNominalById({});
      setBuktiTransfer("");
      setBuktiFileName(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Setor KAS" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <ComponentCard
            title="Daftar Anggota"
            desc="Pilih anggota yang sudah membayar dan masukkan nominalnya."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Cari anggota</Label>
                <Input
                  placeholder="Cari nama atau NIM"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div>
                <Label>Filter jabatan</Label>
                <select
                  value={selectedJabatanId}
                  onChange={(event) => setSelectedJabatanId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Semua jabatan</option>
                  {jabatans.map((jabatan: Jabatan) => (
                    <option key={jabatan.id} value={String(jabatan.id)}>
                      {jabatan.nama_jabatan}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                      Pilih
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                      Nama
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                      NIM
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                      Jabatan
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                      Nominal
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAnggota ? (
                    <TableRow>
                      <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Memuat data anggota...
                      </TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                    </TableRow>
                  ) : anggotas.length === 0 ? (
                    <TableRow>
                      <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        Tidak ada anggota ditemukan.
                      </TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                      <TableCell className="px-4 py-4">-</TableCell>
                    </TableRow>
                  ) : (
                    anggotas.map((anggota: Anggota) => {
                      const checked = selectedIds.has(anggota.id);
                      return (
                        <TableRow key={anggota.id}>
                          <TableCell className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAnggota(anggota.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                            <div className="font-semibold">{anggota.nama}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {anggota.no_telepon || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {anggota.nim}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {anggota.jabatan?.nama_jabatan ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              disabled={!checked}
                              value={nominalById[anggota.id] ?? ""}
                              onChange={(event) =>
                                handleNominalChange(
                                  anggota.id,
                                  event.target.value,
                                )
                              }
                              className="h-10 w-32 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ComponentCard>

          <ComponentCard
            title="Bukti Transfer"
            desc="Upload bukti transfer atau tempelkan link gambar."
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Upload bukti transfer</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                  className="h-11 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
                {buktiFileName ? (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    File terpilih: {buktiFileName}
                  </div>
                ) : null}
              </div>
              <div>
                <Label>URL bukti transfer</Label>
                <Input
                  placeholder="Masukkan URL bukti transfer"
                  type="text"
                  value={buktiTransfer}
                  onChange={(event) => setBuktiTransfer(event.target.value)}
                />
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <ComponentCard title="Ringkasan" desc="Pastikan data sudah lengkap.">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Jumlah anggota dipilih</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {selectedIds.size}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Total nominal</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                Rp {formatRupiah(totalNominal)}
              </span>
            </div>
            {error ? (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
                {message}
              </div>
            ) : null}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="sm"
            >
              {submitting ? "Mengirim..." : "Kirim Setoran"}
            </Button>
          </ComponentCard>

          <ComponentCard title="Info" desc="Catatan penting untuk setoran.">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Nominal otomatis dijumlahkan dari anggota yang dipilih. Pastikan
              bukti transfer sudah sesuai sebelum dikirim.
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
