import prisma from '../lib/prisma';
async function main() {
  const result = await prisma.session.updateMany({
    where: {
      type: 'MOCK',
      year: null
    },
    data: {
      type: 'PRACTICE_MODULE'
    }
  });
  console.log("Updated sessions:", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
