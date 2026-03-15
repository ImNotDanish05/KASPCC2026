"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Jabatan = {
  id: number;
  namaJabatan: string;
  kategori: "DIVISI" | "DEPARTEMEN" | "INTI";
};

type Anggota = {
  id: number;
  nim: string;
  nama: string;
  noTelepon: string;
  jabatanId: number;
  jabatan?: Jabatan;
};

type Detail = {
  id: number;
  nominalBayar: number;
  anggota: Anggota;
};

type Pemasukan = {
  id: number;
  buktiTransfer: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  alasanTolak: string | null;
  details: Detail[];
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function ResubmitKasPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const pemasukanId = Number(Array.isArray(idParam) ? idParam[0] : idParam);

  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [anggotas, setAnggotas] = useState<Anggota[]>([]);
  const [selectedJabatanId, setSelectedJabatanId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [pemasukan, setPemasukan] = useState<Pemasukan | null>(null);
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
      .then((data) => {
        if (!active) return;
        setJabatans(data.data ?? []);
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
      .then((data) => {
        if (!active) return;
        setAnggotas(data.data ?? []);
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
      .then((payload) => {
        if (!active) return;
        const data = payload.data ?? [];
        const found = data.find((item: Pemasukan) => item.id === pemasukanId);
        if (!found) {
          setError("Data tidak ditemukan.");
        } else {
          setPemasukan(found);
          setBuktiTransfer(found.buktiTransfer ?? "");
          const nextSelected = new Set<number>();
          const nextNominal: Record<number, string> = {};
          found.details.forEach((detail) => {
            nextSelected.add(detail.anggota.id);
            nextNominal[detail.anggota.id] = String(detail.nominalBayar);
          });
          setSelectedIds(nextSelected);
          setNominalById(nextNominal);
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat data.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [pemasukanId]);

  const totalNominal = useMemo(() => {
    let total = 0;
    selectedIds.forEach((id) => {
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
      .map((id) => ({
        anggotaId: id,
        nominalBayar: Number(nominalById[id]),
      }))
      .filter((item) => Number.isFinite(item.nominalBayar) && item.nominalBayar > 0);

    if (!buktiTransfer) {
      setError("Bukti transfer wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setError("Pilih anggota dan isi nominalnya terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/kas/resubmit/${pemasukanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buktiTransfer,
          items,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal mengirim ulang.");
      }
      setMessage("Setoran berhasil dikirim ulang. Menunggu verifikasi.");
      setTimeout(() => {
        router.push("/kas/history");
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
          Memuat data revisi...
        </div>
      </div>
    );
  }

  if (!pemasukan) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-red-600 shadow-sm">
          {error ?? "Data tidak ditemukan."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Revisi Setoran #{pemasukan.id}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Perbaiki data setoran yang ditolak lalu kirim ulang.
          </p>
          {pemasukan.alasanTolak ? (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Alasan penolakan: {pemasukan.alasanTolak}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  Cari anggota
                </label>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama atau NIM"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2 sm:w-56">
                <label className="text-sm font-medium text-zinc-700">
                  Filter jabatan
                </label>
                <select
                  value={selectedJabatanId}
                  onChange={(event) => setSelectedJabatanId(event.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                >
                  <option value="">Semua jabatan</option>
                  {jabatans.map((jabatan) => (
                    <option key={jabatan.id} value={String(jabatan.id)}>
                      {jabatan.namaJabatan}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-3">Pilih</th>
                    <th className="px-3">Nama</th>
                    <th className="px-3">NIM</th>
                    <th className="px-3">Jabatan</th>
                    <th className="px-3">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAnggota ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                      >
                        Memuat data anggota...
                      </td>
                    </tr>
                  ) : anggotas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500"
                      >
                        Tidak ada anggota ditemukan.
                      </td>
                    </tr>
                  ) : (
                    anggotas.map((anggota) => {
                      const checked = selectedIds.has(anggota.id);
                      return (
                        <tr
                          key={anggota.id}
                          className="rounded-lg bg-zinc-50 text-sm text-zinc-700"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAnggota(anggota.id)}
                              className="h-4 w-4 rounded border-zinc-300"
                            />
                          </td>
                          <td className="px-3 py-3 font-medium text-zinc-900">
                            {anggota.nama}
                          </td>
                          <td className="px-3 py-3">{anggota.nim}</td>
                          <td className="px-3 py-3">
                            {anggota.jabatan?.namaJabatan ?? "-"}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min={0}
                              disabled={!checked}
                              value={nominalById[anggota.id] ?? ""}
                              onChange={(event) =>
                                handleNominalChange(anggota.id, event.target.value)
                              }
                              className="w-32 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none disabled:bg-zinc-100"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Bukti Transfer
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Upload bukti transfer baru atau perbarui link.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                  className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
                />
                {buktiFileName ? (
                  <div className="text-xs text-zinc-500">
                    File terpilih: {buktiFileName}
                  </div>
                ) : null}
                <input
                  value={buktiTransfer}
                  onChange={(event) => setBuktiTransfer(event.target.value)}
                  placeholder="Atau masukkan URL bukti transfer"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Ringkasan</h2>
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
                <span>Jumlah anggota dipilih</span>
                <span className="font-semibold text-zinc-900">
                  {selectedIds.size}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-zinc-600">
                <span>Total nominal</span>
                <span className="font-semibold text-zinc-900">
                  Rp {formatRupiah(totalNominal)}
                </span>
              </div>
              {error ? (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {submitting ? "Mengirim..." : "Kirim Ulang"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
