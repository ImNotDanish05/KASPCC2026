'use client'

import {
  getAnggotas,
} from "@/lib/actions/anggota.actions";
import { useCallback, useState, useEffect } from "react";
import EnhancedDataTable, { ColumnDef } from "@/components/common/EnhancedDataTable";
import { ExportColumnDef } from "@/lib/utils/excelExport";
import { UserCheck, UserX } from "lucide-react";

type SettingsResponse = {
  data?: {
    id: number;
    target_kas_per_bulan: number;
    tanggal_mulai: string;
    tanggal_akhir: string;
  };
  error?: string;
};

function toDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

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

const KATEGORI_BADGE: Record<string, string> = {
  DIVISI: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  DEPARTEMEN: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  INTI: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

function calculateTotalMonths(start: string, end: string) {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();

  return yearsDiff * 12 + monthsDiff;
}

function getCurrentMonthIndex(startDateStr: string) {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const now = new Date();
  
  const yearsDiff = now.getFullYear() - start.getFullYear();
  const monthsDiff = now.getMonth() - start.getMonth();
  
  return Math.max(0, yearsDiff * 12 + monthsDiff);
}

export default function Rekapitulasi() {
  const [anggotas, setAnggotas] = useState<AnggotaRow[]>([])
  const [targetKas, setTargetKas] = useState<string>("");
  const [tanggalMulai, setTanggalMulai] = useState<string>("");
  const [tanggalAkhir, setTanggalAkhir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalBulan = calculateTotalMonths(tanggalMulai, tanggalAkhir);
  const [pembayaranMap, setPembayaranMap] = useState<Record<number, number>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((payload: SettingsResponse) => {
        if (!active) return;
        if (!payload.data) {
          setError(payload.error ?? "Pengaturan tidak ditemukan.");
          return;
        }
        setTargetKas(String(payload.data.target_kas_per_bulan ?? ""));
        setTanggalMulai(toDateInput(payload.data.tanggal_mulai));
        setTanggalAkhir(toDateInput(payload.data.tanggal_akhir));
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      const [anggotaResult, historyRes] = await Promise.all([
        getAnggotas(),
        fetch("/api/kas/history?status=VERIFIED").then(res => res.json())
      ]);

      if (anggotaResult.success) {
        setAnggotas(anggotaResult.data as AnggotaRow[]);
      } else {
        setError(anggotaResult.error);
      }

      // Hitung akumulasi per anggota
      if (historyRes.data && Array.isArray(historyRes.data)) {
        const accumulation: Record<number, number> = {};
        
        historyRes.data.forEach((pemasukan: any) => {
          pemasukan.details.forEach((detail: any) => {
            const id = detail.anggota_id || detail.anggota?.id;
            const nominal = Number(detail.nominal_bayar || detail.nominalBayar || 0);
            accumulation[id] = (accumulation[id] || 0) + nominal;
          });
        });
        
        setPembayaranMap(accumulation);
      }
    } catch (err) {
      setError("Gagal memproses data riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const targetNominal = Number(targetKas) || 0;
  const totalKewajiban = totalBulan * targetNominal;
  const currentMonthIdx = getCurrentMonthIndex(tanggalMulai);

  const anggotaColumns: ColumnDef[] = [
    { key: "nama", label: "Nama", sortable: true },
    {
      key: "jabatan",
      label: "Jabatan",
      render: (_, anggota: AnggotaRow) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-700 dark:text-white/80">
            {anggota.jabatan.namaJabatan}
          </span>
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
      render: (value: any, anggota: AnggotaRow) =>
        anggota.statusAktif ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
            <UserCheck className="h-3 w-3" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <UserX className="h-3 w-3" />
            Tidak Aktif
          </span>
        ),
    },
    {
      key: "total_bayar",
      label: "Rekap Saldo",
      render: (_, anggota: AnggotaRow) => {
        const totalBayar = pembayaranMap[anggota.id] || 0;
        const sisa = totalKewajiban - totalBayar;
        const isLunasSemua = sisa <= 0;

        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold text-gray-800 dark:text-white">
              Rp {new Intl.NumberFormat("id-ID").format(totalBayar)}
            </div>
            {isLunasSemua ? (
              <span className="text-[10px] font-medium text-success-600 dark:text-success-400">
                Lunas Seluruh Periode
              </span>
            ) : (
              <span className="text-[10px] font-medium text-error-500">
                Kurang: Rp {new Intl.NumberFormat("id-ID").format(sisa)}
              </span>
            )}
          </div>
        );
      }
    },
    ...Array.from({ length: totalBulan }).map((_, i) => {
      const bulanKe = i + 1;
      const minimalBayarUntukLunas = bulanKe * targetNominal;
      
      return {
        key: `bulan-${bulanKe}`,
        label: `Bulan ${bulanKe}`,
        render: (_: any, anggota: AnggotaRow) => {
          const totalBayar = pembayaranMap[anggota.id] || 0;
          const isLunas = targetNominal > 0 && totalBayar >= minimalBayarUntukLunas;
          
          // Logika Tenggat: Jika belum lunas DAN bulan ini sudah lewat/sedang berjalan
          const isOverdue = !isLunas && bulanKe <= currentMonthIdx;

          if (isLunas) {
            return (
              <span className="inline-flex items-center rounded-md bg-success-50 px-2 py-1 text-[10px] font-bold text-success-700 dark:bg-success-500/10 dark:text-success-400">
                LUNAS
              </span>
            );
          }

          if (isOverdue) {
            return (
              <span className="inline-flex items-center rounded-md bg-error-50 px-2 py-1 text-[10px] font-bold text-error-700 dark:bg-error-500/10 dark:text-error-400 animate-pulse">
                TERLAMBAT
              </span>
            );
          }

          return (
            <span className="text-[10px] font-medium text-gray-400 italic">
              Belum
            </span>
          );
        }
      };
    })
  ];

  // Define export columns with relationship flattening
  const anggotaExportColumns: ExportColumnDef[] = [
    { key: "nim", label: "NIM" },
    { key: "nama", label: "Nama" },
    { key: "noTelepon", label: "No. Telepon" },
    { key: "jabatan", label: "Jabatan", relationshipType: "jabatan" },
    { key: "statusAktif", label: "Status Aktif" },
    { key: "user", label: "User Account", relationshipType: "user" },
  ];

  const kategoriFilter = {
    key: "jabatan.namaJabatan", // Nama field di data (mendukung nested)
    label: "Jabatan"
  };

  return (
    <div>
      <EnhancedDataTable
        columns={anggotaColumns}
        data={anggotas}
        title="Rekapitulasi Pembayaran Kas Anggota"
        loading={loading}
        // onCreateClick={openCreateModal}
        filterConfig={kategoriFilter}
        exportColumns={anggotaExportColumns}
        searchPlaceholder="Cari berdasarkan anggota name..."
      />
    </div>
  )
}
