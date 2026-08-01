import prisma from './lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "whatsNewSeenVersion" TEXT NOT NULL DEFAULT '1.1.0';`)
  console.log("Column added successfully");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // disconnected automatically?
  })
