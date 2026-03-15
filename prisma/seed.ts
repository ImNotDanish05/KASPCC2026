import { PrismaClient } from "@prisma/client";

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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
