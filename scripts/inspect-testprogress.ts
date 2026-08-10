import prisma from '../lib/prisma';
async function main() {
  const tp = await prisma.testProgress.findMany();
  console.log("Total TestProgress:", tp.length);
  if (tp.length > 0) {
    console.log("Sample:", tp[0]);
  }
}
main();
