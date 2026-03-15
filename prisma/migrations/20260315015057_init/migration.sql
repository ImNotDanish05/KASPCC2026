-- CreateEnum
CREATE TYPE "JabatanKategori" AS ENUM ('DIVISI', 'DEPARTEMEN', 'INTI');

-- CreateEnum
CREATE TYPE "PemasukanStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PengeluaranStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "jabatans" (
    "id" SERIAL NOT NULL,
    "nama_jabatan" TEXT NOT NULL,
    "kategori" "JabatanKategori" NOT NULL,

    CONSTRAINT "jabatans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggotas" (
    "id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "no_telepon" TEXT NOT NULL,
    "jabatan_id" INTEGER NOT NULL,

    CONSTRAINT "anggotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "anggota_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_has_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "model_has_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "pemasukan_kas" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nominal_total" INTEGER NOT NULL,
    "bukti_transfer" TEXT NOT NULL,
    "status" "PemasukanStatus" NOT NULL,
    "alasan_tolak" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemasukan_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_pemasukan_kas" (
    "id" SERIAL NOT NULL,
    "pemasukan_kas_id" INTEGER NOT NULL,
    "anggota_id" INTEGER NOT NULL,
    "nominal_bayar" INTEGER NOT NULL,

    CONSTRAINT "detail_pemasukan_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengeluaran_kas" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "bukti_nota" TEXT NOT NULL,
    "status" "PengeluaranStatus" NOT NULL,
    "alasan_tolak" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengeluaran_kas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anggotas_nim_key" ON "anggotas"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "users_anggota_id_key" ON "users"("anggota_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "anggotas" ADD CONSTRAINT "anggotas_jabatan_id_fkey" FOREIGN KEY ("jabatan_id") REFERENCES "jabatans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemasukan_kas" ADD CONSTRAINT "pemasukan_kas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_pemasukan_kas" ADD CONSTRAINT "detail_pemasukan_kas_pemasukan_kas_id_fkey" FOREIGN KEY ("pemasukan_kas_id") REFERENCES "pemasukan_kas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_pemasukan_kas" ADD CONSTRAINT "detail_pemasukan_kas_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran_kas" ADD CONSTRAINT "pengeluaran_kas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
