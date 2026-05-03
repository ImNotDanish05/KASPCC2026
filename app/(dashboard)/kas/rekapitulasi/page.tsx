'use client'

import { getAnggotas } from "@/lib/actions/anggota.actions";
import { useCallback, useState, useEffect } from "react";
import EnhancedDataTable, { ColumnDef } from "@/components/common/EnhancedDataTable";
import { UserCheck, UserX, Download, FileSpreadsheet } from "lucide-react";

import * as XLSX from "xlsx-js-style";

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
  tabungan: number;
  lunasSampai: string | null; // ISO date string or null
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

/**
 * Compute plain-text payment status for a given column month.
 * Uses anggota.lunas_sampai directly instead of accumulated payment totals.
 *
 * Column month is identified by (year, month) — day is ignored.
 * - LUNAS     → column month ≤ lunasSampai
 * - TERLAMBAT → column month > lunasSampai (or null) AND column month ≤ today
 * - Belum     → column month > today
 */
function computeMonthStatusByLunas(
  lunasSampaiStr: string | null,
  colYear: number,
  colMonth: number, // 0-based JS month
): "LUNAS" | "TERLAMBAT" | "Belum" {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth(); // 0-based

  // Is this column month in the future relative to today?
  const isFuture =
    colYear > nowYear || (colYear === nowYear && colMonth > nowMonth);
  if (isFuture) return "Belum";

  // Past or current month — check lunas_sampai
  if (!lunasSampaiStr) return "TERLAMBAT"; // never paid

  const lunas = new Date(lunasSampaiStr);
  if (isNaN(lunas.getTime())) return "TERLAMBAT";

  const lunasYear = lunas.getFullYear();
  const lunasMonth = lunas.getMonth(); // 0-based

  // Column month is covered if it is ≤ lunas_sampai (year+month)
  const isCovered =
    colYear < lunasYear ||
    (colYear === lunasYear && colMonth <= lunasMonth);

  return isCovered ? "LUNAS" : "TERLAMBAT";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Rekapitulasi() {
  const [anggotas, setAnggotas] = useState<AnggotaRow[]>([]);
  const [targetKas, setTargetKas] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived values
  const monthLabels = generateMonthLabels(tanggalMulai, tanggalAkhir);
  const targetNominal = Number(targetKas) || 0;

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

  // Fetch anggota only — month status is derived from anggota.lunas_sampai
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const anggotaResult = await getAnggotas();
      if (anggotaResult.success) {
        setAnggotas(anggotaResult.data as AnggotaRow[]);
      } else {
        setError(anggotaResult.error);
      }
    } catch {
      setError("Gagal memuat data anggota.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Export helpers ──────────────────────────────────────────────────────────

  function buildExportRows() {
    // Parse the column month dates once for efficiency
    const colDates = monthLabels.map((label) => {
      // label format: "Mar 2026" — find in MONTHS_ID
      const [mon, yr] = label.split(" ");
      const monthIdx = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"].indexOf(mon);
      return { year: Number(yr), month: monthIdx };
    });

    return anggotas.map((anggota, idx) => {
      const tabungan = anggota.tabungan ?? 0;

      // Count TERLAMBAT months to derive kurang
      const terlambatCount = colDates.filter(
        ({ year, month }) =>
          computeMonthStatusByLunas(anggota.lunasSampai, year, month) === "TERLAMBAT"
      ).length;
      const kurang = terlambatCount * targetNominal;

      const row: Record<string, string | number> = {
        No: idx + 1,
        Nama: anggota.nama,
        Jabatan: anggota.jabatan.namaJabatan,
        Status: anggota.statusAktif ? "Aktif" : "Tidak Aktif",
        "Rekap Saldo": kurang === 0
          ? `Lunas s.d ${anggota.lunasSampai ? new Date(anggota.lunasSampai).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "-"}`
          : `Kurang: Rp ${new Intl.NumberFormat("id-ID").format(kurang)} (${terlambatCount} bln)`,
        Tabungan: tabungan,
      };

      colDates.forEach(({ year, month }, i) => {
        row[monthLabels[i]] = computeMonthStatusByLunas(anggota.lunasSampai, year, month);
      });
      return row;
    });
  }

function handleExportExcel() {
    const rows = buildExportRows();
    if (!rows.length) { alert("Tidak ada data untuk diekspor."); return; }

    const headers = Object.keys(rows[0]);
    
    // Array untuk menampung seluruh baris data beserta styling-nya
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wsData: any[][] = [];

    // --- 1. MEMBUAT JUDUL LAPORAN (HEADER ATAS) ---
    wsData.push([
      {
        v: 'REKAPITULASI PEMBAYARAN KAS KASPCC 2026',
        t: 's',
        s: {
          font: { name: 'Arial', sz: 16, bold: true, color: { rgb: '1F2937' } }, // text-gray-800
          alignment: { vertical: 'center', horizontal: 'left' }
        }
      }
    ]);
    
    wsData.push([
      {
        v: `Target Kas per Bulan: Rp ${new Intl.NumberFormat("id-ID").format(targetNominal)}`,
        t: 's',
        s: {
          font: { name: 'Arial', sz: 11, italic: true, color: { rgb: '6B7280' } } // text-gray-500
        }
      }
    ]);
    
    wsData.push([]); // Baris kosong sebagai jarak

    // --- 2. MEMBUAT HEADER TABEL ---
    const headerRowData = headers.map(h => ({
      v: h,
      t: 's',
      s: {
        fill: { fgColor: { rgb: '2563EB' } }, // blue-600
        font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
        alignment: { vertical: 'center', horizontal: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '1D4ED8' } },
          bottom: { style: 'medium', color: { rgb: '1D4ED8' } },
          left: { style: 'thin', color: { rgb: '1D4ED8' } },
          right: { style: 'thin', color: { rgb: '1D4ED8' } }
        }
      }
    }));
    wsData.push(headerRowData);

    // --- 3. MEMASUKKAN DATA & CONDITIONAL FORMATTING ---
    rows.forEach((rowObj, index) => {
      const rowData = headers.map(h => {
        const val = rowObj[h];
        const isEven = index % 2 === 0;
        const bgColor = isEven ? 'F9FAFB' : 'FFFFFF'; // Zebra striping
        
        let fontColor = '1F2937'; // Default text color
        let bold = false;
        let italic = false;
        let alignH = 'left';

        // Conditional Formatting
        if (h === 'No') {
          alignH = 'center';
        } else if (val === 'LUNAS') {
          fontColor = '059669'; bold = true; alignH = 'center';
        } else if (val === 'TERLAMBAT') {
          fontColor = 'DC2626'; bold = true; alignH = 'center';
        } else if (val === 'Belum') {
          fontColor = '9CA3AF'; italic = true; alignH = 'center';
        } else if (h === 'Status') {
          alignH = 'center';
          if (val === 'Aktif') fontColor = '059669';
          else fontColor = '9CA3AF';
        }

        return {
          v: val,
          t: typeof val === 'number' ? 'n' : 's',
          s: {
            fill: { fgColor: { rgb: bgColor } },
            font: { color: { rgb: fontColor }, bold, italic },
            alignment: { vertical: 'center', horizontal: alignH, wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'E5E7EB' } },
              bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
              left: { style: 'thin', color: { rgb: 'E5E7EB' } },
              right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
          }
        };
      });
      wsData.push(rowData);
    });

    // --- 4. GENERATE WORKSHEET & MENGATUR LEBAR/MERGE ---
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge untuk Judul (baris 0) dan Subjudul (baris 1) dari kolom 0 s.d 6
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });

    // Lebar kolom
    ws['!cols'] = headers.map(h => {
      if (h === 'No') return { wch: 5 };
      if (h === 'Nama') return { wch: 30 };
      if (h === 'Jabatan') return { wch: 20 };
      if (h === 'Status') return { wch: 12 };
      if (h === 'Rekap Saldo') return { wch: 38 };
      if (h === 'Tabungan') return { wch: 20 };
      return { wch: 15 }; // Lebar untuk bulan
    });

    // --- 5. BUNGKUS DAN DOWNLOAD ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapitulasi");
    XLSX.writeFile(wb, `Rekapitulasi-Kas-KASPCC-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      width: "min-w-[180px]",
      render: (_: unknown, anggota: AnggotaRow) => {
        const tabungan = anggota.tabungan ?? 0;
        // Count TERLAMBAT months for this anggota
        const terlambatCount = monthLabels.filter((label, i) => {
          const [mon, yr] = label.split(" ");
          const monthIdx = MONTHS_ID.indexOf(mon);
          return computeMonthStatusByLunas(anggota.lunasSampai, Number(yr), monthIdx) === "TERLAMBAT";
        }).length;
        const kurang = terlambatCount * targetNominal;
        const lunasLabel = anggota.lunasSampai
          ? new Date(anggota.lunasSampai).toLocaleDateString("id-ID", { month: "short", year: "numeric" })
          : null;
        return (
          <div className="flex min-w-[180px] flex-col gap-1">
            {kurang === 0 ? (
              <span className="text-[10px] font-medium text-success-600 dark:text-success-400">
                Lunas s.d {lunasLabel ?? "-"}
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-error-500">
                  Kurang: Rp {new Intl.NumberFormat("id-ID").format(kurang)}
                </span>
                <span className="text-[8px] text-gray-400">{terlambatCount} bulan tunggakan</span>
              </div>
            )}
            <div className="mt-0.5 border-t border-gray-100 pt-0.5 text-[10px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Tabungan: Rp {new Intl.NumberFormat("id-ID").format(tabungan)}
            </div>
          </div>
        );
      },
    },
    // Dynamic month columns — status derived from anggota.lunas_sampai
    ...monthLabels.map((label, i) => {
      const [mon, yr] = label.split(" ");
      const colMonth = MONTHS_ID.indexOf(mon);
      const colYear = Number(yr);
      return {
        key: `bulan-${i}`,
        label,
        render: (_: unknown, anggota: AnggotaRow) => {
          const status = computeMonthStatusByLunas(anggota.lunasSampai, colYear, colMonth);
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
      };
    }),
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
