import Link from "next/link";

type StatCard = {
  title: string;
  value: string;
  subtitle: string;
};

type ActionLink = {
  label: string;
  href: string;
  description: string;
};

const stats: StatCard[] = [
  {
    title: "Saldo Kas",
    value: "Rp 0",
    subtitle: "Total kas terkini setelah verifikasi.",
  },
  {
    title: "Setoran Pending",
    value: "0",
    subtitle: "Menunggu verifikasi bendahara internal.",
  },
  {
    title: "Pengajuan Tarik Dana",
    value: "0",
    subtitle: "Permintaan baru yang perlu ditinjau.",
  },
];

const actions: ActionLink[] = [
  {
    label: "Setor KAS",
    href: "/kas/setor",
    description: "Input setoran anggota dan unggah bukti.",
  },
  {
    label: "Riwayat Setoran",
    href: "/kas/history",
    description: "Pantau status setoran dan revisi jika perlu.",
  },
  {
    label: "Verifikasi Setoran",
    href: "/kas/verifikasi",
    description: "Cek setoran yang menunggu persetujuan.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Dashboard Overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
              Ringkasan KAS Organisasi
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Lihat status kas terkini dan akses cepat ke aktivitas penting.
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Sistem Aktif
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item: StatCard) => (
          <div
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {item.title}
            </p>
            <div className="mt-3 text-2xl font-semibold text-zinc-900">
              {item.value}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{item.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Aktivitas Cepat
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Jalankan proses utama KAS dengan satu klik.
          </p>
          <div className="mt-5 grid gap-3">
            {actions.map((action: ActionLink) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div>
                  <div className="font-semibold text-zinc-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {action.description}
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Catatan Hari Ini
          </h2>
          <div className="mt-4 space-y-4 text-sm text-zinc-600">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-900">Fokus Verifikasi</div>
              <p className="mt-1 text-xs text-zinc-500">
                Pastikan setoran yang masuk diverifikasi agar saldo selalu akurat.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-900">Reminder Anggota</div>
              <p className="mt-1 text-xs text-zinc-500">
                Gunakan daftar anggota untuk mengingatkan pembayaran tepat waktu.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="font-semibold text-zinc-900">Transparansi</div>
              <p className="mt-1 text-xs text-zinc-500">
                Simpan bukti transfer dan nota agar laporan lebih rapi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
