import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const roleNames = ["Bendahara Internal", "Bendahara Eksternal", "Superadmin"];

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const superadminJabatan = await ensureJabatan({
    namaJabatan: "Superadmin",
    kategori: "INTI",
  });

  const bendaharaJabatan = await ensureJabatan({
    namaJabatan: "Bendahara Eksternal",
    kategori: "DIVISI",
  });

  const bendaharaInternalJabatan = await ensureJabatan({
    namaJabatan: "Bendahara Internal",
    kategori: "DIVISI",
  });

  const superadminAnggota = await ensureAnggota({
    nim: "SA-0001",
    nama: "Superadmin",
    noTelepon: "080000000001",
    jabatanId: superadminJabatan.id,
  });

  const bendaharaAnggota = await ensureAnggota({
    nim: "BE-0001",
    nama: "Bendahara Eksternal",
    noTelepon: "080000000002",
    jabatanId: bendaharaJabatan.id,
  });

  const bendaharaInternalAnggota = await ensureAnggota({
    nim: "BI-0001",
    nama: "Bendahara Internal",
    noTelepon: "080000000003",
    jabatanId: bendaharaInternalJabatan.id,
  });

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

  console.log("Seeded users:");
  console.log("superadmin / superadmin123 (Superadmin)");
  console.log("bendahara / bendahara123 (Bendahara Eksternal)");
  console.log("bendahara-internal / bendaharaInternal123 (Bendahara Internal)");
}

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
