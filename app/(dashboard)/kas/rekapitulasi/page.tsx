'use client'

import { getAnggotas } from "@/lib/actions/anggota.actions";
import { useCallback, useState, useEffect } from "react";
import EnhancedDataTable, { ColumnDef } from "@/components/common/EnhancedDataTable";
import { UserCheck, UserX, Download, FileSpreadsheet } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsResponse = {
  data?: {
    id: number;
    target_kas_per_bulan: number;
    tanggal_mulai: string;
    tanggal_akhir: string;
  };
  error?: string;
};

type JabatanOption = {
  id: number;
  namaJabatan: string;
  kategori: string;
};

type AnggotaRow = {
  id: number;
  nim: string;
  nama: string;
  noTelepon: string;
  jabatanId: number;
  statusAktif: boolean;
  jabatan: JabatanOption;
  user: { id: number; username: string } | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const KATEGORI_BADGE: Record<string, string> = {
  DIVISI: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  DEPARTEMEN: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  INTI: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// ── Pure Helpers ──────────────────────────────────────────────────────────────

function toDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/**
 * Generate an array of "MMM YYYY" labels (Indonesian) from tanggalMulai to
 * tanggalAkhir, inclusive of both endpoints.
 */
function generateMonthLabels(start: string, end: string): string[] {
  if (!start || !end) return [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];

  const labels: string[] = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cur <= last) {
    labels.push(`${MONTHS_ID[cur.getMonth()]} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return labels;
}

/** How many months have elapsed since tanggalMulai (0-based). */
function getCurrentMonthIndex(startDateStr: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const now = new Date();
  const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, diff);
}

/** Compute plain-text status for a given month index (0-based). */
function computeMonthStatus(
  anggotaId: number,
  monthIndex: number,
  pembayaranMap: Record<number, number>,
  targetNominal: number,
  currentMonthIdx: number,
): "LUNAS" | "TERLAMBAT" | "Belum" {
  const bulanKe = monthIndex + 1;
  const totalBayar = pembayaranMap[anggotaId] ?? 0;
  const isLunas = targetNominal > 0 && totalBayar >= bulanKe * targetNominal;
  if (isLunas) return "LUNAS";
  if (bulanKe <= currentMonthIdx) return "TERLAMBAT";
  return "Belum";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Rekapitulasi() {
  const [anggotas, setAnggotas] = useState<AnggotaRow[]>([]);
  const [targetKas, setTargetKas] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pembayaranMap, setPembayaranMap] = useState<Record<number, number>>({});

  // Derived values
  const monthLabels = generateMonthLabels(tanggalMulai, tanggalAkhir);
  const targetNominal = Number(targetKas) || 0;
  const currentMonthIdx = getCurrentMonthIndex(tanggalMulai);
  const kewajibanHinggaSaatIni = currentMonthIdx * targetNominal;

  // Fetch settings
  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((payload: SettingsResponse) => {
        if (!active) return;
        if (!payload.data) { setError(payload.error ?? "Pengaturan tidak ditemukan."); return; }
        setTargetKas(String(payload.data.target_kas_per_bulan ?? ""));
        setTanggalMulai(toDateInput(payload.data.tanggal_mulai));
        setTanggalAkhir(toDateInput(payload.data.tanggal_akhir));
      })
      .catch(() => { if (active) setError("Gagal memuat pengaturan."); });
    return () => { active = false; };
  }, []);

  // Fetch anggota + kas history
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [anggotaResult, historyRes] = await Promise.all([
        getAnggotas(),
        fetch("/api/kas/history?status=VERIFIED").then((r) => r.json()),
      ]);
      if (anggotaResult.success) {
        setAnggotas(anggotaResult.data as AnggotaRow[]);
      } else {
        setError(anggotaResult.error);
      }
      if (historyRes.data && Array.isArray(historyRes.data)) {
        const acc: Record<number, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        historyRes.data.forEach((pemasukan: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pemasukan.details?.forEach((detail: any) => {
            const id = detail.anggota_id ?? detail.anggota?.id;
            const nominal = Number(detail.nominal_bayar ?? detail.nominalBayar ?? 0);
            if (id) acc[id] = (acc[id] ?? 0) + nominal;
          });
        });
        setPembayaranMap(acc);
      }
    } catch {
      setError("Gagal memproses data riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Export helpers ──────────────────────────────────────────────────────────

  function buildExportRows() {
    return anggotas.map((anggota, idx) => {
      const totalBayar = pembayaranMap[anggota.id] ?? 0;
      const sisa = kewajibanHinggaSaatIni - totalBayar;
      const row: Record<string, string | number> = {
        No: idx + 1,
        Nama: anggota.nama,
        Jabatan: anggota.jabatan.namaJabatan,
        Status: anggota.statusAktif ? "Aktif" : "Tidak Aktif",
        "Rekap Saldo": `Rp ${new Intl.NumberFormat("id-ID").format(totalBayar)} ${sisa <= 0 ? "(Lunas)" : `(Kurang Rp ${new Intl.NumberFormat("id-ID").format(sisa)})`}`,
      };
      monthLabels.forEach((label, i) => {
        row[label] = computeMonthStatus(anggota.id, i, pembayaranMap, targetNominal, currentMonthIdx);
      });
      return row;
    });
  }

  function handleExportExcel() {
    const rows = buildExportRows();
    if (!rows.length) { alert("Tidak ada data untuk diekspor."); return; }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapitulasi");
    XLSX.writeFile(wb, "rekapitulasi-kas.xlsx");
  }

  function handleExportCSV() {
    const rows = buildExportRows();
    if (!rows.length) { alert("Tidak ada data untuk diekspor."); return; }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rekapitulasi-kas.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Column definitions ──────────────────────────────────────────────────────

  const anggotaColumns: ColumnDef[] = [
    { key: "nama", label: "Nama", sortable: true },
    {
      key: "jabatan",
      label: "Jabatan",
      render: (_: unknown, anggota: AnggotaRow) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-700 dark:text-white/80">{anggota.jabatan.namaJabatan}</span>
          <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${KATEGORI_BADGE[anggota.jabatan.kategori] ?? ""}`}>
            {anggota.jabatan.kategori}
          </span>
        </div>
      ),
    },
    {
      key: "statusAktif",
      label: "Status",
      sortable: true,
      render: (_: unknown, anggota: AnggotaRow) =>
        anggota.statusAktif ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
            <UserCheck className="h-3 w-3" />Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <UserX className="h-3 w-3" />Tidak Aktif
          </span>
        ),
    },
    {
      key: "total_bayar",
      label: "Rekap Saldo",
      render: (_: unknown, anggota: AnggotaRow) => {
        const totalBayar = pembayaranMap[anggota.id] ?? 0;
        const sisa = kewajibanHinggaSaatIni - totalBayar;
        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold text-gray-800 dark:text-white">
              Rp {new Intl.NumberFormat("id-ID").format(totalBayar)}
            </div>
            {sisa <= 0 ? (
              <span className="text-[10px] font-medium text-success-600 dark:text-success-400">
                Lunas (s.d Bulan {currentMonthIdx})
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-error-500">
                  Kurang: Rp {new Intl.NumberFormat("id-ID").format(sisa)}
                </span>
                <span className="text-[8px] text-gray-400">Tunggakan s.d saat ini</span>
              </div>
            )}
          </div>
        );
      },
    },
    // Dynamic month columns — labels are real month/year from settings
    ...monthLabels.map((label, i) => ({
      key: `bulan-${i}`,
      label,
      render: (_: unknown, anggota: AnggotaRow) => {
        const status = computeMonthStatus(anggota.id, i, pembayaranMap, targetNominal, currentMonthIdx);
        if (status === "LUNAS") {
          return (
            <span className="inline-flex items-center rounded-md bg-success-50 px-2 py-1 text-[10px] font-bold text-success-700 dark:bg-success-500/10 dark:text-success-400">
              LUNAS
            </span>
          );
        }
        if (status === "TERLAMBAT") {
          return (
            <span className="inline-flex animate-pulse items-center rounded-md bg-error-50 px-2 py-1 text-[10px] font-bold text-error-700 dark:bg-error-500/10 dark:text-error-400">
              TERLAMBAT
            </span>
          );
        }
        return <span className="text-[10px] font-medium italic text-gray-400">Belum</span>;
      },
    })),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Export toolbar — replaces the removed Import button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleExportExcel}
          disabled={loading || anggotas.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Export Excel
        </button>
        <button
          onClick={handleExportCSV}
          disabled={loading || anggotas.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4 text-blue-600" />
          Export CSV
        </button>
      </div>

      <EnhancedDataTable
        columns={anggotaColumns}
        data={anggotas}
        title="Rekapitulasi Pembayaran Kas Anggota"
        loading={loading}
        error={error ?? ""}
        filterConfig={{ key: "jabatan.namaJabatan", label: "Jabatan" }}
        showExport={false}
        showImport={false}
        searchPlaceholder="Cari berdasarkan nama anggota..."
      />
    </div>
  );
}
