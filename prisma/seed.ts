import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password"; // Sesuaikan path ini jika berbeda

const prisma = new PrismaClient();

async function main() {

  // Password local dan production.
  // TO DO: Buat password untuk local dan production berdasarkan variable di env pakai if else
  let password = "";
  if (process.env.NODE_ENV === "production") {
    password = process.env.PASSWORD_PRODUCTION || "ChangePASSWORD_PRODUCTIONpls";
  } else {
    password = process.env.PASSWORD_LOCAL || "password2";
  }

  // 1. Seed Roles (Hak Akses Aplikasi)
  const roleNames = ["Bendahara Internal", "Bendahara Eksternal", "Superadmin"];

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
    { nama: "Abimanyu Gilar Waluyo", noTelepon: "085642324087", jabatan: "Dept. Software", nim: "4.33.24.0.01" },
    { nama: "Agies Mauranzah", noTelepon: "085326777681", jabatan: "Sekretaris", nim: "4.41.24.2.02" },
    { nama: "Agung Hadi Astanto", noTelepon: "08973081307", jabatan: "Litbang", nim: "4.33.23.0.02" },
    { nama: "Aisy Tsabita Amru", noTelepon: "081282078525", jabatan: "Divisi HRD", nim: "4.33.24.0.03" },
    { nama: "Akbar Hakim Muzaky", noTelepon: "085117065501", jabatan: "Divisi HRD", nim: "4.33.24.0.04" },
    { nama: "Alfin Rozzaq Nirwana", noTelepon: "085728141488", jabatan: "Dept. Software", nim: "4.33.24.0.05" },
    { nama: "Aliyya Nufaisah Budiyanto", noTelepon: "089653546282", jabatan: "Dept. Danus", nim: "3.33.24.3.04" },
    { nama: "Annisa Naelil Izati", noTelepon: "088227513683", jabatan: "Divisi Redaksi", nim: "4.33.24.2.03" },
    { nama: "Atha Renata", noTelepon: "085811187679", jabatan: "Dept. Software", nim: "3.34.24.3.03" },
    { nama: "Atsiila Arya Nabiih", noTelepon: "085876221718", jabatan: "Divisi Workshop", nim: "4.33.23.1.04" },
    { nama: "Azzaki Nauval Putra", noTelepon: "081382186653", jabatan: "Dept. Network", nim: "4.31.24.4.05" },
    { nama: "Bagus Sadewa", noTelepon: "085875043431", jabatan: "Divisi KRT", nim: "4.33.23.2.08" },
    { nama: "Benayya Nohan Admiraldo", noTelepon: "089626046100", jabatan: "Dept. Maintenance", nim: "4.33.24.0.08" },
    { nama: "Cantika Alifia Maharani", noTelepon: "0895632188171", jabatan: "Divisi HRD", nim: "4.33.24.1.06" },
    { nama: "Danicha Husna", noTelepon: "083839338825", jabatan: "Divisi HRD", nim: "4.41.24.3.12" },
    { nama: "Danish Mahdi", noTelepon: "087794177076", jabatan: "Divisi Workshop", nim: "4.33.24.0.09" },
    { nama: "Danu Alamsyah Putra", noTelepon: "0895412719404", jabatan: "Divisi Workshop", nim: "4.33.23.1.06" },
    { nama: "Davin Alifianda Adytia", noTelepon: "081327029089", jabatan: "Bendahara", nim: "4.33.23.0.08" },
    { nama: "Diah Dwi Astuti", noTelepon: "0895412575712", jabatan: "Dept. Multimedia", nim: "4.33.24.2.07" },
    { nama: "Dwy Noor Fatimah", noTelepon: "083117373703", jabatan: "Dept. Danus", nim: "4.41.24.1.09" },
    { nama: "Elvira Eka Nurhayati", noTelepon: "0895361318121", jabatan: "Divisi KRT", nim: "4.43.24.2.08" },
    { nama: "Farrel Sheva Basudewa", noTelepon: "087834644104", jabatan: "Divisi Redaksi", nim: "3.34.24.2.09" },
    { nama: "Feby Yuanggi Putri", noTelepon: "0881027538285", jabatan: "Divisi Redaksi", nim: "4.33.24.0.11" },
    { nama: "Frea Aline Aurellia", noTelepon: "087733839075", jabatan: "Sekretaris Umum", nim: "4.31.23.3.09" },
    { nama: "Ghufron Ainun Najib", noTelepon: "089607593219", jabatan: "Dept. Maintenance", nim: "4.33.24.2.10" },
    { nama: "Gilang Maulanata Pramudya", noTelepon: "087863039707", jabatan: "Litbang", nim: "4.33.23.0.11" },
    { nama: "Hafizh Iman Wicaksono", noTelepon: "082138543745", jabatan: "Dept. Danus", nim: "4.33.24.1.10" },
    { nama: "Haikal Utomo Putra", noTelepon: "089696251005", jabatan: "Dept. Danus", nim: "3.34.24.3.10" },
    { nama: "Hany Diah Ramadhani", noTelepon: "0895414886059", jabatan: "Litbang", nim: "4.41.23.1.10" },
    { nama: "Ika Fuji Astuti", noTelepon: "081575162004", jabatan: "Divisi Workshop", nim: "4.41.24.0.17" },
    { nama: "Ilham Vallian Wardoyo Putra", noTelepon: "089669588760", jabatan: "Litbang", nim: "3.34.23.1.13" },
    { nama: "Inas Salsabila Firdaus", noTelepon: "082223961300", jabatan: "Sekretaris", nim: "4.41.23.2.11" },
    { nama: "Irine Luthfia Dani", noTelepon: "0882006978977", jabatan: "Dept. Multimedia", nim: "3.34.24.3.11" },
    { nama: "Johar Awal Khoiroti Widyadarma", noTelepon: "081329156330", jabatan: "Dept. Network", nim: "4.31.24.4.10" },
    { nama: "Jonathan Ordrick Edra Wijaya", noTelepon: "082220047070", jabatan: "Divisi Humas", nim: "4.33.23.1.13" },
    { nama: "Khilda Salsabila Azka", noTelepon: "085804747471", jabatan: "Litbang", nim: "4.33.23.0.15" },
    { nama: "Lucky Laurenshia S.", noTelepon: "081538712485", jabatan: "Dept. Maintenance", nim: "4.44.23.1.14" },
    { nama: "Miftachussurur", noTelepon: "081933521396", jabatan: "Litbang", nim: "4.33.23.1.15" },
    { nama: "Muhamad Haydar Aydin Alhamdani", noTelepon: "081225562697", jabatan: "Administrator", nim: "4.33.23.0.19" },
    { nama: "Muhamad Irfan Ramadhan", noTelepon: "081289212382", jabatan: "Dept. Multimedia", nim: "3.34.24.0.14" },
    { nama: "Muhammad Ihsan Naufal", noTelepon: "085740893435", jabatan: "Dept. Maintenance", nim: "3.11.24.3.18" },
    { nama: "Muhammad Ilham Rijal Thaariq", noTelepon: "085291905080", jabatan: "Divisi KRT", nim: "4.33.24.1.16" },
    { nama: "Muhammad Januar Rifqi Nanda", noTelepon: "08893547439", jabatan: "Dept. Maintenance", nim: "4.33.23.2.21" },
    { nama: "Nabila Az Zahra Munir", noTelepon: "081391193646", jabatan: "Divisi Humas", nim: "4.33.24.2.16" },
    { nama: "Nabila Proletariati Azzura", noTelepon: "082385108728", jabatan: "Bendahara", nim: "4.44.24.2.20" },
    { nama: "Naila Dwista Rastiwi", noTelepon: "089648951799", jabatan: "Divisi Redaksi", nim: "4.41.23.2.17" },
    { nama: "Nisrina Izdihar", noTelepon: "083867409471", jabatan: "Litbang", nim: "4.31.23.3.17" },
    { nama: "Paulus Ale Kristiawan", noTelepon: "088801982508", jabatan: "Divisi KRT", nim: "4.33.24.2.17" },
    { nama: "Putri Levina Agatha", noTelepon: "089508779306", jabatan: "Dept. Multimedia", nim: "4.33.24.1.20" },
    { nama: "Rafif Ali Fahrezi", noTelepon: "085842487757", jabatan: "Divisi HRD", nim: "4.33.24.0.22" },
    { nama: "Rahmalyana Ayuningtyas", noTelepon: "082325516043", jabatan: "Divisi Workshop", nim: "4.33.23.1.20" },
    { nama: "Rahmatul Laila Nuur Arifah", noTelepon: "089605942880", jabatan: "Dept. Multimedia", nim: "4.41.24.1.27" },
    { nama: "Rajaba Hamim Maududi", noTelepon: "085727494511", jabatan: "Divisi Humas", nim: "4.33.24.2.18" },
    { nama: "Rameyza Proletariati", noTelepon: "082385108735", jabatan: "Bendahara", nim: "4.42.24.2.24" },
    { nama: "Ravinka Risdiani Putri", noTelepon: "088902984546", jabatan: "Divisi HRD", nim: "4.41.23.2.24" },
    { nama: "Renaldi Sahril Hidayat", noTelepon: "085714539546", jabatan: "Divisi HRD", nim: "4.31.24.4.17" },
    { nama: "Reza Maulana Fatih", noTelepon: "085771900840", jabatan: "Divisi Redaksi", nim: "4.41.23.2.25" },
    { nama: "Risma Nur Aini", noTelepon: "0895397277061", jabatan: "Sekretaris", nim: "4.43.24.2.22" },
    { nama: "Riztika Merista Indriani", noTelepon: "081227770587", jabatan: "Divisi KRT", nim: "4.33.24.2.19" },
    { nama: "Sabila Anastasia", noTelepon: "0895414918411", jabatan: "Dept. Danus", nim: "4.43.24.2.23" },
    { nama: "Salsabila Rizqi Nurbarokah", noTelepon: "085724187946", jabatan: "Divisi Humas", nim: "3.33.24.1.23" },
    { nama: "Sausan Fadiya Rizqiya", noTelepon: "081284022090", jabatan: "Dept. Software", nim: "3.41.23.2.26" },
    { nama: "Shintia Ratna Dewi", noTelepon: "082324391346", jabatan: "Divisi Humas", nim: "4.41.24.2.24" },
    { nama: "Siti Miftahus Sa'diyah", noTelepon: "0889-8049-7024", jabatan: "Dept. Network", nim: "4.33.24.2.21" },
    { nama: "Suci Wulandari", noTelepon: "085649676108", jabatan: "Divisi Redaksi", nim: "4.31.24.2.23" },
    { nama: "Ummi Imaroh", noTelepon: "083149492496", jabatan: "Dept. Network", nim: "3.34.24.0.24" },
    { nama: "Wahyu Prasetyo Wibowo", noTelepon: "081882870773", jabatan: "Dept. Software", nim: "3.34.24.1.23" },
    { nama: "Warseno Bambang Setyono", noTelepon: "089692174818", jabatan: "Divisi Workshop", nim: "4.33.23.1.25" },
    { nama: "Wisdom Wahyu Aji", noTelepon: "089682303872", jabatan: "Dept. Network", nim: "3.34.24.0.25" },
    { nama: "Zalfa Az Zahra", noTelepon: "085893705985", jabatan: "Dept. Danus", nim: "4.33.24.2.24" }
  ];

  for (const anggota of dataAnggotaPCC) {
    const jabatanTerkait = jabatanMap[anggota.jabatan];
    if (jabatanTerkait) {
      await ensureAnggota({
        nim: anggota.nim,
        nama: anggota.nama,
        noTelepon: anggota.noTelepon,
        jabatanId: jabatanTerkait.id,
      });
    } else {
      console.warn(`⚠️ Jabatan "${anggota.jabatan}" tidak ditemukan untuk ${anggota.nama}!`);
    }
  }

  // 5. KONFIGURASI USER YANG AKAN DIBUAT
  // LOOPING UNTUK CREATE USER BERDASARKAN KONFIGURASI
  const userConfigs = [
    // === INTI / SUPERADMIN ===
    { username: "superadmin", nim: "4.33.24.0.09", role: "Superadmin" },

    // === BENDAHARA INTERNAL ===
    { username: "davin.alifianda", nim: "4.33.23.0.08", role: "Bendahara Internal" },
    { username: "nabila.proletariati", nim: "4.44.24.2.20", role: "Bendahara Internal" },
    { username: "rameyza.proletariati", nim: "4.42.24.2.24", role: "Bendahara Internal" },

    // === BENDAHARA EKSTERNAL (Per Jabatan) ===
    { username: "agung.hadi", nim: "4.33.23.0.02", role: "Bendahara Eksternal" }, // Litbang
    { username: "inas.salsabila", nim: "4.41.23.2.11", role: "Bendahara Eksternal" }, // Sekretaris
    { username: "nabila.munir", nim: "4.33.24.2.16", role: "Bendahara Eksternal" }, // Humas
    { username: "danicha.husna", nim: "4.41.24.3.12", role: "Bendahara Eksternal" }, // HRD
    { username: "ilham.rijal", nim: "4.33.24.1.16", role: "Bendahara Eksternal" }, // KRT
    { username: "hafizh.iman", nim: "4.33.24.1.10", role: "Bendahara Eksternal" }, // Danus
    { username: "ihsan.naufal", nim: "3.11.24.3.18", role: "Bendahara Eksternal" }, // Maintenance
    { username: "feby.yuanggi", nim: "4.33.24.0.11", role: "Bendahara Eksternal" }, // Redaksi
    { username: "warseno.bambang", nim: "4.33.23.1.25", role: "Bendahara Eksternal" }, // Workshop
    { username: "ummi.imaroh", nim: "3.34.24.0.24", role: "Bendahara Eksternal" }, // Network
    { username: "abimanyu.gilar", nim: "4.33.24.0.01", role: "Bendahara Eksternal" }, // Software
    { username: "irine.luthfia", nim: "3.34.24.3.11", role: "Bendahara Eksternal" }, // Multimedia
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
      tanggalMulai: new Date("2026-03-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2027-03-01T00:00:00.000Z"),
    },
    create: {
      id: 1,
      targetKasPerBulan: 50000,
      tanggalMulai: new Date("2026-03-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2027-03-01T00:00:00.000Z"),
    },
  });

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
}) {
  return prisma.anggota.upsert({
    where: { nim: input.nim },
    update: {
      nama: input.nama,
      noTelepon: input.noTelepon,
      jabatanId: input.jabatanId,
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