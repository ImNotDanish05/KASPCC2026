-- DropForeignKey
ALTER TABLE "pengeluaran_kas" DROP CONSTRAINT IF EXISTS "pengeluaran_kas_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "pengeluaran_kas" CASCADE;

-- CreateTable
CREATE TABLE "pengeluaran_kas" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nama_kegiatan" TEXT NOT NULL,
    "total_nominal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengeluaran_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_pengeluaran_kas" (
    "id" SERIAL NOT NULL,
    "pengeluaran_kas_id" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,

    CONSTRAINT "detail_pengeluaran_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bukti_nota_pengeluaran" (
    "id" SERIAL NOT NULL,
    "pengeluaran_kas_id" INTEGER NOT NULL,
    "url_bukti" TEXT NOT NULL,

    CONSTRAINT "bukti_nota_pengeluaran_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "anggotas" ALTER COLUMN "jabatan_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "anggota_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pengeluaran_kas" ADD CONSTRAINT "pengeluaran_kas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_pengeluaran_kas" ADD CONSTRAINT "detail_pengeluaran_kas_pengeluaran_kas_id_fkey" FOREIGN KEY ("pengeluaran_kas_id") REFERENCES "pengeluaran_kas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bukti_nota_pengeluaran" ADD CONSTRAINT "bukti_nota_pengeluaran_pengeluaran_kas_id_fkey" FOREIGN KEY ("pengeluaran_kas_id") REFERENCES "pengeluaran_kas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

