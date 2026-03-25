import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
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

  // Simpan ID jabatan yang sudah dibuat untuk dipakai di tabel Anggota
  const jabatanMap: Record<string, any> = {};

  for (const jab of daftarJabatan) {
    jabatanMap[jab.namaJabatan] = await ensureJabatan({
      namaJabatan: jab.namaJabatan,
      kategori: jab.kategori,
    });
  }

  // 3. Seed Anggota Dummy (Disambungkan ke Jabatan Asli)
  const superadminAnggota = await ensureAnggota({
    nim: "SA-0001",
    nama: "Superadmin",
    noTelepon: "080000000001",
    jabatanId: jabatanMap["Administrator"].id, // Diarahkan ke INTI - Administrator
  });

  const bendaharaAnggota = await ensureAnggota({
    nim: "BE-0001",
    nama: "Bendahara Eksternal",
    noTelepon: "080000000002",
    jabatanId: jabatanMap["Bendahara"].id, // Diarahkan ke INTI - Bendahara
  });

  const bendaharaInternalAnggota = await ensureAnggota({
    nim: "BI-0001",
    nama: "Bendahara Internal",
    noTelepon: "080000000003",
    jabatanId: jabatanMap["Bendahara"].id, // Diarahkan ke INTI - Bendahara
  });

  // 4. Seed User dan Assign Role
  await ensureUserWithRole({
    username: "superadmin",
    password: "superadmin123",
    anggotaId: superadminAnggota.id,
    roleName: "Superadmin",
  });

  await ensureUserWithRole({
    username: "bendahara",
    password: "bendahara123",
    anggotaId: bendaharaAnggota.id,
    roleName: "Bendahara Eksternal",
  });

  await ensureUserWithRole({
    username: "bendahara-internal",
    password: "bendaharaInternal123",
    anggotaId: bendaharaInternalAnggota.id,
    roleName: "Bendahara Internal",
  });

  // 5. Seed Pengaturan KAS
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

  console.log("✅ Seeding Jabatan selesai!");
  console.log("Seeded users:");
  console.log("- superadmin / superadmin123 (Jabatan: Administrator, Role: Superadmin)");
  console.log("- bendahara / bendahara123 (Jabatan: Bendahara, Role: Bendahara Eksternal)");
  console.log("- bendahara-internal / bendaharaInternal123 (Jabatan: Bendahara, Role: Bendahara Internal)");
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