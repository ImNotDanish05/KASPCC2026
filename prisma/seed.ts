import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password"; // Sesuaikan path ini jika berbeda

const prisma = new PrismaClient();

async function main() {

  // Password local dan production.
  // TO DO: Buat password untuk local dan production berdasarkan variable di env pakai if else
  let password = "";
  if (process.env.NODE_ENV === "production") {
    password = process.env.PASSWORD_PRODUCTION || "Ba:F)Q1|]b+8W6£$";
  } else {
    password = process.env.PASSWORD_LOCAL || "password";
  }

  // 1. Konfigurasi Awal
  // Seed Roles (Hak Akses Aplikasi)
  const roleNames = ["Bendahara Internal", "Bendahara Eksternal", "Superadmin"];
  // Deklarasi Tanggal Awal
  const defaultTanggalMulai = new Date("2026-03-01T00:00:00.000Z");

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Seed Jabatan (Struktur Organisasi PCC)
  const daftarJabatan: Array<{ namaJabatan: string; kategori: "INTI" | "DIVISI" | "DEPARTEMEN" }> = [
    { namaJabatan: "Administrator", kategori: "INTI" },
    { namaJabatan: "Sekretaris Umum", kategori: "INTI" },
    { namaJabatan: "Sekretaris", kategori: "INTI" },
    { namaJabatan: "Litbang", kategori: "INTI" },
    { namaJabatan: "Bendahara", kategori: "INTI" },
    { namaJabatan: "Divisi Humas", kategori: "DIVISI" },
    { namaJabatan: "Divisi HRD", kategori: "DIVISI" },
    { namaJabatan: "Divisi KRT", kategori: "DIVISI" },
    { namaJabatan: "Divisi Redaksi", kategori: "DIVISI" },
    { namaJabatan: "Divisi Workshop", kategori: "DIVISI" },
    { namaJabatan: "Dept. Danus", kategori: "DEPARTEMEN" },
    { namaJabatan: "Dept. Maintenance", kategori: "DEPARTEMEN" },
    { namaJabatan: "Dept. Network", kategori: "DEPARTEMEN" },
    { namaJabatan: "Dept. Software", kategori: "DEPARTEMEN" },
    { namaJabatan: "Dept. Multimedia", kategori: "DEPARTEMEN" },
  ];

  const jabatanMap: Record<string, any> = {};

  for (const jab of daftarJabatan) {
    jabatanMap[jab.namaJabatan] = await ensureJabatan({
      namaJabatan: jab.namaJabatan,
      kategori: jab.kategori,
    });
  }

  // 4. Seed Anggota Asli dari Data PCC 2025/2026
  const dataAnggotaPCC = [
    { nama: "Abimanyu Gilar Waluyo", noTelepon: "080000000001", jabatan: "Dept. Software", nim: "0.00.00.0.01" },
    { nama: "Agies Mauranzah", noTelepon: "080000000002", jabatan: "Sekretaris", nim: "0.00.00.0.02" },
    { nama: "Agung Hadi Astanto", noTelepon: "080000000003", jabatan: "Litbang", nim: "0.00.00.0.03" },
    { nama: "Aisy Tsabita Amru", noTelepon: "080000000004", jabatan: "Divisi HRD", nim: "0.00.00.0.04" },
    { nama: "Akbar Hakim Muzaky", noTelepon: "080000000005", jabatan: "Divisi HRD", nim: "0.00.00.0.05" },
    { nama: "Alfin Rozzaq Nirwana", noTelepon: "080000000006", jabatan: "Dept. Software", nim: "0.00.00.0.06" },
    { nama: "Aliyya Nufaisah Budiyanto", noTelepon: "080000000007", jabatan: "Dept. Danus", nim: "0.00.00.0.07" },
    { nama: "Annisa Naelil Izati", noTelepon: "080000000008", jabatan: "Divisi Redaksi", nim: "0.00.00.0.08" },
    { nama: "Atha Renata", noTelepon: "080000000009", jabatan: "Dept. Software", nim: "0.00.00.0.09" },
    { nama: "Atsiila Arya Nabiih", noTelepon: "080000000010", jabatan: "Divisi Workshop", nim: "0.00.00.0.10" },
    { nama: "Azzaki Nauval Putra", noTelepon: "080000000011", jabatan: "Dept. Network", nim: "0.00.00.0.11" },
    { nama: "Bagus Sadewa", noTelepon: "080000000012", jabatan: "Divisi KRT", nim: "0.00.00.0.12" },
    { nama: "Benayya Nohan Admiraldo", noTelepon: "080000000013", jabatan: "Dept. Maintenance", nim: "0.00.00.0.13" },
    { nama: "Cantika Alifia Maharani", noTelepon: "080000000014", jabatan: "Divisi HRD", nim: "0.00.00.0.14" },
    { nama: "Danicha Husna", noTelepon: "080000000015", jabatan: "Divisi HRD", nim: "0.00.00.0.15" },
    { nama: "Danish Mahdi", noTelepon: "080000000016", jabatan: "Divisi Workshop", nim: "0.00.00.0.16" },
    { nama: "Danu Alamsyah Putra", noTelepon: "080000000017", jabatan: "Divisi Workshop", nim: "0.00.00.0.17" },
    { nama: "Davin Alifianda Adytia", noTelepon: "080000000018", jabatan: "Bendahara", nim: "0.00.00.0.18" },
    { nama: "Diah Dwi Astuti", noTelepon: "080000000019", jabatan: "Dept. Multimedia", nim: "0.00.00.0.19" },
    { nama: "Dwy Noor Fatimah", noTelepon: "080000000020", jabatan: "Dept. Danus", nim: "0.00.00.0.20" },
    { nama: "Elvira Eka Nurhayati", noTelepon: "080000000021", jabatan: "Divisi KRT", nim: "0.00.00.0.21" },
    { nama: "Farrel Sheva Basudewa", noTelepon: "080000000022", jabatan: "Divisi Redaksi", nim: "0.00.00.0.22" },
    { nama: "Feby Yuanggi Putri", noTelepon: "080000000023", jabatan: "Divisi Redaksi", nim: "0.00.00.0.23" },
    { nama: "Frea Aline Aurellia", noTelepon: "080000000024", jabatan: "Sekretaris Umum", nim: "0.00.00.0.24" },
    { nama: "Ghufron Ainun Najib", noTelepon: "080000000025", jabatan: "Dept. Maintenance", nim: "0.00.00.0.25" },
    { nama: "Gilang Maulanata Pramudya", noTelepon: "080000000026", jabatan: "Litbang", nim: "0.00.00.0.26" },
    { nama: "Hafizh Iman Wicaksono", noTelepon: "080000000027", jabatan: "Dept. Danus", nim: "0.00.00.0.27" },
    { nama: "Haikal Utomo Putra", noTelepon: "080000000028", jabatan: "Dept. Danus", nim: "0.00.00.0.28" },
    { nama: "Hany Diah Ramadhani", noTelepon: "080000000029", jabatan: "Litbang", nim: "0.00.00.0.29" },
    { nama: "Ika Fuji Astuti", noTelepon: "080000000030", jabatan: "Divisi Workshop", nim: "0.00.00.0.30" },
    { nama: "Ilham Vallian Wardoyo Putra", noTelepon: "080000000031", jabatan: "Litbang", nim: "0.00.00.0.31" },
    { nama: "Inas Salsabila Firdaus", noTelepon: "080000000032", jabatan: "Sekretaris", nim: "0.00.00.0.32" },
    { nama: "Irine Luthfia Dani", noTelepon: "080000000033", jabatan: "Dept. Multimedia", nim: "0.00.00.0.33" },
    { nama: "Johar Awal Khoiroti Widyadarma", noTelepon: "080000000034", jabatan: "Dept. Network", nim: "0.00.00.0.34" },
    { nama: "Jonathan Ordrick Edra Wijaya", noTelepon: "080000000035", jabatan: "Divisi Humas", nim: "0.00.00.0.35" },
    { nama: "Khilda Salsabila Azka", noTelepon: "080000000036", jabatan: "Litbang", nim: "0.00.00.0.36" },
    { nama: "Lucky Laurenshia S.", noTelepon: "080000000037", jabatan: "Dept. Maintenance", nim: "0.00.00.0.37" },
    { nama: "Miftachussurur", noTelepon: "080000000038", jabatan: "Litbang", nim: "0.00.00.0.38" },
    { nama: "Muhamad Haydar Aydin Alhamdani", noTelepon: "080000000039", jabatan: "Administrator", nim: "0.00.00.0.39" },
    { nama: "Muhamad Irfan Ramadhan", noTelepon: "080000000040", jabatan: "Dept. Multimedia", nim: "0.00.00.0.40" },
    { nama: "Muhammad Ihsan Naufal", noTelepon: "080000000041", jabatan: "Dept. Maintenance", nim: "0.00.00.0.41" },
    { nama: "Muhammad Ilham Rijal Thaariq", noTelepon: "080000000042", jabatan: "Divisi KRT", nim: "0.00.00.0.42" },
    { nama: "Muhammad Januar Rifqi Nanda", noTelepon: "080000000043", jabatan: "Dept. Maintenance", nim: "0.00.00.0.43" },
    { nama: "Nabila Az Zahra Munir", noTelepon: "080000000044", jabatan: "Divisi Humas", nim: "0.00.00.0.44" },
    { nama: "Nabila Proletariati Azzura", noTelepon: "080000000045", jabatan: "Bendahara", nim: "0.00.00.0.45" },
    { nama: "Naila Dwista Rastiwi", noTelepon: "080000000046", jabatan: "Divisi Redaksi", nim: "0.00.00.0.46" },
    { nama: "Nisrina Izdihar", noTelepon: "080000000047", jabatan: "Litbang", nim: "0.00.00.0.47" },
    { nama: "Paulus Ale Kristiawan", noTelepon: "080000000048", jabatan: "Divisi KRT", nim: "0.00.00.0.48" },
    { nama: "Putri Levina Agatha", noTelepon: "080000000049", jabatan: "Dept. Multimedia", nim: "0.00.00.0.49" },
    { nama: "Rafif Ali Fahrezi", noTelepon: "080000000050", jabatan: "Divisi HRD", nim: "0.00.00.0.50" },
    { nama: "Rahmalyana Ayuningtyas", noTelepon: "080000000051", jabatan: "Divisi Workshop", nim: "0.00.00.0.51" },
    { nama: "Rahmatul Laila Nuur Arifah", noTelepon: "080000000052", jabatan: "Dept. Multimedia", nim: "0.00.00.0.52" },
    { nama: "Rajaba Hamim Maududi", noTelepon: "080000000053", jabatan: "Divisi Humas", nim: "0.00.00.0.53" },
    { nama: "Rameyza Proletariati", noTelepon: "080000000054", jabatan: "Bendahara", nim: "0.00.00.0.54" },
    { nama: "Ravinka Risdiani Putri", noTelepon: "080000000055", jabatan: "Divisi HRD", nim: "0.00.00.0.55" },
    { nama: "Renaldi Sahril Hidayat", noTelepon: "080000000056", jabatan: "Divisi HRD", nim: "0.00.00.0.56" },
    { nama: "Reza Maulana Fatih", noTelepon: "080000000057", jabatan: "Divisi Redaksi", nim: "0.00.00.0.57" },
    { nama: "Risma Nur Aini", noTelepon: "080000000058", jabatan: "Sekretaris", nim: "0.00.00.0.58" },
    { nama: "Riztika Merista Indriani", noTelepon: "080000000059", jabatan: "Divisi KRT", nim: "0.00.00.0.59" },
    { nama: "Sabila Anastasia", noTelepon: "080000000060", jabatan: "Dept. Danus", nim: "0.00.00.0.60" },
    { nama: "Salsabila Rizqi Nurbarokah", noTelepon: "080000000061", jabatan: "Divisi Humas", nim: "0.00.00.0.61" },
    { nama: "Sausan Fadiya Rizqiya", noTelepon: "080000000062", jabatan: "Dept. Software", nim: "0.00.00.0.62" },
    { nama: "Shintia Ratna Dewi", noTelepon: "080000000063", jabatan: "Divisi Humas", nim: "0.00.00.0.63" },
    { nama: "Siti Miftahus Sa'diyah", noTelepon: "080000000064", jabatan: "Dept. Network", nim: "0.00.00.0.64" },
    { nama: "Suci Wulandari", noTelepon: "080000000065", jabatan: "Divisi Redaksi", nim: "0.00.00.0.65" },
    { nama: "Ummi Imaroh", noTelepon: "080000000066", jabatan: "Dept. Network", nim: "0.00.00.0.66" },
    { nama: "Wahyu Prasetyo Wibowo", noTelepon: "080000000067", jabatan: "Dept. Software", nim: "0.00.00.0.67" },
    { nama: "Warseno Bambang Setyono", noTelepon: "080000000068", jabatan: "Divisi Workshop", nim: "0.00.00.0.68" },
    { nama: "Wisdom Wahyu Aji", noTelepon: "080000000069", jabatan: "Dept. Network", nim: "0.00.00.0.69" },
    { nama: "Zalfa Az Zahra", noTelepon: "080000000070", jabatan: "Dept. Danus", nim: "0.00.00.0.70" }
  ];

  for (const anggota of dataAnggotaPCC) {
    const jabatanTerkait = jabatanMap[anggota.jabatan];
    if (jabatanTerkait) {
      await ensureAnggota({
        nim: anggota.nim,
        nama: anggota.nama,
        noTelepon: anggota.noTelepon,
        jabatanId: jabatanTerkait.id,
        lunasSampai: defaultTanggalMulai,
      });
    } else {
      console.warn(`⚠️ Jabatan "${anggota.jabatan}" tidak ditemukan untuk ${anggota.nama}!`);
    }
  }

  // 5. KONFIGURASI USER YANG AKAN DIBUAT
  // LOOPING UNTUK CREATE USER BERDASARKAN KONFIGURASI
  const userConfigs = [
    // === INTI / SUPERADMIN ===
    { username: "superadmin", nim: "0.00.00.0.16", role: "Superadmin" }, // Danish Mahdi

    // === BENDAHARA INTERNAL ===
    { username: "davin.alifianda", nim: "0.00.00.0.18", role: "Bendahara Internal" },
    { username: "nabila.proletariati", nim: "0.00.00.0.45", role: "Bendahara Internal" },
    { username: "rameyza.proletariati", nim: "0.00.00.0.54", role: "Bendahara Internal" },

    // === BENDAHARA EKSTERNAL (Per Jabatan) ===
    { username: "agung.hadi", nim: "0.00.00.0.03", role: "Bendahara Eksternal" }, // Litbang
    { username: "inas.salsabila", nim: "0.00.00.0.32", role: "Bendahara Eksternal" }, // Sekretaris
    { username: "nabila.munir", nim: "0.00.00.0.44", role: "Bendahara Eksternal" }, // Humas
    { username: "danicha.husna", nim: "0.00.00.0.15", role: "Bendahara Eksternal" }, // HRD
    { username: "ilham.rijal", nim: "0.00.00.0.42", role: "Bendahara Eksternal" }, // KRT
    { username: "hafizh.iman", nim: "0.00.00.0.27", role: "Bendahara Eksternal" }, // Danus
    { username: "ihsan.naufal", nim: "0.00.00.0.41", role: "Bendahara Eksternal" }, // Maintenance
    { username: "feby.yuanggi", nim: "0.00.00.0.23", role: "Bendahara Eksternal" }, // Redaksi
    { username: "warseno.bambang", nim: "0.00.00.0.68", role: "Bendahara Eksternal" }, // Workshop
    { username: "ummi.imaroh", nim: "0.00.00.0.66", role: "Bendahara Eksternal" }, // Network
    { username: "abimanyu.gilar", nim: "0.00.00.0.01", role: "Bendahara Eksternal" }, // Software
    { username: "irine.luthfia", nim: "0.00.00.0.33", role: "Bendahara Eksternal" }, // Multimedia
  ];

  for (const config of userConfigs) {
    try {
      // Cari anggota berdasarkan NIM yang ada di config
      const anggota = await prisma.anggota.findUniqueOrThrow({
        where: { nim: config.nim }
      });

      // Buat user-nya
      await ensureUserWithRole({
        username: config.username,
        password: password,
        anggotaId: anggota.id,
        roleName: config.role,
      });

      console.log(`👤 User created: ${config.username} (Linked to: ${anggota.nama})`);
    } catch (error) {
      console.error(`❌ Gagal membuat user ${config.username}: NIM ${config.nim} tidak ditemukan di database.`);
    }
  }

  // 6. Seed Pengaturan KAS
  await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: {
      targetKasPerBulan: 50000,
      tanggalMulai: defaultTanggalMulai,
      tanggalAkhir: new Date("2027-03-01T00:00:00.000Z"),
    },
    create: {
      id: 1,
      targetKasPerBulan: 50000,
      tanggalMulai: defaultTanggalMulai,
      tanggalAkhir: new Date("2027-03-01T00:00:00.000Z"),
    },
  });

  // --- 🌟 TAMBAHAN: AUTO-CREATE SUPABASE BUCKETS (Tanpa Manual Club) ---
  console.log("📦 Mencoba membuat Storage Buckets di Supabase...");
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES 
        ('bukti_pemasukan_kas', 'bukti_pemasukan_kas', true),
        ('bukti_pengeluaran_kas', 'bukti_pengeluaran_kas', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ Storage Buckets 'bukti_pemasukan_kas' & 'bukti_pengeluaran_kas' siap!");
  } catch (err) {
    console.warn("⚠️ Gagal membuat bucket via Prisma. (Biasanya karena limitasi user akses di Supabase).", err);
  }

  console.log("✅ Seeding Jabatan & Anggota selesai!");
  console.log("Seeded users:");
  console.log("- superadmin / superadmin123 (Jabatan: Administrator, Role: Superadmin)");
  console.log("- bendahara / bendahara123 (Jabatan: Bendahara, Role: Bendahara Eksternal)");
  console.log("- bendahara-internal / bendaharaInternal123 (Jabatan: Bendahara, Role: Bendahara Internal)");
  console.log(`✅ Total Anggota Asli PCC berhasil di-seed: ${dataAnggotaPCC.length} orang.`);
}

