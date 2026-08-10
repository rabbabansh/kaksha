import prisma from '../lib/prisma';
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("Users:", users);
  const sessions = await prisma.session.findMany({ select: { id: true, userId: true } });
  console.log("Sessions:", sessions);
}
main();