// === HELPER FUNCTIONS ===

async function ensureJabatan(input: {
  namaJabatan: string;
  kategori: "DIVISI" | "DEPARTEMEN" | "INTI";
}) {
  const existing = await prisma.jabatan.findFirst({
    where: {
      namaJabatan: input.namaJabatan,
      kategori: input.kategori,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.jabatan.create({ data: input });
}

async function ensureAnggota(input: {
  nim: string;
  nama: string;
  noTelepon: string;
  jabatanId: number;
  lunasSampai: Date;
}) {
  return prisma.anggota.upsert({
    where: { nim: input.nim },
    update: {
      nama: input.nama,
      noTelepon: input.noTelepon,
      jabatanId: input.jabatanId,
      lunasSampai: input.lunasSampai,
    },
    create: input,
  });
}

async function ensureUserWithRole(input: {
  username: string;
  password: string;
  anggotaId: number;
  roleName: string;
}) {
  const hashed = await hashPassword(input.password);
  const user = await prisma.user.upsert({
    where: { username: input.username },
    update: {
      password: hashed,
      anggotaId: input.anggotaId,
    },
    create: {
      username: input.username,
      password: hashed,
      anggotaId: input.anggotaId,
    },
  });

  const role = await prisma.role.findUnique({
    where: { name: input.roleName },
  });

  if (!role) {
    throw new Error(`Role not found: ${input.roleName}`);
  }

  await prisma.modelHasRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });